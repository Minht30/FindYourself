import { sameSettings, type MixerSettings } from "./state";

// Which mix to start from when the page loads. Three places can have one: this
// device's localStorage, the account (the database), and the defaults.
//
//   1. unsaved edits on this device always win (never lose a change made
//      offline), and are sent to the account;
//   2. otherwise the account's mix, so a new device sounds like the old one;
//   3. otherwise a mix that only exists on this device, if it differs from the
//      defaults (first sign-in on a device that was used before): push it up;
//   4. otherwise the defaults.

export type LocalMix = { settings: MixerSettings; pending: boolean };

export type Source = "local-pending" | "server" | "local" | "defaults";

export type Resolution = {
  settings: MixerSettings;
  // true: the account does not have this yet, send it
  pending: boolean;
  source: Source;
};

export function resolveInitial(args: {
  local: LocalMix | null;
  server: MixerSettings | null;
  defaults: MixerSettings;
}): Resolution {
  const { local, server, defaults } = args;
  if (local?.pending) return { settings: local.settings, pending: true, source: "local-pending" };
  if (server) return { settings: server, pending: false, source: "server" };
  if (local && !sameSettings(local.settings, defaults)) {
    return { settings: local.settings, pending: true, source: "local" };
  }
  return { settings: defaults, pending: false, source: "defaults" };
}
