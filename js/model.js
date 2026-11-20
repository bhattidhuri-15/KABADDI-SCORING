const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export const DEFAULT_TOURNAMENT = "England Kabaddi Federation";
export const DEFAULT_MATCH_TITLE = "Kabaddi open final match";
export const DEFAULT_RAID_MS = 30 * 1000;
export const DEFAULT_MATCH_MS = 20 * 60 * 1000;
export const MAX_SCORE = 999;
export const MAX_RAIDERS = 40;
export const MAX_SPONSORS = 40;
export const MAX_ADS = 24;

export const VIEWS = ["score", "big", "lineup", "stats", "card", "standings", "top5", "result", "analysis", "intro", "vs", "clear"];
export const MAX_IMAGE_CHARS = 48000;

export const LAYOUTS = [
  ["classic", "Classic"],
  ["stacked", "Stacked"],
  ["slanted", "Slanted"],
  ["glass", "Glass"],
  ["corner", "Corner"],
];

export const MOTIONS = [
  ["sheen", "Sheen"],
  ["pulse", "Pulse"],
  ["sweep", "Sweep"],
  ["slam", "Slam"],
  ["depth", "3D"],
];

export const THEMES = [
  ["ekf", "EKF"],
  ["sheen", "Sheen"],
  ["pulse", "Pulse"],
  ["sweep", "Sweep"],
  ["slam", "Slam"],
  ["depth", "3D"],
  ["cyber", "Neon cyber"],
  ["royal", "Royal gold"],
  ["fire", "Fire"],
  ["ice", "Ice"],
];

export const COLOUR_FIELDS = [
  ["teamA", "Team A"],
  ["teamB", "Team B"],
  ["names", "Team names"],
  ["scores", "Scores"],
  ["tickerText", "Ticker text"],
  ["panel", "Scoreboard panel"],
  ["ticker", "Ticker rows"],
  ["badges", "Ticker badges"],
  ["result", "Result popup"],
  ["lineup", "Lineup graphic"],
  ["title", "Title strip"],
  ["accent", "Accent"],
];

