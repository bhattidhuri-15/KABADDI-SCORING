import { createSync } from "./sync.js";
import {
  COLOUR_FIELDS,
  LAYOUTS,
  POSITIONS,
  coloursFor,
  MAX_IMAGE_CHARS,
  MAX_RAIDERS,
  MAX_SPONSORS,
  MOTIONS,
  THEMES,
  addPoint,
  clampInt,
  defaultState,
  effectiveRemaining,
  formatScore,
  hashPin,
  isMatchId,
  newMatchId,
  pageUrl,
  removePoint,
  sanitizeState,
  startClock,
  stopClock,
  undoKey,
} from "./model.js";

const params = new URLSearchParams(location.search);
const matchId = (params.get("match") || "").toLowerCase();
let urlPin = params.get("pin") || "";
const $ = (id) => document.getElementById(id);

const SWATCH = {
  rbw: "linear-gradient(90deg, #e10600 50%, #1d4ed8 50%)",
  purple: "#c084fc",
  red: "#e11d48",
  blue: "#60a5fa",
  green: "#4ade80",
  gold: "#f5c451",
  rose: "#e7b8a8",
  neon: "#b6ff3c",
  ink: "#ffffff",
};

let state = null;
let sync = null;
let settled = false;
let sawRemote = false;
let syncStatus = { live: false, pending: false };
let undoStack = [];
let softUndo = null;
let softTimer = 0;
let playerSig = "";

function show(which) {
  $("bad").hidden = which !== "bad";
  $("gate").hidden = which !== "gate";
  $("boot").hidden = which !== "boot";
  $("app").hidden = which !== "app";
  if (which === "gate") $("pinInput").focus();
}

function canOpen(next) {
  if (!next?.pinHash) return true;
  return hashPin(urlPin) === next.pinHash;
}

function loadUndo() {
  try {
    const raw = sessionStorage.getItem(undoKey(matchId));
    const parsed = raw ? JSON.parse(raw) : [];
    undoStack = Array.isArray(parsed) ? parsed.map(sanitizeState).filter(Boolean).slice(-12) : [];
  } catch {
    undoStack = [];
  }
}

function saveUndo() {
  try {
    sessionStorage.setItem(undoKey(matchId), JSON.stringify(undoStack.slice(-12)));
  } catch {
    /* undo still works until refresh */
  }
}

function setInput(el, value) {
  if (!el || document.activeElement === el) return;
  const next = value == null ? "" : String(value);
  if (el.value !== next) el.value = next;
}

function paintStatus() {
  const el = $("status");
  el.className = "status";
  if (!syncStatus.live) {
    el.textContent = syncStatus.pending ? "Offline — waiting to send" : "Offline";
    el.classList.add("bad");
  } else if (syncStatus.pending) {
    el.textContent = "Sending…";
  } else {
    el.textContent = "Live";
    el.classList.add("live");
  }
}

