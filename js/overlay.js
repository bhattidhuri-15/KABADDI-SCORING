import {
  effectiveRemaining,
  formatClock,
  formatScore,
  formatZoneTime,
  deriveView,
  inkFor,
  isMatchId,
} from "./model.js";
import { createSync } from "./sync.js";

const params = new URLSearchParams(location.search);
const matchId = (params.get("match") || "").toLowerCase();
const stage = document.getElementById("stage");
const board = document.getElementById("board");
const ticker = document.getElementById("ticker");
const result = document.getElementById("result");
const lineup = document.getElementById("lineup");
const logo = document.getElementById("logo");
const sponsor = document.getElementById("sponsor");
const sponsorImg = document.getElementById("sponsorImg");
const sponsorLabel = document.getElementById("sponsorLabel");
const waitPlate = document.getElementById("waitPlate");
const waitTitle = document.getElementById("waitTitle");
const waitSub = document.getElementById("waitSub");

let state = null;
let sponsorKey = "";
let lastScores = { A: null, B: null };
let boardShown = false;
let lineupShown = false;

function fit() {
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  const x = (window.innerWidth - 1920 * scale) / 2;
  const y = (window.innerHeight - 1080 * scale) / 2;
  stage.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
}

function present(node, show, fill) {
  const was = node.dataset.on === "1";
  if (show) {
    node.hidden = false;
    node.classList.remove("gfx-out");
    if (!was) node.classList.add("gfx-in");
    node.dataset.on = "1";
    fill();
    return;
  }
  if (was) {
    node.classList.remove("gfx-in");
    node.classList.add("gfx-out");
    node.dataset.on = "0";
    node.addEventListener("animationend", () => {
      if (node.dataset.on !== "1") node.hidden = true;
    }, { once: true });
    return;
  }
  node.hidden = true;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function dots(count) {
  const wrap = el("div", "dots");
  const shown = Math.min(8, count);
  for (let i = 1; i <= shown; i += 1) wrap.appendChild(el("b", "", String(i)));
  if (count > 8) wrap.appendChild(el("span", "more", `+${count - 8}`));
  return wrap;
}

function findPlayer(id) {
  if (!id) return null;
  for (const side of ["A", "B"]) {
    const player = state.teams[side].players.find((item) => item.id === id);
    if (player) return { ...player, side };
  }
  return null;
}

function scoreNode(side, score) {
  const text = formatScore(score);
  const node = el("div", "score-num", text);
  if (lastScores[side] != null && lastScores[side] !== text) node.classList.add("pop");
  lastScores[side] = text;
  return node;
}

function roleLines(side) {
  if (!state.active?.showOnBoard) return null;
  const wrap = el("div", "");
  const raider = findPlayer(state.active.raiderId);
  const stopper = findPlayer(state.active.stopperId);
  if (raider?.side === side) wrap.appendChild(el("div", "now-line", `Raider: ${raider.name}`));
  if (stopper?.side === side) wrap.appendChild(el("div", "now-line", `Jaafi: ${stopper.name}`));
  return wrap.childNodes.length ? wrap : null;
}

function teamClass(side) {
  return side === "B" ? "team-b" : "team-a";
}

function teamBlock(team, side) {
  const card = el("div", `side ${side} ${teamClass(side)}`);
  card.appendChild(el("div", "team-name", team.name));
  card.appendChild(scoreNode(side, team.score));
  if (team.raiders > 0) card.appendChild(dots(team.raiders));
  const roles = roleLines(side);
  if (roles) card.appendChild(roles);
  return card;
}

function clockChips(parent) {
  const row = el("div", "clock-row");
  let any = false;
  if (state.clocks.raid.show) {
    any = true;
    row.appendChild(el("span", "chip", `RAID ${formatClock(effectiveRemaining(state.clocks.raid), 1)}`));
  }
  if (state.clocks.match.show) {
    any = true;
    row.appendChild(el("span", "chip", `MATCH ${formatClock(effectiveRemaining(state.clocks.match), 2)}`));
  }
  if (any) parent.appendChild(row);
}

function renderBoard() {
  board.className = `board layout-${state.board.layout} pos-${state.board.position || "top-left"}`;
  const show = deriveView(state) === "score";
  present(board, show, () => {
    board.classList.add("gfx-in");
    board.replaceChildren();
    if (state.board.theme === "ekf") {
      board.appendChild(ekfBug());
      clockChips(board);
      return;
    }
    if (state.board.layout === "stacked") board.appendChild(stackBars());
    else {
      const mode = state.board.layout === "glass" ? "glass" : state.board.layout === "slanted" ? "sharp" : state.board.layout === "corner" ? "compact" : "";
      board.appendChild(scorebug(mode));
    }
    clockChips(board);
  });
  boardShown = show;
}

function infoStrip(side) {
  const team = state.teams[side];
  const bits = [`${team.raiders} raider${team.raiders === 1 ? "" : "s"}`];
  const raider = findPlayer(state.active?.raiderId);
  const stopper = findPlayer(state.active?.stopperId);
  if (state.active?.showOnBoard && raider?.side === side) bits.unshift(raider.name);
  if (state.active?.showOnBoard && stopper?.side === side) bits.push(`Jaafi ${stopper.name}`);
  return bits.join("  ·  ");
}

function crest(side) {
  const node = el("div", "crest shield");
  const logo = state.teams[side].logo;
  if (logo) {
    const img = el("img", "");
    img.src = logo;
    img.alt = "";
    node.appendChild(img);
  } else node.textContent = (state.teams[side].name || "?").trim().charAt(0).toUpperCase() || "?";
  return node;
}

function ekfBug() {
  const bug = el("div", "ekf-bug");
  bug.appendChild(el("div", "ekf-live", "LIVE"));
  for (const side of ["A", "B"]) {
    const row = el("div", `ekf-row ${teamClass(side)}`);
    if (side === "A") row.appendChild(crest(side));
    row.appendChild(el("div", "ekf-team", state.teams[side].name));
    row.appendChild(el("div", "ekf-score", formatScore(state.teams[side].score)));
    bug.appendChild(row);
  }
  return bug;
}

function wing(side) {
  const team = state.teams[side];
  const wingEl = el("div", `bug-wing ${teamClass(side)}`);
  const copy = el("div", "bug-copy");
  copy.appendChild(el("div", "bug-name", state.teams[side].name));
  copy.appendChild(el("div", "bug-sub", infoStrip(side)));
  if (team.raiders > 0) copy.appendChild(dots(team.raiders));
  if (side === "A") wingEl.append(crest(side), copy);
  else wingEl.append(copy, crest(side));
  return wingEl;
}

function scorebug(mode) {
  const bug = el("div", `scorebug ${mode || ""}`.trim());
  const mid = el("div", "bug-mid");
  const scores = el("div", "bug-scores");
  scores.appendChild(scoreNode("A", state.teams.A.score));
  const cut = el("div", "bug-cut");
  cut.appendChild(el("span", "", "VS"));
  scores.appendChild(cut);
  scores.appendChild(scoreNode("B", state.teams.B.score));
  mid.appendChild(scores);
  mid.appendChild(el("div", "bug-status", state.matchTitle || "LIVE"));
  bug.append(wing("A"), mid, wing("B"));
  return bug;
}

function stackBars() {
  const wrap = el("div", "stack-bars");
  for (const side of ["A", "B"]) {
    const row = el("div", `stack-bar ${teamClass(side)}`);
    row.appendChild(el("div", "score-num stack-points", formatScore(state.teams[side].score)));
    const copy = el("div", "");
    copy.appendChild(el("div", "bug-name", state.teams[side].name));
    copy.appendChild(el("div", "bug-sub", infoStrip(side)));
    row.appendChild(copy);
    if (state.teams[side].raiders > 0) row.appendChild(dots(state.teams[side].raiders));
    wrap.appendChild(row);
  }
  return wrap;
}

function marquee(text) {
  const box = el("div", "marquee");
  const track = el("div", "marquee-track");
  const chunk = () => {
    const span = el("span", "marquee-chunk");
    span.appendChild(document.createTextNode(text || " "));
    span.appendChild(el("b", "sep", "▸"));
    return span;
  };
  track.append(chunk(), chunk());
  box.appendChild(track);
  return box;
}

function syncHost(tick) {
  let host = ticker.querySelector(".host");
  const name = tick.hostName || "";
  const photo = tick.hostPhoto || "";
  if (!name && !photo) {
    if (host) host.remove();
    ticker.classList.remove("has-host");
    return;
  }
  ticker.classList.add("has-host");
  const sig = `${name}|${photo.slice(0, 48)}`;
  if (host?.dataset.sig === sig) return;
  if (!host) {
    host = el("div", "host");
    ticker.appendChild(host);
  }
  host.dataset.sig = sig;
  host.replaceChildren();
  if (photo) {
    const img = el("img", "host-photo");
    img.src = photo;
    img.alt = "";
    host.appendChild(img);
  }
  if (name) host.appendChild(el("div", "host-name", name));
}

function placeTier(row, name) {
  const order = ["top", "main", "next", "bottom"];
  const mine = order.indexOf(name);
  const next = [...ticker.querySelectorAll("[data-tier]")].find((item) => item !== row && order.indexOf(item.dataset.tier) > mine);
  if (next) ticker.insertBefore(row, next);
  else ticker.appendChild(row);
}

function syncTier(name, on, signature, build) {
  let row = ticker.querySelector(`[data-tier="${name}"]`);
  if (!on) {
    if (row && row.dataset.leaving !== "1") {
      row.dataset.leaving = "1";
      row.classList.remove("tier-in");
      row.classList.add("tier-out");
      row.addEventListener("animationend", () => row.remove(), { once: true });
    }
    return;
  }
  if (row?.dataset.leaving === "1") {
    row.remove();
    row = null;
  }
  if (!row || row.dataset.sig !== signature) {
    const fresh = build();
    fresh.dataset.tier = name;
    fresh.dataset.sig = signature;
    fresh.classList.add("tier-in");
    if (row) row.replaceWith(fresh);
    placeTier(fresh, name);
  }
}

function renderTicker() {
  const { ticker: tick } = state;
  const show = deriveView(state) === "score";
  present(ticker, show, () => {
    ticker.classList.add("gfx-in");
    ticker.classList.toggle("style-b", tick.style === "b");
    ticker.classList.toggle("style-a", tick.style !== "b");
    syncHost(tick);
    syncTier("top", tick.top.on !== false, `${tick.top.title}|${tick.top.text}`, () => {
      const row = el("div", "tier top");
      row.appendChild(el("div", "badge", tick.top.title));
      row.appendChild(marquee(tick.top.text));
      return row;
    });
    syncTier("main", tick.main.on !== false, `${tick.main.title}|${tick.main.text}`, () => {
      const row = el("div", "tier main");
      const live = el("div", "live");
      live.appendChild(el("i"));
      live.appendChild(document.createTextNode("LIVE"));
      row.appendChild(live);
      row.appendChild(marquee(tick.main.text || tick.main.title));
      const clock = el("div", "clock-box");
      clock.appendChild(el("strong", "zone-clock", ""));
      clock.appendChild(el("em", "zone-day", ""));
      row.appendChild(clock);
      return row;
    });
    syncTier("next", tick.main.on !== false && Boolean(tick.main.nextText || tick.main.nextTitle), `${tick.main.nextTitle}|${tick.main.nextText}`, () => {
      const row = el("div", "tier next");
      row.appendChild(el("div", "badge badge-next", tick.main.nextTitle || "NEXT MATCHES"));
      row.appendChild(marquee(tick.main.nextText));
      return row;
    });
    syncTier("bottom", tick.bottom.on !== false, `${tick.bottom.title}|${tick.bottom.text}`, () => {
      const row = el("div", "tier bottom");
      row.appendChild(el("div", "badge", tick.bottom.title));
      row.appendChild(marquee(tick.bottom.text));
      return row;
    });
    applyScroll();
    paintZone();
  });
  placeFloating();
}

function applyScroll() {
  const speed = 30 + state.ticker.speed * 18;
  ticker.querySelectorAll(".marquee-track").forEach((track) => {
    const width = track.scrollWidth / 2 || 400;
    track.style.animationDuration = `${Math.max(6, width / speed)}s`;
  });
}

function paintZone() {
  if (!state) return;
  const clock = ticker.querySelector(".zone-clock");
  const day = ticker.querySelector(".zone-day");
  if (!clock || !day) return;
  const formatted = formatZoneTime(new Date(), state.ticker.timezone);
  clock.textContent = formatted.clock;
  day.textContent = formatted.day;
}

function paintTimers() {
  if (!state?.board.show) return;
  const chips = board.querySelectorAll(".chip");
  let index = 0;
  if (state.clocks.raid.show && chips[index]) {
    chips[index].textContent = `RAID ${formatClock(effectiveRemaining(state.clocks.raid), 1)}`;
    index += 1;
  }
  if (state.clocks.match.show && chips[index]) {
    chips[index].textContent = `MATCH ${formatClock(effectiveRemaining(state.clocks.match), 2)}`;
  }
}

function roleWord(role) {
  if (role === "raider") return "Raider";
  if (role === "jaafi") return "Jaafi";
  return "";
}

function renderLineup() {
  const show = deriveView(state) === "lineup";
  if (show) {
    lineup.hidden = false;
    lineup.classList.remove("is-off");
    if (!lineupShown) {
      lineup.classList.remove("is-on");
      void lineup.offsetWidth;
      lineup.classList.add("is-on");
    }
    const card = el("div", "lineup-card");
    if (state.board.theme === "ekf") {
      card.appendChild(ekfLineup());
      lineup.replaceChildren(card);
      lineup.classList.add("gfx-in");
      lineupShown = show;
      return;
    }
    card.appendChild(el("p", "tag", "Team lineup"));
    const cols = el("div", "vcols");
    for (const side of ["A", "B"]) {
      const players = state.teams[side].players || [];
      const colour = side === "A" ? "var(--team-a)" : "var(--team-b)";
      if (!players.length) {
        const col = el("article", "vcol");
        col.style.background = colour;
        col.appendChild(el("div", "v-first", state.teams[side].name));
        cols.appendChild(col);
      }
      players.forEach((player, index) => {
        const col = el("article", "vcol");
        col.style.background = colour;
        col.style.animationDelay = `${index * 0.08}s`;
        const parts = player.name.trim().split(/\s+/);
        col.appendChild(el("div", "v-first", parts[0] || player.name));
        if (parts.length > 1) col.appendChild(el("div", "v-last", parts.slice(1).join(" ")));
        const foot = el("div", "v-foot");
        if (player.photo) {
          const img = el("img", "v-photo");
          img.src = player.photo;
          img.alt = "";
          foot.appendChild(img);
        }
        foot.appendChild(el("span", "", `${player.number ? `${player.number} ` : ""}${roleWord(player.role) || state.teams[side].name}`));
        col.appendChild(foot);
        cols.appendChild(col);
      });
    }
    card.appendChild(cols);
    lineup.replaceChildren(card);
    lineup.classList.add("gfx-in");
  } else if (lineupShown) {
    lineup.classList.remove("is-on", "gfx-in");
    lineup.classList.add("is-off", "gfx-out");
    lineup.addEventListener("animationend", () => {
      if (deriveView(state) !== "lineup") lineup.hidden = true;
    }, { once: true });
  } else {
    lineup.hidden = true;
  }
  lineupShown = show;
}

function renderResult() {
  const show = deriveView(state) === "result";
  present(result, show, () => {
  result.classList.add("gfx-in");
  result.replaceChildren();
  const card = el("div", "result-card");
  const winner = state.result.winner === "B" ? "B" : "A";
  const loser = winner === "A" ? "B" : "A";
  if (state.result.mode === "hold") {
    card.appendChild(el("p", "hold-title", "MATCH RESULT"));
    card.appendChild(el("p", "hold-title", "ON HOLD"));
  } else if (state.result.mode === "final") {
    card.appendChild(el("p", "kicker", "CHAMPION"));
    card.appendChild(el("p", "result-name", state.teams[winner].name));
    card.appendChild(el("p", "prize", "WINNING PRIZE"));
    card.appendChild(el("p", "result-score", state.result.prize || "—"));
    card.appendChild(el("p", "kicker", "PLAYER OF THE MATCH"));
    card.appendChild(el("p", "gurmukhi", state.result.player || "—"));
  } else {
    const win = el("div", `result-side ${teamClass(winner)}`);
    win.appendChild(el("p", "kicker", "WINNER"));
    win.appendChild(el("p", "gurmukhi", "ਜੇਤੂ"));
    win.appendChild(el("p", "result-name", state.teams[winner].name));
    win.appendChild(el("p", "result-score", formatScore(state.teams[winner].score)));
    const lose = el("div", `result-side ${teamClass(loser)}`);
    lose.appendChild(el("p", "kicker", "ELIMINATED"));
    lose.appendChild(el("p", "gurmukhi", "ਬਾਹਰ"));
    lose.appendChild(el("p", "result-name", state.teams[loser].name));
    lose.appendChild(el("p", "result-score", formatScore(state.teams[loser].score)));
    card.append(win, lose);
  }
  result.appendChild(card);
  });
}

function renderStats() {
  const stats = document.getElementById("stats");
  const show = deriveView(state) === "stats";
  present(stats, show, () => {
  stats.classList.add("gfx-in");
  stats.replaceChildren();
  const card = el("div", "stats-card");
  card.appendChild(el("div", "stats-title", "MATCH STATS"));
  const head = el("div", "stats-row head");
  head.append(el("span", "", ""), el("b", "team-a", state.teams.A.name), el("b", "team-b", state.teams.B.name));
  card.appendChild(head);
  for (const [label, key] of [["Points", "points"], ["Raids", "raids"], ["Stops", "stops"]]) {
    const row = el("div", "stats-row");
    const a = key === "points" ? formatScore(state.teams.A.score) : String(state.stats.A[key]);
    const b = key === "points" ? formatScore(state.teams.B.score) : String(state.stats.B[key]);
    row.append(el("span", "", label), el("b", "", a), el("b", "", b));
    card.appendChild(row);
  }
  stats.appendChild(card);
  });
}

function renderCard() {
  const box = document.getElementById("pcard");
  const player = findPlayer(state.active?.raiderId) || findPlayer(state.active?.stopperId);
  const show = deriveView(state) === "card" && player;
  present(box, show, () => {
  box.classList.add("gfx-in");
  box.replaceChildren();
  const bar = el("div", `pcard-bar ${teamClass(player.side)}`);
  if (player.photo) {
    const img = el("img", "");
    img.src = player.photo;
    img.alt = "";
    bar.appendChild(img);
  }
  const copy = el("div", "");
  copy.appendChild(el("small", "", roleWord(player.role) || "PLAYER"));
  copy.appendChild(el("strong", "", player.name));
  copy.appendChild(el("em", "", state.teams[player.side].name));
  bar.appendChild(copy);
  box.appendChild(bar);
  });
}

function renderStandings() {
  const box = document.getElementById("standings");
  const show = deriveView(state) === "standings";
  present(box, show, () => {
  box.classList.add("gfx-in");
  box.replaceChildren();
  const card = el("div", "stand-card");
  card.appendChild(el("div", "stats-title", "TOP RAIDERS & STOPPERS"));
  const people = [];
  for (const side of ["A", "B"]) {
    for (const player of state.teams[side].players || []) {
      if (player.role === "raider" || player.role === "jaafi") people.push({ ...player, side });
    }
  }
  people.sort((a, b) => b.stat - a.stat);
  const list = people.slice(0, 5);
  if (!list.length) card.appendChild(el("p", "bug-sub", "Add raiders and Jaafis in Lineup"));
  list.forEach((player) => {
    const row = el("div", `stand-row ${teamClass(player.side)}`);
    row.appendChild(el("div", "stand-stat", String(player.stat)));
    if (player.photo) {
      const img = el("img", "");
      img.src = player.photo;
      img.alt = "";
      row.appendChild(img);
    }
    const copy = el("div", "stand-copy");
    copy.appendChild(el("strong", "", player.name));
    copy.appendChild(el("span", "", `${state.teams[player.side].name} · ${roleWord(player.role)}`));
    row.appendChild(copy);
    row.appendChild(crest(player.side));
    card.appendChild(row);
  });
  box.appendChild(card);
  });
}

function renderTop5() {
  const box = document.getElementById("top5");
  const show = deriveView(state) === "top5";
  present(box, show, () => {
  box.classList.add("gfx-in");
  box.replaceChildren();
  const frame = el("div", "top5-frame");
  const cols = el("div", "top5-cols");
  state.top5.slots.forEach((slot, index) => {
    const col = el("article", "top5-col");
    col.style.background = slot.color || (index % 2 ? "var(--team-b)" : "var(--team-a)");
    col.style.animationDelay = `${index * 0.09}s`;
    const letters = Math.max(1, (slot.first || "PLAYER").length);
    col.style.setProperty("--name-size", `${Math.round(Math.min(68, Math.max(32, 430 / letters)))}px`);
    col.appendChild(el("div", "v-first", slot.first || "PLAYER"));
    if (slot.last) col.appendChild(el("div", "v-last", slot.last));
    const foot = el("div", "v-foot");
    if (slot.photo) {
      const img = el("img", "v-photo");
      img.src = slot.photo;
      img.alt = "";
      foot.appendChild(img);
    }
    foot.appendChild(el("span", "", slot.stat || slot.team || ""));
    col.appendChild(foot);
    cols.appendChild(col);
  });
  frame.appendChild(cols);
  const foot = el("div", "top5-foot");
  foot.appendChild(el("div", "top5-num", "5"));
  const copy = el("div", "");
  copy.appendChild(el("strong", "", state.top5.title || "TOURNAMENT TOP 5"));
  copy.appendChild(el("span", "", state.top5.subtitle || ""));
  foot.appendChild(copy);
  frame.appendChild(foot);
  box.appendChild(frame);
  });
}

function renderLogo() {
  const pos = state.board.position || "top-left";
  logo.className = `corner-logo ${pos.includes("right") ? "logo-left" : "logo-right"}`;
  const show = deriveView(state) === "score" && Boolean(state.logo);
  present(logo, show, () => {
    logo.classList.add("logo-right", "gfx-in");
    if (logo.getAttribute("src") !== state.logo) {
      logo.onload = () => placeFloating();
      logo.src = state.logo;
    }
  });
}

function paintSponsor() {
  if (!state) return;
  const items = state.sponsors.filter((item) => item.image);
  const show = deriveView(state) === "score" && items.length > 0;
  if (!show) {
    present(sponsor, false, () => {});
    if (!items.length) sponsorKey = "";
    return;
  }
  present(sponsor, true, () => sponsor.classList.add("gfx-in"));
  const index = Math.floor(Date.now() / (state.sponsorSeconds * 1000)) % items.length;
  const item = items[index];
  const key = `${index}:${item.image.slice(0, 48)}`;
  if (key !== sponsorKey) {
    const apply = () => {
      sponsorImg.src = item.image;
      sponsorLabel.textContent = item.label;
      sponsorImg.classList.remove("is-fading");
    };
    if (sponsorKey) {
      sponsorImg.classList.add("is-fading");
      window.setTimeout(apply, 280);
    } else apply();
    sponsorKey = key;
  }
  placeFloating();
}

function placeFloating() {
  const gap = 24 + (ticker.hidden ? 0 : ticker.offsetHeight);
  const position = state?.board.position || "bottom-center";
  const logoBlock = logo.hidden ? 0 : Math.max(logo.offsetHeight || 0, 72) + 18;
  if (!board.hidden && position === "top-left") {
    board.style.top = "28px";
    board.style.bottom = "";
    board.style.left = "36px";
    board.style.right = "auto";
  } else if (!board.hidden && position === "top-right") {
    board.style.top = "28px";
    board.style.bottom = "";
    board.style.left = "auto";
    board.style.right = "36px";
  } else if (!board.hidden && position.startsWith("bottom")) {
    board.style.bottom = `${gap + 16}px`;
    board.style.top = "";
  } else if (!board.hidden) {
    board.style.bottom = "";
  }
  if (!lineup.hidden && position === "top-left" && !board.hidden) {
    const boardTop = 28 + logoBlock;
    lineup.style.top = `${boardTop + board.offsetHeight + 20}px`;
  } else if (!lineup.hidden) {
    lineup.style.top = "";
  }
  if (!sponsor.hidden) {
    sponsor.style.top = "118px";
    sponsor.style.bottom = "auto";
    sponsor.style.left = "auto";
    sponsor.style.right = "36px";
  }
  const top5el = document.getElementById("top5");
  if (top5el && !top5el.hidden) {
    let top = 48;
    if (!board.hidden) {
      const stageRect = stage.getBoundingClientRect();
      const scale = stageRect.width / 1920 || 1;
      const boardRect = board.getBoundingClientRect();
      const boardTop = (boardRect.top - stageRect.top) / scale;
      const boardBottom = (boardRect.bottom - stageRect.top) / scale;
      if (boardBottom > 40 && boardTop < 640) top = Math.min(460, Math.max(48, Math.round(boardBottom + 18)));
    }
    top5el.style.top = `${top}px`;
  }
}

function applyColours() {
  const colours = state.colours;
  if (!colours) return;
  const pairs = {
    "--team-a": colours.teamA,
    "--team-b": colours.teamB,
    "--names": colours.names,
    "--scores": colours.scores,
    "--ticker-text": colours.tickerText,
    "--panel": colours.panel,
    "--ticker-bg": colours.ticker,
    "--badges": colours.badges,
    "--badge-ink": inkFor(colours.badges),
    "--result-bg": colours.result,
    "--lineup-bg": colours.lineup,
    "--title-bg": colours.title,
    "--title-ink": inkFor(colours.title),
    "--accent": colours.accent,
  };
  for (const [key, value] of Object.entries(pairs)) stage.style.setProperty(key, value);
}

function renderBig() {
  const box = document.getElementById("bigscore");
  const show = deriveView(state) === "big";
  present(box, show, () => {
    box.classList.add("gfx-in");
    box.replaceChildren();
    const frame = el("div", "big-frame");
    const mid = el("div", "big-mid");
    if (state.logo) {
      const img = el("img", "big-logo");
      img.src = state.logo;
      img.alt = "";
      mid.appendChild(img);
    } else mid.appendChild(el("div", "big-mark", "VS"));
    mid.appendChild(el("div", "big-title", state.matchTitle || "LIVE"));
    const sideNode = (side) => {
      const team = state.teams[side];
      const cap = team.captain || { name: "", photo: "" };
      const col = el("div", `big-side ${teamClass(side)}`);
      if (cap.photo) {
        const img = el("img", "big-photo");
        img.src = cap.photo;
        img.alt = "";
        col.appendChild(img);
      } else col.appendChild(el("div", "big-photo big-photo-empty", (cap.name || team.name || "?").charAt(0)));
      col.appendChild(el("div", "big-team", team.name));
      col.appendChild(el("div", "big-score", formatScore(team.score)));
      col.appendChild(el("div", "big-cap", cap.name ? `Captain  ·  ${cap.name}` : "Captain"));
      const dotsNode = team.raiders > 0 ? dots(team.raiders) : el("div", "dots");
      col.appendChild(dotsNode);
      return col;
    };
    frame.append(sideNode("A"), mid, sideNode("B"));
    box.appendChild(frame);
  });
}

function renderAnalysis() {
  const box = document.getElementById("analysis");
  const show = deriveView(state) === "analysis";
  present(box, show, () => {
    box.classList.add("gfx-in");
    box.replaceChildren();
    const card = el("div", "analysis-card");
    card.appendChild(el("div", "analysis-title", "TEAM ANALYSIS"));
    card.appendChild(el("div", "analysis-sub", state.tournament));
    const head = el("div", "an-row head");
    head.append(el("span", "", ""), el("b", "", state.teams.A.name), el("b", "", state.teams.B.name));
    card.appendChild(head);
    const rows = [
      ["Total points", formatScore(state.teams.A.score), formatScore(state.teams.B.score)],
      ["Raid points", formatScore(state.stats.A.raidPoints), formatScore(state.stats.B.raidPoints)],
      ["Jaafi points", formatScore(state.stats.A.stopPoints), formatScore(state.stats.B.stopPoints)],
      ["Raids won", String(state.stats.A.raids), String(state.stats.B.raids)],
      ["Raids failed", String(state.stats.A.raidsFail), String(state.stats.B.raidsFail)],
      ["Stops", String(state.stats.A.stops), String(state.stats.B.stops)],
      ["Top raider", state.stats.A.topRaider || "—", state.stats.B.topRaider || "—"],
      ["Top jaafi", state.stats.A.topJaafi || "—", state.stats.B.topJaafi || "—"],
    ];
    for (const [label, a, b] of rows) {
      const row = el("div", "an-row");
      row.append(el("span", "", label), el("b", "", a), el("b", "", b));
      card.appendChild(row);
    }
    box.appendChild(card);
  });
}

function liveAds() {
  const ads = state.ads;
  if (!ads?.on || deriveView(state) !== "score") return [];
  return (ads.items || []).filter((item) => item.on !== false && (item.business || item.ownerName || item.phones || item.address || item.logo || item.ownerPhoto));
}

function currentAd() {
  const items = liveAds();
  if (!items.length) return null;
  const pinned = items.find((item) => item.id === state.ads.pin);
  if (pinned) return pinned;
  const seconds = Math.max(4, state.ads.seconds || 12);
  return items[Math.floor(Date.now() / (seconds * 1000)) % items.length];
}

function ekfLineup() {
  const wrap = el("div", "ekf-lineup");
  const head = el("div", "ekf-lu-head");
  head.appendChild(el("div", "ekf-mark", "EKF"));
  head.appendChild(el("div", "ekf-lu-fed", state.tournament));
  head.appendChild(el("div", "ekf-lu-season", "EKF 2027"));
  wrap.appendChild(head);
  for (const side of ["A", "B"]) {
    const block = el("section", `ekf-lu-team ${teamClass(side)}`);
    const bar = el("div", "ekf-lu-teambar");
    bar.appendChild(crest(side));
    bar.appendChild(el("div", "ekf-lu-teamname", state.teams[side].name));
    block.appendChild(bar);
    block.appendChild(el("div", "ekf-lu-label", "TEAM LINEUP"));
    const grid = el("div", "ekf-lu-grid");
    (state.teams[side].players || []).forEach((player, index) => {
      const row = el("div", "ekf-lu-row");
      row.appendChild(el("div", "ekf-lu-num", String(index + 1).padStart(2, "0")));
      row.appendChild(el("div", "ekf-lu-name", player.name));
      grid.appendChild(row);
    });
    if (!grid.childElementCount) grid.appendChild(el("div", "ekf-lu-name", "Add players"));
    block.appendChild(grid);
    wrap.appendChild(block);
  }
  return wrap;
}

function renderIntro() {
  const box = document.getElementById("intro");
  const show = deriveView(state) === "intro";
  present(box, show, () => {
    box.classList.add("gfx-in");
    box.replaceChildren();
    const card = el("div", "ekf-intro");
    card.appendChild(el("div", "ekf-shield", "EKF"));
    card.appendChild(el("h2", "ekf-fed", state.tournament || "ENGLAND KABADDI FEDERATION"));
    card.appendChild(el("div", "ekf-banner", state.matchTitle || "SEASON 2027"));
    const sub = el("div", "ekf-sub");
    sub.appendChild(el("i", ""));
    sub.appendChild(el("span", "", "CIRCLE STYLE KABADDI"));
    sub.appendChild(el("i", ""));
    card.appendChild(sub);
    box.appendChild(card);
  });
}

function renderVs() {
  const box = document.getElementById("vs");
  const show = deriveView(state) === "vs";
  present(box, show, () => {
    box.classList.add("gfx-in");
    box.replaceChildren();
    const card = el("div", "ekf-vs");
    const head = el("div", "ekf-vs-head");
    head.appendChild(el("span", "slash", "//"));
    head.appendChild(el("strong", "", "EKF 2027"));
    head.appendChild(el("span", "slash", "//"));
    card.appendChild(head);
    const mid = el("div", "ekf-vs-mid");
    const left = el("div", "ekf-vs-side team-a");
    left.appendChild(crest("A"));
    const mark = el("div", "ekf-vs-mark", "VS");
    const right = el("div", "ekf-vs-side team-b");
    right.appendChild(crest("B"));
    mid.append(left, mark, right);
    card.appendChild(mid);
    const names = el("div", "ekf-vs-names");
    names.appendChild(el("div", "ekf-vs-plate team-a", state.teams.A.name));
    names.appendChild(el("div", "ekf-vs-plate team-b", state.teams.B.name));
    card.appendChild(names);
    box.appendChild(card);
  });
}

function renderAd() {
  const node = document.getElementById("ad");
  if (!node || !state) return;
  const ad = currentAd();
  if (!ad) {
    stage.style.setProperty("--ad-gap", "0px");
    present(node, false, () => {});
    return;
  }
  stage.style.setProperty("--ad-gap", "500px");
  const key = [ad.id, ad.business, ad.ownerName, ad.phones, ad.address, ad.color, ad.logo, ad.ownerPhoto].join("|");
  present(node, true, () => {
    if (node.dataset.key === key && node.childElementCount) return;
    node.dataset.key = key;
    node.style.setProperty("--ad", ad.color || "#e10600");
    node.style.setProperty("--ad-ink", inkFor(ad.color || "#e10600"));
    node.replaceChildren();
    node.classList.remove("ad-play");
    if (ad.ownerPhoto) {
      const photo = el("img", "ad-owner");
      photo.src = ad.ownerPhoto;
      photo.alt = "";
      node.appendChild(photo);
    }
    const panel = el("div", "ad-panel");
    const top = el("div", "ad-top");
    if (ad.logo) {
      const logo = el("img", "ad-logo");
      logo.src = ad.logo;
      logo.alt = "";
      top.appendChild(logo);
    }
    const titles = el("div", "ad-titles");
    if (ad.business) titles.appendChild(el("div", "ad-line ad-biz", ad.business));
    if (ad.ownerName) titles.appendChild(el("div", "ad-line ad-who", ad.ownerName));
    top.appendChild(titles);
    panel.appendChild(top);
    if (ad.phones) panel.appendChild(el("div", "ad-line ad-phone", ad.phones));
    if (ad.address) panel.appendChild(el("div", "ad-line ad-address", ad.address));
    node.appendChild(panel);
    void node.offsetWidth;
    node.classList.add("ad-play");
  });
}

function render() {
  if (!state) return;
  waitPlate.hidden = true;
  stage.className = `theme-${state.board.theme} motion-${state.board.motion || "sheen"}`;
  applyColours();
  document.title = state.tournament ? `${state.tournament} · Kabaddi` : "Kabaddi Overlay";
  renderBoard();
  renderStats();
  renderCard();
  renderStandings();
  renderLineup();
  renderIntro();
  renderVs();
  renderTop5();
  renderBig();
  renderAnalysis();
  renderTicker();
  renderResult();
  renderLogo();
  paintSponsor();
  renderAd();
}

function showState(next) {
  state = next;
  render();
}

fit();
window.addEventListener("resize", fit);

if (!isMatchId(matchId)) {
  waitTitle.textContent = "Link needs a match id";
  waitSub.textContent = "Create a match on the home page, then paste the overlay link here.";
} else {
  let sync;
  try {
    sync = createSync({
      matchId,
      role: "overlay",
      onState: showState,
      onStatus: (status) => {
        if (!state) waitSub.textContent = status.live ? "Connected. Waiting for the control phone…" : "No connection. Check the internet on this PC.";
      },
    });
  } catch (error) {
    waitTitle.textContent = "Scoreboard could not start";
    waitSub.textContent = error.message;
  }
  if (sync) {
    const cached = sync.readCache();
    if (cached) showState(cached);
    window.setInterval(() => {
      paintZone();
      paintTimers();
      paintSponsor();
      renderAd();
    }, 250);
  }
}