const PRESETS = {
  rbw: { teamA: "#e10600", teamB: "#1d4ed8", names: "#ffffff", scores: "#ffffff", tickerText: "#ffffff", panel: "#0c0c0e", ticker: "#000000", badges: "#ffffff", result: "#0c0c0e", lineup: "#0c0c0e", title: "#000000", accent: "#ffffff" },
  purple: { teamA: "#c084fc", teamB: "#7c3aed", names: "#ffffff", scores: "#ffffff", tickerText: "#ffffff", panel: "#2a1454", ticker: "#12081f", badges: "#e4c6ff", result: "#1a0b33", lineup: "#1a0b33", title: "#2a1454", accent: "#e4c6ff" },
  red: { teamA: "#ff2d3a", teamB: "#ffb4b4", names: "#ffffff", scores: "#ffffff", tickerText: "#ffffff", panel: "#4a1018", ticker: "#1a0608", badges: "#ffc1c7", result: "#2a060c", lineup: "#2a060c", title: "#4a1018", accent: "#ffc1c7" },
  blue: { teamA: "#3ec6ff", teamB: "#1d4ed8", names: "#ffffff", scores: "#ffffff", tickerText: "#ffffff", panel: "#0d2748", ticker: "#06141c", badges: "#b9dcff", result: "#061426", lineup: "#061426", title: "#0d2748", accent: "#b9dcff" },
  green: { teamA: "#3ddc84", teamB: "#15803d", names: "#ffffff", scores: "#ffffff", tickerText: "#ffffff", panel: "#0e3324", ticker: "#06140e", badges: "#b6ffd8", result: "#062016", lineup: "#062016", title: "#0e3324", accent: "#b6ffd8" },
  gold: { teamA: "#ffd56a", teamB: "#b45309", names: "#ffffff", scores: "#ffffff", tickerText: "#ffffff", panel: "#2c220f", ticker: "#100c06", badges: "#ffd56a", result: "#1a1404", lineup: "#1a1404", title: "#2c220f", accent: "#ffd56a" },
  rose: { teamA: "#f3c1ae", teamB: "#be123c", names: "#ffffff", scores: "#ffffff", tickerText: "#ffffff", panel: "#3a241c", ticker: "#140a08", badges: "#f3c1ae", result: "#24140e", lineup: "#24140e", title: "#3a241c", accent: "#f3c1ae" },
  neon: { teamA: "#b6ff3c", teamB: "#ff2bd6", names: "#f3ffe4", scores: "#ffffff", tickerText: "#f3ffe4", panel: "#07110c", ticker: "#000000", badges: "#b6ff3c", result: "#07110c", lineup: "#07110c", title: "#07110c", accent: "#b6ff3c" },
  ink: { teamA: "#ffffff", teamB: "#a3a3a3", names: "#ffffff", scores: "#ffffff", tickerText: "#ffffff", panel: "#161616", ticker: "#000000", badges: "#ffffff", result: "#111111", lineup: "#111111", title: "#000000", accent: "#ffffff" },
  ekf: { teamA: "#1d6dff", teamB: "#ff7a00", names: "#ffffff", scores: "#ffffff", tickerText: "#ffffff", panel: "#071433", ticker: "#071433", badges: "#ff7a00", result: "#071433", lineup: "#071433", title: "#071433", accent: "#ff7a00" },
  sheen: { teamA: "#e10600", teamB: "#1d4ed8", names: "#ffffff", scores: "#ffffff", tickerText: "#141414", panel: "#0c0c0e", ticker: "#ffffff", badges: "#111111", result: "#0c0c0e", lineup: "#111111", title: "#111111", accent: "#e10600" },
  pulse: { teamA: "#ff2d55", teamB: "#7c3aed", names: "#ffffff", scores: "#ffffff", tickerText: "#ffffff", panel: "#14081c", ticker: "#1a0b22", badges: "#ff2d55", result: "#14081c", lineup: "#1a0b22", title: "#1a0b22", accent: "#ff4fa3" },
  sweep: { teamA: "#f5c400", teamB: "#111111", names: "#111111", scores: "#111111", tickerText: "#111111", panel: "#f5c400", ticker: "#111111", badges: "#f5c400", result: "#111111", lineup: "#1a1a1a", title: "#111111", accent: "#f5c400" },
  slam: { teamA: "#ff3b30", teamB: "#0a0a0a", names: "#ffffff", scores: "#ffffff", tickerText: "#ffffff", panel: "#0a0a0a", ticker: "#0a0a0a", badges: "#ff3b30", result: "#0a0a0a", lineup: "#111111", title: "#111111", accent: "#ff3b30" },
  depth: { teamA: "#60a5fa", teamB: "#312e81", names: "#ffffff", scores: "#ffffff", tickerText: "#ffffff", panel: "#0b1020", ticker: "#0b1020", badges: "#93c5fd", result: "#0b1020", lineup: "#111827", title: "#0b1020", accent: "#93c5fd" },
  cyber: { teamA: "#39ff14", teamB: "#ff2bd6", names: "#eafff2", scores: "#ffffff", tickerText: "#d8ffe8", panel: "#050510", ticker: "#050510", badges: "#39ff14", result: "#050510", lineup: "#070712", title: "#050510", accent: "#39ff14" },
  royal: { teamA: "#d4af37", teamB: "#7a1f2b", names: "#f8f1d8", scores: "#fff6d0", tickerText: "#f8f1d8", panel: "#140e08", ticker: "#140e08", badges: "#d4af37", result: "#140e08", lineup: "#1a140c", title: "#140e08", accent: "#d4af37" },
  fire: { teamA: "#ff5a1f", teamB: "#ffd000", names: "#fff4e5", scores: "#ffffff", tickerText: "#fff4e5", panel: "#1a0603", ticker: "#1a0603", badges: "#ff5a1f", result: "#1a0603", lineup: "#240804", title: "#1a0603", accent: "#ff5a1f" },
  ice: { teamA: "#7fd4ff", teamB: "#dbeafe", names: "#071018", scores: "#071018", tickerText: "#071018", panel: "#f4fbff", ticker: "#e7f5ff", badges: "#0b3a5b", result: "#f4fbff", lineup: "#e7f5ff", title: "#071018", accent: "#1d6dff" },
};

export function coloursFor(theme) {
  return { ...(PRESETS[theme] || PRESETS.rbw) };
}

export function inkFor(hex) {
  const raw = String(hex || "").replace("#", "");
  if (raw.length !== 6) return "#111111";
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111111" : "#ffffff";
}

export const POSITIONS = [
  ["top-left", "Top left"],
  ["top-center", "Top center"],
  ["top-right", "Top right"],
  ["bottom-left", "Bottom left"],
  ["bottom-center", "Bottom center"],
  ["bottom-right", "Bottom right"],
];