function paint() {
  if (!state) return;
  $("heading").textContent = state.tournament || `Match ${matchId}`;
  document.title = state.tournament ? `${state.tournament} · Control` : "Kabaddi Control";
  $("stripTitle").textContent = state.matchTitle;
  setInput($("tournament"), state.tournament);
  setInput($("matchTitle"), state.matchTitle);
  for (const side of ["A", "B"]) {
    const team = state.teams[side];
    $(`stripName${side}`).textContent = team.name;
    $(`stripScore${side}`).textContent = formatScore(team.score);
    $(`score${side}`).textContent = formatScore(team.score);
    $(`raiders${side}`).textContent = String(team.raiders);
    setInput($(`name${side}`), team.name);
  }
  $("topOn").checked = state.ticker.top.on;
  $("mainOn").checked = state.ticker.main.on;
  $("bottomOn").checked = state.ticker.bottom.on;
  setInput($("topTitle"), state.ticker.top.title);
  setInput($("topText"), state.ticker.top.text);
  setInput($("mainTitle"), state.ticker.main.title);
  setInput($("mainText"), state.ticker.main.text);
  setInput($("nextTitle"), state.ticker.main.nextTitle);
  setInput($("nextText"), state.ticker.main.nextText);
  setInput($("bottomTitle"), state.ticker.bottom.title);
  setInput($("bottomText"), state.ticker.bottom.text);
  if (document.activeElement !== $("speed")) $("speed").value = String(state.ticker.speed);
  $("boardShow").checked = state.board.show;
  $("lineupShow").checked = state.lineup.show;
  $("statsShow").checked = Boolean(state.stats?.show);
  $("cardShow").checked = Boolean(state.stats?.card);
  $("standShow").checked = Boolean(state.stats?.standings);
  $("top5Show").checked = Boolean(state.top5?.show);
  setInput($("top5Title"), state.top5?.title || "");
  setInput($("top5Sub"), state.top5?.subtitle || "");
  $("showNames").checked = state.active.showOnBoard;
  document.querySelectorAll("#layouts button").forEach((button) => {
    button.classList.toggle("on", button.dataset.layout === state.board.layout);
  });
  document.querySelectorAll("#positions button").forEach((button) => {
    button.classList.toggle("on", button.dataset.position === state.board.position);
  });
  document.querySelectorAll("#themes button").forEach((button) => {
    button.classList.toggle("on", button.dataset.theme === state.board.theme);
  });
  document.querySelectorAll("#motions button").forEach((button) => {
    button.classList.toggle("on", button.dataset.motion === (state.board.motion || "sheen"));
  });
  setInput($("themePreset"), state.board.theme);
  paintColours();
  paintTop5();
  $("resultShow").checked = state.result.show;
  document.querySelectorAll("#resultModes button").forEach((button) => {
    button.classList.toggle("on", button.dataset.mode === state.result.mode);
  });
  $("winA").classList.toggle("on", state.result.winner === "A");
  $("winB").classList.toggle("on", state.result.winner === "B");
  $("winA").textContent = `${state.teams.A.name} wins`;
  $("winB").textContent = `${state.teams.B.name} wins`;
  setInput($("prize"), state.result.prize);
  setInput($("player"), state.result.player);
  setInput($("logoUrl"), state.logo.startsWith("data:") ? "" : state.logo);
  const preview = $("logoPreview");
  if (state.logo) {
    preview.hidden = false;
    preview.src = state.logo;
  } else preview.hidden = true;
  $("raidShow").checked = state.clocks.raid.show;
  $("matchShow").checked = state.clocks.match.show;
  if (![...$("timezone").options].some((option) => option.value === state.ticker.timezone)) {
    const option = document.createElement("option");
    option.value = state.ticker.timezone;
    option.textContent = state.ticker.timezone;
    $("timezone").appendChild(option);
  }
  setInput($("timezone"), state.ticker.timezone);
  $("checking").hidden = settled && (sawRemote || syncStatus.live);
  $("app").classList.toggle("is-locked", !settled);
  paintStatus();
  paintSponsors();
  paintPlayers();
  refreshLinks();
}

function refreshLinks() {
  $("overlayLink").value = pageUrl("overlay.html", { match: matchId });
  $("previewLink").value = pageUrl("overlay.html", { match: matchId, preview: "1" });
}

function publishNow() {
  state.revision += 1;
  state.updatedAt = Date.now();
  sync.publish(state);
  saveUndo();
  paint();
}

function commit(mutator) {
  if (!state || !settled) return;
  window.clearTimeout(softTimer);
  if (softUndo) {
    undoStack.push(softUndo);
    softUndo = null;
  }
  undoStack.push(structuredClone(state));
  if (undoStack.length > 12) undoStack.shift();
  mutator(state, Date.now());
  publishNow();
  navigator.vibrate?.(12);
}

function softEdit(mutator) {
  if (!state || !settled) return;
  if (!softUndo) softUndo = structuredClone(state);
  mutator(state);
  paint();
  window.clearTimeout(softTimer);
  softTimer = window.setTimeout(() => {
    if (!softUndo || !state) return;
    undoStack.push(softUndo);
    softUndo = null;
    if (undoStack.length > 12) undoStack.shift();
    publishNow();
  }, 240);
}

function ask(message) {
  $("modalText").textContent = message;
  $("modal").hidden = false;
  return new Promise((resolve) => {
    const finish = (value) => {
      $("modal").hidden = true;
      $("modalYes").onclick = null;
      $("modalNo").onclick = null;
      resolve(value);
    };
    $("modalYes").onclick = () => finish(true);
    $("modalNo").onclick = () => finish(false);
  });
}

