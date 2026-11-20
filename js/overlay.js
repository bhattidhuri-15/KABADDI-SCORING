import {
  effectiveRemaining,
  formatClock,
  formatScore,
  formatZoneTime,
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
  const show = state.board.show;
  board.className = `board layout-${state.board.layout} pos-${state.board.position || "bottom-center"}`;
  if (show && !boardShown) board.classList.add("is-in");
  if (!show && boardShown) {
    board.classList.add("is-leaving");
    board.addEventListener("animationend", () => {
      if (!state?.board.show) board.hidden = true;
    }, { once: true });
    boardShown = false;
    return;
  }
  board.hidden = !show;
  boardShown = show;
  board.replaceChildren();
  if (!show) return;
  const head = el("div", "board-head");
  head.appendChild(el("p", "tournament-line", state.tournament));
  head.appendChild(el("p", "tag", state.matchTitle));
  board.appendChild(head);
  if (state.board.layout === "stacked") {
    board.appendChild(stackBars());
  } else {
    const mode = state.board.layout === "glass" ? "glass" : state.board.layout === "slanted" ? "sharp" : state.board.layout === "corner" ? "compact" : "";
    board.appendChild(scorebug(mode));
  }
  clockChips(board);
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
  const node = el("div", "crest");
  node.textContent = (state.teams[side].name || "?").trim().charAt(0).toUpperCase() || "?";
  return node;
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
  const line = text || " ";
  track.appendChild(el("span", "", line));
  track.appendChild(el("span", "", line));
  box.appendChild(track);
  return box;
}

function renderTicker() {
  const { ticker: tick } = state;
  ticker.replaceChildren();
  ticker.hidden = false;
  const addTier = (className, title, text) => {
    const row = el("div", `tier ${className}`);
    row.appendChild(el("div", "badge", title));
    row.appendChild(marquee(text));
    ticker.appendChild(row);
    return row;
  };
  if (tick.top.on) addTier("top", tick.top.title, tick.top.text);
  if (tick.main.on) {
    const row = el("div", "tier main");
    const live = el("div", "live");
    live.appendChild(el("i"));
    live.appendChild(document.createTextNode("LIVE"));
    row.appendChild(live);
    row.appendChild(el("div", "badge badge-message", tick.main.title));
    row.appendChild(marquee(tick.main.text));
    row.appendChild(el("div", "badge badge-next", tick.main.nextTitle));
    row.appendChild(marquee(tick.main.nextText));
    const clock = el("div", "clock-box");
    clock.appendChild(el("strong", "zone-clock", ""));
    clock.appendChild(el("em", "zone-day", ""));
    row.appendChild(clock);
    ticker.appendChild(row);
  }
  if (tick.bottom.on) addTier("bottom", tick.bottom.title, tick.bottom.text);
  applyScroll();
  paintZone();
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
  const show = Boolean(state.lineup?.show);
  if (show) {
    lineup.hidden = false;
    lineup.classList.remove("is-off");
    if (!lineupShown) {
      lineup.classList.remove("is-on");
      void lineup.offsetWidth;
      lineup.classList.add("is-on");
    }
    const card = el("div", "lineup-card");
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
  } else if (lineupShown) {
    lineup.classList.remove("is-on");
    lineup.classList.add("is-off");
    lineup.addEventListener("animationend", () => {
      if (!state?.lineup?.show) lineup.hidden = true;
    }, { once: true });
  } else {
    lineup.hidden = true;
  }
  lineupShown = show;
}

function renderResult() {
  result.replaceChildren();
  result.hidden = !state.result.show;
  if (!state.result.show) return;
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
}

function renderStats() {
  const stats = document.getElementById("stats");
  const show = Boolean(state.stats?.show);
  stats.hidden = !show;
  stats.replaceChildren();
  if (!show) return;
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
}

function renderCard() {
  const box = document.getElementById("pcard");
  const player = findPlayer(state.active?.raiderId) || findPlayer(state.active?.stopperId);
  const show = Boolean(state.stats?.card) && player;
  box.hidden = !show;
  box.replaceChildren();
  if (!show) return;
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
}

function renderStandings() {
  const box = document.getElementById("standings");
  const show = Boolean(state.stats?.standings);
  box.hidden = !show;
  box.replaceChildren();
  if (!show) return;
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
}

function renderTop5() {
  const box = document.getElementById("top5");
  const show = Boolean(state.top5?.show);
  box.hidden = !show;
  box.replaceChildren();
  if (!show) return;
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
}

function renderLogo() {
  logo.className = "corner-logo logo-left";
  if (state.logo) {
    logo.hidden = false;
    if (logo.getAttribute("src") !== state.logo) {
      logo.onload = () => placeFloating();
      logo.src = state.logo;
    }
  } else {
    logo.hidden = true;
    logo.removeAttribute("src");
  }
}

function paintSponsor() {
  if (!state) return;
  const items = state.sponsors.filter((item) => item.image);
  if (!items.length) {
    sponsor.hidden = true;
    sponsorKey = "";
    return;
  }
  sponsor.hidden = false;
  const index = Math.floor(Date.now() / (state.sponsorSeconds * 1000)) % items.length;
  const item = items[index];
  const key = `${index}:${item.image.slice(0, 48)}`;
  if (key !== sponsorKey) {
    sponsorImg.src = item.image;
    sponsorLabel.textContent = item.label;
    sponsorKey = key;
  }
  placeFloating();
}

function placeFloating() {
  const gap = 24 + (ticker.hidden ? 0 : ticker.offsetHeight);
  const position = state?.board.position || "bottom-center";
  const logoBlock = logo.hidden ? 0 : Math.max(logo.offsetHeight || 0, 72) + 18;
  if (!board.hidden && position === "top-left") {
    board.style.top = `${28 + logoBlock}px`;
    board.style.bottom = "";
    board.style.left = "36px";
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
    sponsor.style.bottom = `${gap + 16}px`;
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
  renderTop5();
  renderTicker();
  renderResult();
  renderLogo();
  paintSponsor();
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
    }, 250);
  }
}
