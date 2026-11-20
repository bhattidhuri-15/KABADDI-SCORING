import { isNewer, sanitizeState, storageKey } from "./model.js";

const BROKERS = [
  { id: "emqx", url: "wss://broker.emqx.io:8084/mqtt" },
  { id: "hivemq", url: "wss://broker.hivemq.com:8884/mqtt" },
  { id: "mosquitto", url: "wss://test.mosquitto.org:8081" },
];

export function topicFor(matchId) {
  return `kabaddi/board/v1/${matchId}`;
}

function resolveMqtt() {
  const lib = globalThis.mqtt;
  if (!lib) throw new Error("MQTT library failed to load");
  if (typeof lib.connect === "function") return lib;
  if (lib.default && typeof lib.default.connect === "function") return lib.default;
  throw new Error("MQTT library has no connect()");
}

export function createSync({ matchId, role, onState, onStatus }) {
  const topic = topicFor(matchId);
  const mqtt = resolveMqtt();
  const clients = [];
  let current = null;
  let pending = false;
  let origin = "none";
  let liveCount = 0;

  function persist(state) {
    try {
      localStorage.setItem(storageKey(matchId), JSON.stringify(state));
    } catch {
      /* private mode or a full disk should not stop the live match */
    }
  }

  function emitStatus() {
    liveCount = clients.filter((client) => client.connected).length;
    onStatus?.({
      live: liveCount > 0,
      connected: liveCount,
      total: clients.length,
      pending,
    });
  }

  function publishPayload(state, onlyClient) {
    const payload = JSON.stringify(state);
    let sent = 0;
    for (const client of clients) {
      if (onlyClient && client !== onlyClient) continue;
      if (!client.connected) continue;
      client.publish(topic, payload, { qos: 1, retain: true });
      sent += 1;
    }
    return sent;
  }

  function flush() {
    if (!pending || !current || role === "overlay") return;
    if (publishPayload(current) > 0) {
      pending = false;
      emitStatus();
    }
  }

  function publish(state) {
    current = structuredClone(state);
    origin = "local";
    persist(current);
    if (role === "overlay") return;
    pending = true;
    emitStatus();
    flush();
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(storageKey(matchId));
      if (!raw) return null;
      const clean = sanitizeState(JSON.parse(raw));
      return clean && clean.id === matchId ? clean : null;
    } catch {
      return null;
    }
  }

  function adopt(clean, fromClient) {
    if (!isNewer(clean, current)) {
      if (fromClient) fromClient._seen = Math.max(fromClient._seen || 0, clean.revision);
      return false;
    }
    current = clean;
    origin = "remote";
    if (fromClient) fromClient._seen = clean.revision;
    persist(clean);
    onState?.(structuredClone(clean));
    if (role !== "overlay") {
      for (const other of clients) {
        if (other !== fromClient && other.connected) publishPayload(clean, other);
      }
    }
    return true;
  }

  for (const broker of BROKERS) {
    let client;
    try {
      client = mqtt.connect(broker.url, {
        clientId: `kb${role.slice(0, 1)}${Math.random().toString(16).slice(2, 10)}`,
        clean: true,
        reconnectPeriod: 2000,
        connectTimeout: 8000,
        keepalive: 25,
        protocolVersion: 4,
      });
    } catch {
      continue;
    }
    client._seen = 0;
    client._brokerId = broker.id;
    clients.push(client);

    client.on("connect", () => {
      emitStatus();
      client.subscribe(topic, { qos: 1 });
      flush();
      const token = Symbol(broker.id);
      client._heal = token;
      window.setTimeout(() => {
        if (client._heal !== token || !client.connected) return;
        if (role === "overlay" || !current) return;
        if (origin === "none") return;
        if ((client._seen || 0) < current.revision) publishPayload(current, client);
      }, 1600);
    });

    client.on("message", (_topic, buffer) => {
      let data;
      try {
        data = JSON.parse(buffer.toString());
      } catch {
        return;
      }
      const clean = sanitizeState(data);
      if (!clean || clean.id !== matchId) return;
      client._seen = Math.max(client._seen || 0, clean.revision);
      adopt(clean, client);
    });

    client.on("close", emitStatus);
    client.on("offline", emitStatus);
    client.on("reconnect", emitStatus);
    client.on("error", () => {});
  }

  function waitForLive(timeoutMs) {
    if (liveCount > 0) return Promise.resolve(true);
    return new Promise((resolve) => {
      const started = Date.now();
      const timer = window.setInterval(() => {
        if (liveCount > 0) {
          window.clearInterval(timer);
          resolve(true);
        } else if (Date.now() - started >= timeoutMs) {
          window.clearInterval(timer);
          resolve(false);
        }
      }, 120);
    });
  }

  return {
    publish,
    readCache,
    waitForLive,
    close() {
      for (const client of clients) {
        try {
          client.end(true);
        } catch {
          /* already closed */
        }
      }
    },
  };
}