let lastColour = "teamA";

function buildColours() {
  const select = $("themePreset");
  for (const [id, label] of THEMES) {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = label;
    select.appendChild(option);
  }
  select.addEventListener("change", () => commit((next) => {
    next.board.theme = select.value;
    next.colours = coloursFor(select.value);
  }));
  $("resetColours").addEventListener("click", () => commit((next) => {
    next.board.theme = "rbw";
    next.colours = coloursFor("rbw");
  }));
  for (const color of ["#e10600", "#1d4ed8", "#ffffff", "#000000", "#f5c451", "#15803d"]) {
    const button = document.createElement("button");
    button.type = "button";
    button.title = color;
    button.style.background = color;
    button.addEventListener("click", () => softEdit((next) => { next.colours[lastColour] = color; }));
    $("swatches").appendChild(button);
  }
  const fields = $("colourFields");
  for (const [key, label] of COLOUR_FIELDS) {
    const row = document.createElement("label");
    row.className = "colour-row";
    row.innerHTML = `<span>${label}</span><input type="color" data-colour="${key}" /><input type="text" data-colour-hex="${key}" maxlength="7" spellcheck="false" />`;
    fields.appendChild(row);
  }
  fields.addEventListener("focusin", (event) => {
    const key = event.target.dataset.colour || event.target.dataset.colourHex;
    if (key) lastColour = key;
  });
  fields.addEventListener("input", (event) => {
    const key = event.target.dataset.colour || event.target.dataset.colourHex;
    if (!key) return;
    const value = event.target.value.trim();
    if (event.target.dataset.colourHex && !/^#[0-9a-fA-F]{6}$/.test(value)) return;
    softEdit((next) => { next.colours[key] = value.toLowerCase(); });
  });
}

function paintColours() {
  if (!state.colours) state.colours = coloursFor(state.board.theme || "rbw");
  for (const [key] of COLOUR_FIELDS) {
    setInput(document.querySelector(`[data-colour="${key}"]`), state.colours[key]);
    setInput(document.querySelector(`[data-colour-hex="${key}"]`), state.colours[key]);
  }
}

function buildTop5() {
  const box = $("top5Slots");
  for (let index = 0; index < 5; index += 1) {
    const slot = document.createElement("div");
    slot.className = "sponsor-slot";
    slot.innerHTML = `<p class="eyebrow">Player ${index + 1}</p>
      <div class="pair"><label><span>First name</span><input data-top-first="${index}" maxlength="16" /></label><label><span>Surname</span><input data-top-last="${index}" maxlength="18" /></label></div>
      <div class="pair"><label><span>Team</span><input data-top-team="${index}" maxlength="18" /></label><label><span>Stat</span><input data-top-stat="${index}" maxlength="12" placeholder="points" /></label></div>
      <label><span>Column colour</span><input type="color" data-top-color="${index}" /></label>
      <label><span>Photo link</span><input data-top-photo="${index}" type="url" placeholder="https://" /></label>
      <label><span>Or upload photo</span><input data-top-file="${index}" type="file" accept="image/*" /></label>
      <img data-top-preview="${index}" class="preview-img" alt="" hidden />
      <button type="button" class="btn" data-top-clear="${index}">Remove photo</button>`;
    box.appendChild(slot);
  }
  box.addEventListener("input", (event) => {
    const fields = [["topFirst", "first"], ["topLast", "last"], ["topTeam", "team"], ["topStat", "stat"], ["topColor", "color"], ["topPhoto", "photo"]];
    for (const [data, field] of fields) {
      if (event.target.dataset[data] == null) continue;
      const index = Number(event.target.dataset[data]);
      softEdit((next) => { next.top5.slots[index][field] = event.target.value; });
      return;
    }
  });
  box.addEventListener("change", async (event) => {
    const file = event.target.closest("[data-top-file]");
    if (!file?.files?.[0]) return;
    const index = Number(file.dataset.topFile);
    try {
      const image = await useImage(file.files[0]);
      commit((next) => { next.top5.slots[index].photo = image; });
    } catch (error) {
      window.alert(error.message);
    }
    file.value = "";
  });
  box.addEventListener("click", (event) => {
    const clear = event.target.closest("[data-top-clear]");
    if (!clear) return;
    const index = Number(clear.dataset.topClear);
    commit((next) => { next.top5.slots[index].photo = ""; });
  });
}

function paintTop5() {
  if (!state.top5) return;
  const root = $("tab-top5");
  if (root.contains(document.activeElement) && document.activeElement.matches("input, select, textarea")) return;
  state.top5.slots.forEach((slot, index) => {
    const set = (name, value) => setInput(document.querySelector(`[data-top-${name}="${index}"]`), value);
    set("first", slot.first);
    set("last", slot.last);
    set("team", slot.team);
    set("stat", slot.stat);
    set("color", slot.color);
    set("photo", slot.photo.startsWith("data:") ? "" : slot.photo);
    const preview = document.querySelector(`[data-top-preview="${index}"]`);
    if (!preview) return;
    if (slot.photo) {
      preview.hidden = false;
      preview.src = slot.photo;
    } else {
      preview.hidden = true;
      preview.removeAttribute("src");
    }
  });
}

function buildChoices() {
  const layouts = $("layouts");
  const themes = $("themes");
  for (const [id, label] of LAYOUTS) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.layout = id;
    button.textContent = label;
    button.addEventListener("click", () => commit((next) => {
      next.board.layout = id;
      if (id === "corner") next.board.position = "top-left";
    }));
    layouts.appendChild(button);
  }
  const positions = $("positions");
  for (const [id, label] of POSITIONS) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.position = id;
    button.textContent = label;
    button.addEventListener("click", () => commit((next) => { next.board.position = id; }));
    positions.appendChild(button);
  }
  const motions = $("motions");
  for (const [id, label] of MOTIONS) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.motion = id;
    button.textContent = label;
    button.addEventListener("click", () => commit((next) => { next.board.motion = id; }));
    motions.appendChild(button);
  }
  for (const [id, label] of THEMES) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.theme = id;
    button.innerHTML = `<i class="swatch" style="background:${SWATCH[id]}"></i>${label}`;
    button.addEventListener("click", () => commit((next) => {
      next.board.theme = id;
      next.colours = coloursFor(id);
    }));
    themes.appendChild(button);
  }
}

