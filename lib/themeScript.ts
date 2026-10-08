import { DAY_REGIONS, NIGHT_ENDS_AT, NIGHT_REGIONS, NIGHT_STARTS_AT, THEME_MODES } from "@/lib/theme";
import { THEME_COOKIE, THEME_PREF_COOKIE } from "@/lib/themeCookies";
import { TZ_MANUAL_COOKIE } from "@/lib/timezone";

// The script in the root layout's <head>. It runs before the first paint, knows the
// browser's real zone (the server may not, on a first visit), and sets
// <html data-theme> the way lib/theme.ts would. It is plain ES5 inside a string, so
// it cannot import anything; lib/themeScript.test.ts runs it against resolveTheme
// at every boundary, so the two cannot drift apart. It also:
//   - moves the old localStorage choice (`fy-theme`: "sunny-cafe" / "netcafe-night") into the new cookie, once;
//   - writes the resolved theme to the `fy-theme` cookie, for the server's next request.
export function themeInitScript(): string {
  const c = {
    pref: THEME_PREF_COOKIE,
    theme: THEME_COOKIE,
    manual: TZ_MANUAL_COOKIE,
    modes: THEME_MODES,
    day: DAY_REGIONS,
    night: NIGHT_REGIONS,
    from: NIGHT_STARTS_AT,
    to: NIGHT_ENDS_AT,
  };
  return `(function(C){try{
var d=document,h=d.documentElement;
function rd(n){var m=d.cookie.match(new RegExp('(?:^|; )'+n+'=([^;]*)'));if(!m)return null;try{return decodeURIComponent(m[1]);}catch(e){return null;}}
function wr(n,v){d.cookie=n+'='+encodeURIComponent(v)+';path=/;max-age=31536000;samesite=lax';}
function zone(z){try{Intl.DateTimeFormat('en-US',{timeZone:z});return z;}catch(e){return null;}}
try{var old=localStorage.getItem('fy-theme');if(old!==null){localStorage.removeItem('fy-theme');if(!rd(C.pref)){var om=old==='netcafe-night'||old==='nodkrai-night'?'night':old==='sunny-cafe'||old==='monstadt'?'day':null;if(om)wr(C.pref,om+':'+C.day[0]+':'+C.night[0]);}}}catch(e){}
var p=(rd(C.pref)||'').split(':');
var ok=p.length===3&&C.modes.indexOf(p[0])>=0&&C.day.indexOf(p[1])>=0&&C.night.indexOf(p[2])>=0;
var mode=ok?p[0]:'auto',dr=ok?p[1]:C.day[0],nr=ok?p[2]:C.night[0];
var night=mode==='night';
if(mode==='auto'){
var z=zone(rd(C.manual));
if(!z){try{z=zone(Intl.DateTimeFormat().resolvedOptions().timeZone);}catch(e){}}
if(!z)z='UTC';
var hr=0,parts=new Intl.DateTimeFormat('en-US',{hour:'numeric',hourCycle:'h23',timeZone:z}).formatToParts(new Date());
for(var i=0;i<parts.length;i++)if(parts[i].type==='hour')hr=parseInt(parts[i].value,10)%24;
night=hr>=C.from||hr<C.to;
}
var t=night?nr+'-night':dr;
h.setAttribute('data-theme',t);wr(C.theme,t);
}catch(e){}})(${JSON.stringify(c)});`;
}