const LAYOUT_IDS = new Set(LAYOUTS.map(([id]) => id));
const THEME_IDS = new Set([
  ...THEMES.map(([id]) => id),
  "rbw", "purple", "red", "blue", "green", "gold", "rose", "neon", "ink",
]);
const MOTION_IDS = new Set(MOTIONS.map(([id]) => id));
const POSITION_IDS = new Set(POSITIONS.map(([id]) => id));
const RESULT_MODES = new Set(["normal", "hold", "final"]);

export function newMatchId(length = 12) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let id = "";
  for (const byte of bytes) id += ALPHABET[byte % ALPHABET.length];
  return id;
}

export function hashPin(pin) {
  const text = String(pin ?? "").trim();
  if (!text) return "";
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function emptyTier(title, text = "") {
  return { on: true, title, text };
}

export function defaultState(id, extras = {}) {
  const tournament = clampText(
    extras.tournament === undefined || extras.tournament === null ? DEFAULT_TOURNAMENT : extras.tournament,
    48,
  );
  return {
    v: 2,
    id,
    pinHash: extras.pinHash || "",
    revision: 1,
    updatedAt: Date.now(),
    tournament: tournament || DEFAULT_TOURNAMENT,
    matchTitle: clampText(extras.matchTitle || DEFAULT_MATCH_TITLE, 70),
    teams: {
      A: teamShell(extras.nameA || "TEAM A"),
      B: teamShell(extras.nameB || "TEAM B"),
    },
    view: "score",
    lineup: { show: false },
    active: { raiderId: "", stopperId: "", showOnBoard: true },
    board: { show: true, layout: "classic", theme: "rbw", motion: "sheen", position: "top-left" },
    stats: emptyStats(),
    top5: emptyTop5(),
    colours: coloursFor("rbw"),
    clocks: {
      raid: { show: false, ...makeClock(DEFAULT_RAID_MS) },
      match: { show: false, ...makeClock(DEFAULT_MATCH_MS) },
    },
    ticker: {
      speed: 5,
      style: "a",
      timezone: "Europe/London",
      hostName: "",
      hostPhoto: "",
      top: emptyTier("INFO", tournament || DEFAULT_TOURNAMENT),
      main: { on: true, title: "MESSAGE", text: "", nextTitle: "NEXT MATCHES", nextText: "" },
      bottom: emptyTier("NOTE", ""),
    },
    result: { show: false, mode: "normal", winner: "A", prize: "", player: "" },
    logo: "",
    sponsors: [],
    sponsorSeconds: 8,
    ads: emptyAds(),
  };
}

function emptyCaptain() {
  return { name: "", photo: "" };
}

function teamShell(name) {
  return { name: clampText(name, 24) || "TEAM", score: 0, raiders: 0, players: [], logo: "", captain: emptyCaptain() };
}

function emptySideStats() {
  return { raids: 0, stops: 0, raidPoints: 0, stopPoints: 0, raidsFail: 0, topRaider: "", topJaafi: "" };
}

function emptyStats() {
  return { show: false, card: false, standings: false, A: emptySideStats(), B: emptySideStats() };
}

export function deriveView(input) {
  if (VIEWS.includes(input?.view)) return input.view;
  if (input?.top5?.show) return "top5";
  if (input?.lineup?.show) return "lineup";
  if (input?.result?.show) return "result";
  if (input?.stats?.standings) return "standings";
  if (input?.stats?.card) return "card";
  if (input?.stats?.show) return "stats";
  if (input?.board?.show === false) return "clear";
  return "score";
}

export function applyView(state, view) {
  const next = VIEWS.includes(view) ? view : "score";
  state.view = next;
  state.board.show = next === "score";
  state.lineup.show = next === "lineup";
  state.top5.show = next === "top5";
  state.result.show = next === "result";
  if (!state.stats) state.stats = emptyStats();
  state.stats.show = next === "stats";
  state.stats.card = next === "card";
  state.stats.standings = next === "standings";
  return state;
}

function emptyTopSlot(index) {
  return { first: "", last: "", team: "", color: index % 2 ? "#1d4ed8" : "#e10600", stat: "", photo: "" };
}

function emptyTop5() {
  return {
    show: false,
    title: "TOURNAMENT TOP 5",
    subtitle: "Circle kabaddi",
    slots: [0, 1, 2, 3, 4].map(emptyTopSlot),
  };
}

function makeClock(durationMs) {
  return { durationMs, remainingMs: durationMs, running: false, startedAt: null };
}

export function sanitizeState(input) {
  if (!input || typeof input !== "object") return null;
  if (input.v !== 1 && input.v !== 2) return null;
  if (typeof input.id !== "string" || !isMatchId(input.id)) return null;
  if (!input.teams?.A || !input.teams?.B) return null;
  const base = defaultState(input.id);
  const tournament = clampText(input.tournament, 48) || base.tournament;
  const teams = {
    A: sanitizeTeam(input.teams.A, "TEAM A"),
    B: sanitizeTeam(input.teams.B, "TEAM B"),
  };
  const clean = {
    v: 2,
    id: input.id,
    pinHash: typeof input.pinHash === "string" ? input.pinHash.slice(0, 32) : "",
    revision: clampInt(input.revision, 0, 1e12, 0),
    updatedAt: clampInt(input.updatedAt, 0, 9e15, 0),
    tournament,
    matchTitle: clampText(input.matchTitle, 70) || base.matchTitle,
    teams,
    board: sanitizeBoard(input.board),
    colours: sanitizeColours(input.colours, THEME_IDS.has(input.board?.theme) ? input.board.theme : "rbw"),
    clocks: {
      raid: sanitizeClock(input.clocks?.raid, DEFAULT_RAID_MS, false),
      match: sanitizeClock(input.clocks?.match, DEFAULT_MATCH_MS, false),
    },
    ticker: sanitizeTicker(input.ticker, tournament),
    result: sanitizeResult(input.result),
    lineup: { show: Boolean(input.lineup?.show) },
    active: sanitizeActive(input.active, teams),
    stats: sanitizeStats(input.stats),
    top5: sanitizeTop5(input.top5),
    logo: safeImage(input.logo),
    sponsors: sanitizeSponsors(input.sponsors),
    sponsorSeconds: clampInt(input.sponsorSeconds, 3, 30, 8),
    ads: sanitizeAds(input.ads),
  };
  return finishState(clean, input);
}

function finishState(clean, input) {
  applyView(clean, deriveView(input));
  return clean;
}

function sanitizeColours(input, theme) {
  const base = coloursFor(theme);
  const colours = { ...base };
  if (!input || typeof input !== "object") return colours;
  for (const key of Object.keys(base)) colours[key] = safeColor(input[key], base[key]);
  return colours;
}

export function safeColor(value, fallback) {
  if (typeof value !== "string") return fallback;
  const color = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color.toLowerCase() : fallback;
}

function sanitizeBoard(board) {
  const layout = LAYOUT_IDS.has(board?.layout) ? board.layout : "classic";
  const fallback = "bottom-center";
  return {
    show: board?.show !== false,
    layout,
    theme: THEME_IDS.has(board?.theme) ? board.theme : "rbw",
    motion: MOTION_IDS.has(board?.motion) ? board.motion : "sheen",
    position: POSITION_IDS.has(board?.position) ? board.position : fallback,
  };
}

function sanitizeTeam(team, fallback) {
  return {
    name: clampText(team?.name, 24) || fallback,
    score: normalizeScore(team?.score),
    raiders: clampInt(team?.raiders, 0, MAX_RAIDERS, 0),
    players: sanitizePlayers(team?.players),
    logo: safeImage(team?.logo),
    captain: {
      name: clampText(team?.captain?.name, 24),
      photo: safeImage(team?.captain?.photo),
    },
  };
}

function sanitizePlayers(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.slice(0, 16).map((player) => {
    let id = clampText(player?.id, 12).toLowerCase();
    if (!/^[a-z0-9]{4,12}$/.test(id) || seen.has(id)) id = newMatchId(6);
    seen.add(id);
    return {
      id,
      name: clampText(player?.name, 24),
      number: clampText(String(player?.number ?? ""), 3),
      role: player?.role === "raider" || player?.role === "jaafi" ? player.role : "",
      stat: clampInt(player?.stat, 0, 999, 0),
      photo: safeImage(player?.photo),
    };
  }).filter((player) => player.name);
}

function sanitizeCount(value) {
  return clampInt(value, 0, 999, 0);
}

function sanitizeSideStats(side) {
  return {
    raids: sanitizeCount(side?.raids),
    stops: sanitizeCount(side?.stops),
    raidPoints: normalizeScore(side?.raidPoints),
    stopPoints: normalizeScore(side?.stopPoints),
    raidsFail: sanitizeCount(side?.raidsFail),
    topRaider: clampText(side?.topRaider, 24),
    topJaafi: clampText(side?.topJaafi, 24),
  };
}

function sanitizeStats(stats) {
  return {
    show: Boolean(stats?.show),
    card: Boolean(stats?.card),
    standings: Boolean(stats?.standings),
    A: sanitizeSideStats(stats?.A),
    B: sanitizeSideStats(stats?.B),
  };
}

function sanitizeTop5(top5) {
  const base = emptyTop5();
  const slots = [0, 1, 2, 3, 4].map((index) => {
    const slot = top5?.slots?.[index] || {};
    return {
      first: clampText(slot.first, 16),
      last: clampText(slot.last, 18),
      team: clampText(slot.team, 18),
      color: safeColor(slot.color, base.slots[index].color),
      stat: clampText(slot.stat, 12),
      photo: safeImage(slot.photo),
    };
  });
  return {
    show: Boolean(top5?.show),
    title: clampText(top5?.title, 32) || base.title,
    subtitle: clampText(top5?.subtitle, 40) || base.subtitle,
    slots,
  };
}

function sanitizeActive(active, teams) {
  const ids = new Set();
  for (const side of ["A", "B"]) {
    for (const player of teams?.[side]?.players || []) {
      if (player?.id) ids.add(player.id);
    }
  }
  const raiderId = ids.has(active?.raiderId) ? active.raiderId : "";
  const stopperId = ids.has(active?.stopperId) ? active.stopperId : "";
  return {
    raiderId,
    stopperId: stopperId === raiderId ? "" : stopperId,
    showOnBoard: active?.showOnBoard !== false,
  };
}

function sanitizeClock(clock, fallback, shown) {
  const durationMs = clampInt(clock?.durationMs, 1000, 180 * 60 * 1000, fallback);
  let remainingMs = clampInt(clock?.remainingMs, 0, 180 * 60 * 1000, durationMs);
  const startedAt = clampInt(clock?.startedAt, 0, 9e15, 0);
  const running = Boolean(clock?.running) && remainingMs > 0 && startedAt > 0;
  return {
    show: Boolean(clock?.show) || shown && clock?.show !== false,
    durationMs,
    remainingMs,
    running,
    startedAt: running ? startedAt : null,
  };
}

function sanitizeTicker(ticker, tournament) {
  const top = ticker?.top || {};
  const main = ticker?.main || {};
  const bottom = ticker?.bottom || {};
  return {
    speed: clampInt(ticker?.speed, 1, 10, 5),
    style: ticker?.style === "b" ? "b" : "a",
    timezone: safeZone(ticker?.timezone),
    hostName: clampText(ticker?.hostName, 28),
    hostPhoto: safeImage(ticker?.hostPhoto),
    top: {
      on: top.on !== false,
      title: clampText(top.title, 22) || "INFO",
      text: clampText(top.text, 180) || tournament,
    },
    main: {
      on: main.on !== false,
      title: clampText(main.title, 22) || "MESSAGE",
      text: clampText(main.text, 180),
      nextTitle: clampText(main.nextTitle, 22) || "NEXT MATCHES",
      nextText: clampText(main.nextText, 180),
    },
    bottom: {
      on: bottom.on !== false,
      title: clampText(bottom.title, 22) || "NOTE",
      text: clampText(bottom.text, 180),
    },
  };
}

function sanitizeResult(result) {
  return {
    show: Boolean(result?.show),
    mode: RESULT_MODES.has(result?.mode) ? result.mode : "normal",
    winner: result?.winner === "B" ? "B" : "A",
    prize: clampText(result?.prize, 60),
    player: clampText(result?.player, 40),
  };
}

function emptyAd(index = 0) {
  return {
    id: newMatchId(6),
    on: true,
    business: "",
    ownerName: "",
    phones: "",
    address: "",
    color: index % 2 ? "#f97316" : "#e10600",
    logo: "",
    ownerPhoto: "",
  };
}

function emptyAds() {
  return { on: true, seconds: 12, pin: "", items: [] };
}

function sanitizeAds(ads) {
  const items = Array.isArray(ads?.items) ? ads.items : [];
  const seen = new Set();
  const clean = items.slice(0, MAX_ADS).map((item, index) => {
    let id = clampText(item?.id, 12).toLowerCase();
    if (!/^[a-z0-9]{4,12}$/.test(id) || seen.has(id)) id = newMatchId(6);
    seen.add(id);
    return {
      id,
      on: item?.on !== false,
      business: clampText(item?.business, 42),
      ownerName: clampText(item?.ownerName, 32),
      phones: clampText(item?.phones, 80),
      address: clampText(item?.address, 140),
      color: safeColor(item?.color, index % 2 ? "#f97316" : "#e10600"),
      logo: safeImage(item?.logo),
      ownerPhoto: safeImage(item?.ownerPhoto),
    };
  }).filter((item) => item.business || item.ownerName || item.phones || item.address || item.logo || item.ownerPhoto);
  const pin = clean.some((item) => item.id === ads?.pin) ? ads.pin : "";
  return {
    on: ads?.on !== false,
    seconds: clampInt(ads?.seconds, 4, 90, 12),
    pin,
    items: clean,
  };
}

function sanitizeSponsors(list) {
  if (!Array.isArray(list)) return [];
  return list
    .slice(0, MAX_SPONSORS)
    .map((item) => ({
      label: clampText(item?.label, 28),
      image: safeImage(item?.image),
    }))
    .filter((item) => item.image || item.label);
}

export function isMatchId(value) {
  return /^[a-z0-9]{6,20}$/.test(String(value || ""));
}

export function clampText(value, max) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function clampInt(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

export function normalizeScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.min(MAX_SCORE, Math.round(number * 10) / 10);
}

export function formatScore(value) {
  const number = normalizeScore(value);
  return Number.isInteger(number) ? String(number) : number.toFixed(1);
}

export function addPoint(state, team) {
  const bothZero = state.teams.A.score === 0 && state.teams.B.score === 0;
  const next = state.teams[team].score + (bothZero ? 1.5 : 1);
  state.teams[team].score = normalizeScore(next);
}

export function removePoint(state, team) {
  const score = state.teams[team].score;
  if (score <= 0) {
    state.teams[team].score = 0;
    return;
  }
  state.teams[team].score = score === 1.5 ? 0 : normalizeScore(Math.max(0, score - 1));
}

export function safeImage(value) {
  if (typeof value !== "string") return "";
  const text = value.trim();
  if (!text) return "";
  if (/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(text)) {
    return text.length <= MAX_IMAGE_CHARS ? text : "";
  }
  try {
    const url = new URL(text);
    if (url.protocol === "https:" || url.protocol === "http:") return text.slice(0, 500);
  } catch {
    return "";
  }
  return "";
}

export function safeZone(value) {
  const zone = clampText(value, 64) || "Europe/London";
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: zone }).format(new Date());
    return zone;
  } catch {
    return "Europe/London";
  }
}