function paintSponsors() {
  const box = $("sponsors");
  if (box.childElementCount) {
    fillSponsorFields();
    return;
  }
  const title = document.createElement("p");
  title.className = "eyebrow";
  title.textContent = "Sponsor pictures";
  box.appendChild(title);
  for (let index = 0; index < MAX_SPONSORS; index += 1) {
    const slot = document.createElement("div");
    slot.className = "sponsor-slot";
    slot.innerHTML = `<label><span>Sponsor ${index + 1} name</span><input data-sponsor-label="${index}" maxlength="28" /></label>
      <label><span>Image link</span><input data-sponsor-url="${index}" type="url" placeholder="https://" /></label>
      <label><span>Or upload</span><input data-sponsor-file="${index}" type="file" accept="image/*" /></label>
      <img data-sponsor-preview="${index}" class="preview-img" alt="" hidden />
      <button type="button" class="btn" data-sponsor-clear="${index}">Remove</button>`;
    box.appendChild(slot);
  }
  fillSponsorFields();
}

function fillSponsorFields() {
  for (let index = 0; index < MAX_SPONSORS; index += 1) {
    const item = state.sponsors[index] || { label: "", image: "" };
    const label = document.querySelector(`[data-sponsor-label="${index}"]`);
    const url = document.querySelector(`[data-sponsor-url="${index}"]`);
    const preview = document.querySelector(`[data-sponsor-preview="${index}"]`);
    setInput(label, item.label);
    setInput(url, item.image.startsWith("data:") ? "" : item.image);
    if (item.image) {
      preview.hidden = false;
      preview.src = item.image;
    } else preview.hidden = true;
  }
}

