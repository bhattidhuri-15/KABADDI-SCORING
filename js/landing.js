import { createSync } from "./sync.js";
import { DEFAULT_TOURNAMENT, defaultState, hashPin, isMatchId, newMatchId, pageUrl } from "./model.js";

const tournamentInput = document.getElementById("tournament");
const pinInput = document.getElementById("pin");
const createButton = document.getElementById("create");
const createStatus = document.getElementById("createStatus");
const links = document.getElementById("links");

tournamentInput.value = DEFAULT_TOURNAMENT;

function setStatus(text, bad = false) {
  createStatus.textContent = text;
  createStatus.classList.toggle("bad", bad);
}

async function copyFrom(id, button) {
  const text = document.getElementById(id).value;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    document.getElementById(id).focus();
    document.getElementById(id).select();
    document.execCommand("copy");
  }
  const old = button.textContent;
  button.textContent = "Copied";
  window.setTimeout(() => {
    button.textContent = old;
  }, 1200);
}

function showLinks(id, pin) {
  const overlay = pageUrl("overlay.html", { match: id });
  const preview = pageUrl("overlay.html", { match: id, preview: "1" });
  const control = pageUrl("control.html", { match: id, pin });
  document.getElementById("overlayUrl").value = overlay;
  document.getElementById("controlUrl").value = control;
  document.getElementById("overlayOpen").href = preview;
  document.getElementById("controlOpen").href = control;
  document.getElementById("matchIdLabel").textContent = id;
  links.hidden = false;
  links.scrollIntoView({ behavior: "smooth", block: "start" });
  try {
    localStorage.setItem("kabaddi-last", JSON.stringify({ id, pin, at: Date.now() }));
  } catch {
    /* the links are still on screen */
  }
}

document.body.addEventListener("click", (event) => {
  const button = event.target.closest("[data-copy]");
  if (!button) return;
  copyFrom(button.dataset.copy, button);
});

createButton.addEventListener("click", async () => {
  createButton.disabled = true;
  setStatus("Connecting…");
  const id = newMatchId();
  const pin = pinInput.value.trim();
  const tournament = tournamentInput.value;
  const state = defaultState(id, {
    pinHash: hashPin(pin),
    tournament,
  });
  let sync;
  try {
    sync = createSync({
      matchId: id,
      role: "control",
      onState() {},
      onStatus() {},
    });
  } catch (error) {
    setStatus(error.message, true);
    createButton.disabled = false;
    return;
  }
  const live = await sync.waitForLive(8000);
  if (live) {
    sync.publish(state);
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    setStatus("Match is live. Copy the two links below.");
  } else {
    setStatus("No connection. The links are ready, but open Control and tap “Start empty match” when you are online.", true);
  }
  showLinks(id, pin);
  createButton.disabled = false;
});

function openExisting(file) {
  const id = document.getElementById("existingId").value.trim().toLowerCase();
  const pin = document.getElementById("existingPin").value.trim();
  const error = document.getElementById("existingError");
  if (!isMatchId(id)) {
    error.hidden = false;
    return;
  }
  error.hidden = true;
  const params = { match: id };
  if (file === "control.html") params.pin = pin;
  location.href = pageUrl(file, params);
}

document.getElementById("openControl").addEventListener("click", () => openExisting("control.html"));
document.getElementById("openOverlay").addEventListener("click", () => openExisting("overlay.html"));

try {
  const last = JSON.parse(localStorage.getItem("kabaddi-last") || "null");
  if (last && isMatchId(last.id)) {
    document.getElementById("lastCard").hidden = false;
    document.getElementById("lastText").textContent = `Match ${last.id}`;
    document.getElementById("lastControl").href = pageUrl("control.html", { match: last.id, pin: last.pin || "" });
    document.getElementById("lastOverlay").href = pageUrl("overlay.html", { match: last.id, preview: "1" });
  }
} catch {
  /* ignore a broken saved match */
}