export function isNewer(incoming, current) {
  if (!current) return true;
  if (incoming.revision !== current.revision) return incoming.revision > current.revision;
  return incoming.updatedAt > current.updatedAt;
}

export function effectiveRemaining(clock, now = Date.now()) {
  if (!clock) return 0;
  if (!clock.running || !clock.startedAt) return Math.max(0, clock.remainingMs || 0);
  return Math.max(0, clock.remainingMs - (now - clock.startedAt));
}

export function formatClock(ms, padMin = 2) {
  const safe = Math.max(0, Number(ms) || 0);
  const totalSeconds = safe <= 0 ? 0 : Math.ceil(safe / 1000 - 1e-6);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(padMin, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function otherTeam(team) {
  return team === "A" ? "B" : "A";
}

export function storageKey(matchId) {
  return `kabaddi-state:${matchId}`;
}

export function undoKey(matchId) {
  return `kabaddi-undo:${matchId}`;
}

export function stopClock(clock, now = Date.now()) {
  if (clock.running && clock.startedAt) {
    clock.remainingMs = Math.max(0, clock.remainingMs - (now - clock.startedAt));
  }
  clock.running = false;
  clock.startedAt = null;
}

export function startClock(clock, now = Date.now()) {
  if (clock.remainingMs <= 0) clock.remainingMs = clock.durationMs;
  clock.running = true;
  clock.startedAt = now;
}

export function pageUrl(file, params = {}) {
  const base = new URL(window.location.href);
  base.hash = "";
  base.search = "";
  if (!base.pathname.endsWith("/")) {
    const last = base.pathname.slice(base.pathname.lastIndexOf("/") + 1);
    if (last.includes(".")) base.pathname = base.pathname.slice(0, base.pathname.lastIndexOf("/") + 1);
    else base.pathname += "/";
  }
  const url = new URL(file, base);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export function formatZoneTime(date, timeZone) {
  const zone = safeZone(timeZone);
  const clock = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
  return { clock: clock.replace(" ", " ").toUpperCase(), day: day.replace(/ /g, " ").toUpperCase() };
}
