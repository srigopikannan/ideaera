import localtunnel from "localtunnel";
import fs from "fs";

let currentTunnel = null;
let isStarting = false;

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception caught:", err.message);
  restart();
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection caught:", reason);
  restart();
});

function restart() {
  if (isStarting) return;
  setTimeout(start, 3000);
}

async function start() {
  if (isStarting) return;
  isStarting = true;

  if (currentTunnel) {
    try { currentTunnel.close(); } catch (_) {}
    currentTunnel = null;
  }

  try {
    console.log("Opening localtunnel on port 3000...");
    const tunnel = await localtunnel({ port: 3000 });
    currentTunnel = tunnel;
    console.log("TUNNEL_URL=" + tunnel.url);
    fs.writeFileSync("tunnel_url.txt", tunnel.url, "utf8");

    tunnel.on("close", () => {
      console.log("Tunnel closed. Reconnecting in 3s...");
      isStarting = false;
      restart();
    });

    tunnel.on("error", (err) => {
      console.error("Tunnel error:", err.message);
      isStarting = false;
      restart();
    });
  } catch (err) {
    console.error("Failed to establish tunnel:", err.message);
    isStarting = false;
    restart();
  } finally {
    isStarting = false;
  }
}

setInterval(async () => {
  if (currentTunnel && currentTunnel.url) {
    try {
      await fetch(currentTunnel.url, { signal: AbortSignal.timeout(6000) });
      console.log("[Heartbeat] Tunnel active:", currentTunnel.url);
    } catch (e) {
      console.log("[Heartbeat] Ping failed:", e.message, "- Reconnecting...");
      restart();
    }
  } else {
    restart();
  }
}, 25000);

start();
