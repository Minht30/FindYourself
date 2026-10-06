// Runs Lighthouse against pages of a running app (use a PRODUCTION build: `npm run build`
// then `npx next start -p 3200`) and prints the four scores and what is holding each
// page back. Signed-in pages need session cookies: pass a Playwright storage-state file
// (`--state path.json`); its cookies are put into the browser the audit runs in and are
// never printed. (Lighthouse's own storage reset would wipe them, so it is switched off,
// and the audit is driven through a page that already holds them.)
//
//   node scripts/lighthouse.mjs --base http://localhost:3200 --state ./state.json
//   node scripts/lighthouse.mjs --base http://localhost:3200 --desktop --only /,/privacy
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import puppeteer from "puppeteer-core";
import desktopConfig from "lighthouse/core/config/desktop-config.js";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};

const base = value("base", "http://localhost:3200").replace(/\/$/, "");
const statePath = value("state", null);
const desktop = flag("desktop");
const outDir = value("out", null);
const PUBLIC = ["/", "/login", "/signup", "/privacy"];
const SIGNED_IN = ["/today", "/diary", "/focus", "/chill", "/settings"];
const only = value("only", null)?.split(",");
const pages = only ?? (statePath ? [...PUBLIC, ...SIGNED_IN] : PUBLIC);

const host = new URL(base).hostname;
const cookies = statePath
  ? JSON.parse(readFileSync(statePath, "utf8")).cookies
      .filter((c) => host === c.domain.replace(/^\./, "") || host.endsWith(c.domain))
      .map((c) => ({ name: c.name, value: c.value, domain: c.domain, path: c.path || "/" }))
  : [];

const CATS = ["performance", "accessibility", "best-practices", "seo"];
const chrome = await chromeLauncher.launch({
  chromeFlags: ["--headless=new", "--no-sandbox"],
  chromePath: process.env.CHROME_PATH || undefined,
});
const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}`, defaultViewport: null });

const results = [];
try {
  for (const p of pages) {
    const url = base + p;
    const page = await browser.newPage();
    const withSession = cookies.length > 0 && SIGNED_IN.includes(p); // public pages are audited as a visitor would see them
    if (withSession) await page.setCookie(...cookies);
    const flags = {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: CATS,
      disableStorageReset: withSession, // keep the session cookie the audit needs
    };
    const run = await lighthouse(url, flags, desktop ? desktopConfig : undefined, page);
    await page.close();
    const lhr = run.lhr;
    const scores = Object.fromEntries(CATS.map((c) => [c, Math.round((lhr.categories[c].score ?? 0) * 100)]));
    const failing = Object.values(lhr.audits)
      .filter((a) => a.score !== null && a.score < 0.9 && !["informative", "manual", "notApplicable"].includes(a.scoreDisplayMode))
      .map((a) => `${a.id} (${Math.round(a.score * 100)})`);
    const finalUrl = lhr.finalDisplayedUrl.replace(base, "") || "/";
    results.push({
      page: p,
      finalUrl,
      scores,
      failing,
      metrics: {
        fcp: lhr.audits["first-contentful-paint"]?.displayValue,
        lcp: lhr.audits["largest-contentful-paint"]?.displayValue,
        tbt: lhr.audits["total-blocking-time"]?.displayValue,
        cls: lhr.audits["cumulative-layout-shift"]?.displayValue,
      },
    });
    if (outDir) {
      mkdirSync(outDir, { recursive: true });
      writeFileSync(path.join(outDir, `${p === "/" ? "home" : p.slice(1).replace(/\//g, "_")}.json`), JSON.stringify(lhr));
    }
  }
} finally {
  await browser.disconnect();
  await chrome.kill();
}

console.log(`Lighthouse ${desktop ? "desktop" : "mobile"} against ${base}`);
let landedElsewhere = 0;
for (const r of results) {
  const s = r.scores;
  // /diary legitimately lands on /diary/TODAY; anything else that moves is worth a warning
  const landed = r.finalUrl.split("?")[0];
  const moved = landed !== r.page && !(r.page === "/diary" && landed.startsWith("/diary/"));
  if (moved) landedElsewhere++;
  console.log(`${r.page.padEnd(10)} perf ${String(s.performance).padStart(3)}  a11y ${String(s.accessibility).padStart(3)}  best ${String(s["best-practices"]).padStart(3)}  seo ${String(s.seo).padStart(3)}${moved ? `  !! ended on ${r.finalUrl}` : ""}`);
  console.log(`           ${r.metrics.fcp} FCP | ${r.metrics.lcp} LCP | ${r.metrics.tbt} TBT | CLS ${r.metrics.cls}`);
  if (r.failing.length) console.log(`           below 90: ${r.failing.join(", ")}`);
}
const worst = Math.min(...results.flatMap((r) => Object.values(r.scores)));
console.log(`lowest score: ${worst}${landedElsewhere ? `  (WARNING: ${landedElsewhere} page(s) redirected, so they audited a different page than asked)` : ""}`);
process.exit(worst >= 90 && !landedElsewhere ? 0 : 1);
