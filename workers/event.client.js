// workers/event.client.js
const API_BASE = process.env.API_BASE || "http://localhost:3000";

export async function emitJobEvent(payload) {
  try {
    await fetch(`${API_BASE}/internal/job-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Never crash worker because UI failed
    console.error("⚠️ Failed to emit job event:", err.message);
  }
}

export async function emitWorkerHeartbeat(payload) {
  try {
    await fetch(`${API_BASE}/internal/worker-heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("⚠️ Failed to emit heartbeat:", err.message);
  }
}