function paintPlayers() {
  const root = $("tab-lineup");
  const sig = JSON.stringify({ A: state.teams.A.players, B: state.teams.B.players, active: state.active });
  if (sig === playerSig) return;
  const active = document.activeElement;
  if (root.contains(active) && active.matches("input, select, textarea")) return;
  playerSig = sig;
  for (const side of ["A", "B"]) {
    const box = $(`players${side}`);
    box.replaceChildren();
    const heading = document.createElement("h2");
    heading.textContent = state.teams[side].name;
    box.appendChild(heading);
    state.teams[side].players.forEach((player, index) => {
      const row = document.createElement("div");
      row.className = "sponsor-slot";
      row.innerHTML = `<label><span>Name</span><input data-player-name="${side}:${index}" maxlength="24" /></label>
        <div class="pair">
          <label><span>Number</span><input data-player-number="${side}:${index}" maxlength="3" /></label>
          <label><span>Stat</span><input data-player-stat="${side}:${index}" inputmode="numeric" maxlength="3" /></label>
        </div>
        <label><span>Role</span>
          <select data-player-role="${side}:${index}">
            <option value="">—</option>
            <option value="raider">Raider</option>
            <option value="jaafi">Jaafi (stopper)</option>
          </select>
        </label>
        <label><span>Photo link</span><input data-player-photo="${side}:${index}" type="url" placeholder="https://" /></label>
        <label><span>Or upload photo</span><input data-player-file="${side}:${index}" type="file" accept="image/*" /></label>
        <div class="pair">
          <button type="button" data-now="raider" data-id="${player.id}">Raiding now</button>
          <button type="button" data-now="stopper" data-id="${player.id}">Stopping now</button>
        </div>
        <button type="button" class="btn" data-remove-player="${side}:${player.id}">Remove</button>`;
      box.appendChild(row);
      row.querySelector("[data-player-name]").value = player.name;
      row.querySelector("[data-player-number]").value = player.number;
      row.querySelector("[data-player-role]").value = player.role;
      row.querySelector("[data-player-stat]").value = String(player.stat || 0);
      row.querySelector("[data-player-photo]").value = player.photo?.startsWith("data:") ? "" : (player.photo || "");
      row.querySelector('[data-now="raider"]').classList.toggle("on", state.active.raiderId === player.id);
      row.querySelector('[data-now="stopper"]').classList.toggle("on", state.active.stopperId === player.id);
    });
    const add = document.createElement("button");
    add.type = "button";
    add.className = "btn primary wide";
    add.textContent = "Add player";
    add.addEventListener("click", () => {
      commit((next) => {
        next.teams[side].players.push({ id: newMatchId(6), name: "Player", number: "", role: "" });
      });
      playerSig = "";
    });
    box.appendChild(add);
  }
}

async function useImage(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that picture"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 300 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let quality = 0.72;
        let data = canvas.toDataURL("image/jpeg", quality);
        while (data.length > MAX_IMAGE_CHARS && quality > 0.4) {
          quality -= 0.08;
          data = canvas.toDataURL("image/jpeg", quality);
        }
        if (data.length > MAX_IMAGE_CHARS) reject(new Error("Picture is still too big"));
        else resolve(data);
      };
      img.onerror = () => reject(new Error("That file is not a picture"));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
  return dataUrl;
}

function bindText(id, apply) {
  $(id).addEventListener("input", () => softEdit((next) => apply(next, $(id).value)));
}

function bind() {
  document.querySelector(".tabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (!button) return;
    document.querySelectorAll(".tabs button").forEach((item) => item.classList.toggle("on", item === button));
    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.hidden = panel.id !== `tab-${button.dataset.tab}`;
    });
  });

  $("app").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-act]");
    if (button && state && settled) {
      const { act, team } = button.dataset;
      const amount = Number(button.dataset.n || 0);
      if (act === "score") {
        commit((next) => (amount > 0 ? addPoint(next, team) : removePoint(next, team)));
      } else if (act === "raiders") {
        commit((next) => {
          next.teams[team].raiders = clampInt(next.teams[team].raiders + amount, 0, MAX_RAIDERS, next.teams[team].raiders);
        });
      } else if (act === "count") {
        const key = button.dataset.key === "stops" ? "stops" : "raids";
        commit((next) => {
          next.stats[team][key] = clampInt((next.stats[team][key] || 0) + amount, 0, 999, 0);
        });
      } else if (act === "winner") {
        commit((next) => { next.result.winner = team; });
      } else if (act === "raid-start") {
        commit((next, now) => {
          next.clocks.raid.show = true;
          next.clocks.raid.remainingMs = next.clocks.raid.durationMs;
          startClock(next.clocks.raid, now);
        });
      } else if (act === "raid-reset") {
        commit((next, now) => {
          stopClock(next.clocks.raid, now);
          next.clocks.raid.remainingMs = next.clocks.raid.durationMs;
        });
      } else if (act === "match-start") {
        commit((next, now) => {
          next.clocks.match.show = true;
          startClock(next.clocks.match, now);
        });
      } else if (act === "match-reset") {
        commit((next, now) => {
          stopClock(next.clocks.match, now);
          next.clocks.match.remainingMs = next.clocks.match.durationMs;
        });
      } else if (act === "undo") {
        const prev = undoStack.pop();
        if (!prev) return;
        const revision = state.revision + 1;
        state = structuredClone(prev);
        state.revision = revision;
        state.updatedAt = Date.now();
        playerSig = "";
        saveUndo();
        sync.publish(state);
        paint();
      } else if (act === "reset") {
        const ok = await ask("Reset the score and raiders? Names, ticker text, and pictures stay.");
        if (!ok) return;
        commit((next, now) => {
          for (const side of ["A", "B"]) {
            next.teams[side].score = 0;
            next.teams[side].raiders = 0;
          }
          next.result.show = false;
          next.lineup.show = false;
          stopClock(next.clocks.raid, now);
          stopClock(next.clocks.match, now);
          next.clocks.raid.remainingMs = next.clocks.raid.durationMs;
          next.clocks.match.remainingMs = next.clocks.match.durationMs;
        });
      }
    }
    const nowButton = event.target.closest("[data-now]");
    if (nowButton && state) {
      const id = nowButton.dataset.id;
      commit((next) => {
        if (nowButton.dataset.now === "raider") next.active.raiderId = next.active.raiderId === id ? "" : id;
        else next.active.stopperId = next.active.stopperId === id ? "" : id;
        if (next.active.raiderId && next.active.raiderId === next.active.stopperId) next.active.stopperId = "";
      });
      playerSig = "";
    }
    const remove = event.target.closest("[data-remove-player]");
    if (remove && state) {
      const [side, id] = remove.dataset.removePlayer.split(":");
      commit((next) => {
        next.teams[side].players = next.teams[side].players.filter((player) => player.id !== id);
        if (next.active.raiderId === id) next.active.raiderId = "";
        if (next.active.stopperId === id) next.active.stopperId = "";
      });
      playerSig = "";
    }
    const copy = event.target.closest("[data-copy]");
    if (copy) {
      const input = $(copy.dataset.copy);
      try { await navigator.clipboard.writeText(input.value); } catch { input.select(); document.execCommand("copy"); }
      const old = copy.textContent;
      copy.textContent = "Copied";
      window.setTimeout(() => { copy.textContent = old; }, 1000);
    }
    const clearSponsor = event.target.closest("[data-sponsor-clear]");
    if (clearSponsor && state) {
      const index = Number(clearSponsor.dataset.sponsorClear);
      commit((next) => { next.sponsors.splice(index, 1); });
    }
  });

  $("tab-lineup").addEventListener("change", async (event) => {
    const file = event.target.closest("[data-player-file]");
    if (!file?.files?.[0]) return;
    const [side, index] = file.dataset.playerFile.split(":");
    try {
      const image = await useImage(file.files[0]);
      commit((next) => { next.teams[side].players[Number(index)].photo = image; });
      playerSig = "";
    } catch (error) {
      window.alert(error.message);
    }
    file.value = "";
  });
  $("tab-lineup").addEventListener("input", (event) => {
    const name = event.target.closest("[data-player-name]");
    const number = event.target.closest("[data-player-number]");
    const role = event.target.closest("[data-player-role]");
    const stat = event.target.closest("[data-player-stat]");
    const photo = event.target.closest("[data-player-photo]");
    const source = name || number || role || stat || photo;
    if (!source) return;
    const key = name ? "playerName" : number ? "playerNumber" : role ? "playerRole" : stat ? "playerStat" : "playerPhoto";
    const [side, index] = source.dataset[key].split(":");
    softEdit((next) => {
      const player = next.teams[side].players[Number(index)];
      if (!player) return;
      if (name) player.name = name.value;
      if (number) player.number = number.value;
      if (role) player.role = role.value;
      if (stat) player.stat = Number(stat.value) || 0;
      if (photo) player.photo = photo.value.trim();
    });
    playerSig = JSON.stringify({ A: state.teams.A.players, B: state.teams.B.players, active: state.active });
  });

  bindText("tournament", (next, value) => { next.tournament = value; });
  bindText("matchTitle", (next, value) => { next.matchTitle = value; });
  bindText("nameA", (next, value) => { next.teams.A.name = value; });
  bindText("nameB", (next, value) => { next.teams.B.name = value; });
  bindText("topTitle", (next, value) => { next.ticker.top.title = value; });
  bindText("topText", (next, value) => { next.ticker.top.text = value; });
  bindText("mainTitle", (next, value) => { next.ticker.main.title = value; });
  bindText("mainText", (next, value) => { next.ticker.main.text = value; });
  bindText("nextTitle", (next, value) => { next.ticker.main.nextTitle = value; });
  bindText("nextText", (next, value) => { next.ticker.main.nextText = value; });
  bindText("bottomTitle", (next, value) => { next.ticker.bottom.title = value; });
  bindText("bottomText", (next, value) => { next.ticker.bottom.text = value; });
  bindText("prize", (next, value) => { next.result.prize = value; });
  bindText("player", (next, value) => { next.result.player = value; });
  $("speed").addEventListener("input", () => softEdit((next) => { next.ticker.speed = Number($("speed").value); }));
  $("logoUrl").addEventListener("change", () => commit((next) => { next.logo = $("logoUrl").value.trim(); }));

  for (const [id, path] of [["topOn", "top"], ["mainOn", "main"], ["bottomOn", "bottom"]]) {
    $(id).addEventListener("change", () => commit((next) => { next.ticker[path].on = $(id).checked; }));
  }
  $("boardShow").addEventListener("change", () => commit((next) => { next.board.show = $("boardShow").checked; }));
  $("lineupShow").addEventListener("change", () => commit((next) => { next.lineup.show = $("lineupShow").checked; }));
  $("statsShow").addEventListener("change", () => commit((next) => { next.stats.show = $("statsShow").checked; }));
  $("cardShow").addEventListener("change", () => commit((next) => { next.stats.card = $("cardShow").checked; }));
  $("standShow").addEventListener("change", () => commit((next) => { next.stats.standings = $("standShow").checked; }));
  $("top5Show").addEventListener("change", () => commit((next) => { next.top5.show = $("top5Show").checked; }));
  bindText("top5Title", (next, value) => { next.top5.title = value; });
  bindText("top5Sub", (next, value) => { next.top5.subtitle = value; });
  $("showNames").addEventListener("change", () => commit((next) => { next.active.showOnBoard = $("showNames").checked; }));
  $("resultShow").addEventListener("change", () => commit((next) => { next.result.show = $("resultShow").checked; }));
  $("raidShow").addEventListener("change", () => commit((next) => { next.clocks.raid.show = $("raidShow").checked; }));
  $("matchShow").addEventListener("change", () => commit((next) => { next.clocks.match.show = $("matchShow").checked; }));
  $("timezone").addEventListener("change", () => commit((next) => { next.ticker.timezone = $("timezone").value; }));
  document.querySelectorAll("#resultModes button").forEach((button) => {
    button.addEventListener("click", () => commit((next) => { next.result.mode = button.dataset.mode; }));
  });

  $("logoFile").addEventListener("change", async () => {
    const file = $("logoFile").files?.[0];
    if (!file) return;
    try {
      const image = await useImage(file);
      commit((next) => { next.logo = image; });
    } catch (error) {
      window.alert(error.message);
    }
    $("logoFile").value = "";
  });
  $("logoClear").addEventListener("click", () => commit((next) => { next.logo = ""; }));

  $("sponsors").addEventListener("change", async (event) => {
    const fileInput = event.target.closest("[data-sponsor-file]");
    const urlInput = event.target.closest("[data-sponsor-url]");
    const labelInput = event.target.closest("[data-sponsor-label]");
    if (labelInput) return;
    const index = Number((fileInput || urlInput)?.dataset.sponsorFile || (fileInput || urlInput)?.dataset.sponsorUrl);
    if (Number.isNaN(index)) return;
    if (urlInput) {
      commit((next) => {
        next.sponsors[index] = { label: next.sponsors[index]?.label || "", image: urlInput.value.trim() };
        next.sponsors = next.sponsors.filter((item) => item?.image);
      });
    }
    if (fileInput?.files?.[0]) {
      try {
        const image = await useImage(fileInput.files[0]);
        commit((next) => {
          const label = next.sponsors[index]?.label || "";
          next.sponsors[index] = { label, image };
          next.sponsors = next.sponsors.filter((item) => item?.image);
        });
      } catch (error) {
        window.alert(error.message);
      }
      fileInput.value = "";
    }
  });
  $("sponsors").addEventListener("input", (event) => {
    const labelInput = event.target.closest("[data-sponsor-label]");
    if (!labelInput) return;
    const index = Number(labelInput.dataset.sponsorLabel);
    softEdit((next) => {
      if (!next.sponsors[index]) return;
      next.sponsors[index].label = labelInput.value;
    });
  });

  $("pinSave").addEventListener("click", () => {
    const pin = $("pinNew").value.trim();
    urlPin = pin;
    const url = new URL(location.href);
    if (pin) url.searchParams.set("pin", pin);
    else url.searchParams.delete("pin");
    history.replaceState(null, "", url);
    commit((next) => { next.pinHash = hashPin(pin); });
    $("pinNew").value = "";
  });
  $("pinForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const typed = $("pinInput").value.trim();
    if (state && hashPin(typed) === state.pinHash) {
      urlPin = typed;
      const url = new URL(location.href);
      url.searchParams.set("pin", typed);
      history.replaceState(null, "", url);
      show("app");
      paint();
      return;
    }
    $("pinError").hidden = false;
  });
  $("startEmpty").addEventListener("click", async () => {
    const ok = await ask("Start an empty match on this id? Do this only when the overlay is still waiting.");
    if (!ok) return;
    state = defaultState(matchId, { pinHash: hashPin(urlPin) });
    settled = true;
    sawRemote = true;
    sync.publish(state);
    show("app");
    paint();
  });
}

function openState(next, fromRemote) {
  if (fromRemote) sawRemote = true;
  if (!canOpen(next)) {
    state = next;
    show("gate");
    return;
  }
  if (softUndo) return;
  state = structuredClone(next);
  if (!state.teams.A.players) state.teams.A.players = [];
  if (!state.teams.B.players) state.teams.B.players = [];
  show("app");
  playerSig = "";
  paint();
}

function settle() {
  if (settled) return;
  settled = true;
  if (state && canOpen(state)) {
    show("app");
    paint();
    return;
  }
  if (state) {
    show("gate");
    return;
  }
  $("bootTitle").textContent = "No saved match yet";
  $("bootText").textContent = "Nothing arrived yet. If this is a new match, start it.";
  $("startEmpty").hidden = false;
  show("boot");
}

if (!isMatchId(matchId)) {
  show("bad");
} else {
  loadUndo();
  buildChoices();
  buildColours();
  buildTop5();
  bind();
  try {
    sync = createSync({
      matchId,
      role: "control",
      onState: (next) => {
        settled = true;
        openState(next, true);
      },
      onStatus: (status) => {
        syncStatus = status;
        if (state && !$("app").hidden) paintStatus();
      },
    });
  } catch (error) {
    $("bootTitle").textContent = "Could not start";
    $("bootText").textContent = error.message;
  }
  if (sync) {
    const cached = sync.readCache();
    if (cached) openState(cached, false);
    window.setTimeout(settle, 2800);
    window.setInterval(() => {
      if (!state || !settled) return;
      let changed = false;
      const now = Date.now();
      for (const key of ["raid", "match"]) {
        const clock = state.clocks[key];
        if (clock.running && clock.startedAt && effectiveRemaining(clock, now) <= 0) {
          stopClock(clock, now);
          clock.remainingMs = 0;
          changed = true;
        }
      }
      if (changed) publishNow();
    }, 400);
    navigator.wakeLock?.request("screen").catch(() => {});
  }
}
