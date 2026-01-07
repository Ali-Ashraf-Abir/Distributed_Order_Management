# Event‑Driven Async Job Queue System

This project is a **production‑style backend system** that demonstrates how modern platforms handle **asynchronous work**, **failures**, and **real‑time observability**.

It is intentionally designed as **infrastructure**, not a CRUD app.

---

## 🚀 What This System Does

* Accepts user‑initiated tasks via an API
* Processes tasks asynchronously using a queue
* Retries transient failures automatically
* Guarantees idempotent execution
* Emits real‑time lifecycle events via WebSockets
* Tracks worker health via heartbeats
* Shuts down gracefully without corrupting work
* Automatically cleans up old data

This mirrors how systems like payment processors, CI pipelines, and background job platforms work internally.

---

## 🧠 Core Architecture

```
Client
  ↓
API Server (Express)
  ↓
Redis Queue (BullMQ)
  ↓
Worker Processes
  ↓
MongoDB (Source of Truth)

Worker → API (internal HTTP) → WebSocket → Frontend
```

### Separation of Responsibilities

| Component     | Responsibility                                    |
| ------------- | ------------------------------------------------- |
| API Server    | Accept requests, manage sockets, broadcast events |
| Queue (Redis) | Buffer and schedule work                          |
| Workers       | Execute jobs, retry on failure                    |
| MongoDB       | Durable job state and idempotency                 |
| Frontend      | Real‑time observability only                      |

---

## 🔄 Job Lifecycle

Each job follows a strict state machine:

```
QUEUED → PROCESSING → PAID
              ↓
          RETRYING
              ↓
           FAILED
```

### State Definitions

* **QUEUED** – Job accepted and persisted
* **PROCESSING** – Worker has claimed the job
* **RETRYING** – Transient failure, retry scheduled
* **PAID** – Job completed successfully (terminal)
* **FAILED** – Retries exhausted (terminal)

Only **terminal states** are persisted permanently.

---

## ♻️ Retry Strategy

* Retries are handled by **BullMQ**
* Exponential backoff is used
* Retry attempts are bounded

### Important Rule

> A job is only marked as `FAILED` in the database **after all retries are exhausted**.

Transient failures:

* Emit `RETRYING` events
* Do **not** update DB status

Terminal failures:

* Update DB status to `FAILED`
* Emit final failure event

This prevents inconsistent state when a retry later succeeds.

---

## 🔐 Idempotency Guarantee

Idempotency is enforced **at the database level**.

* A dedicated `payments` collection has a **unique index** on `orderId`
* Duplicate execution attempts fail atomically
* Duplicate jobs are safely ignored

This guarantees **exactly‑once side effects** even with retries and worker crashes.

---

## 📡 Real‑Time Events (WebSockets)

The system emits domain events instead of polling.

### Job Events

```json
{
  "id": "order‑id",
  "status": "RETRYING",
  "attempt": 2,
  "maxAttempts": 5,
  "error": "Payment timeout",
  "timestamp": "..."
}
```

### Worker Events

```json
{
  "workerId": "worker‑123",
  "lastSeenAt": "..."
}
```

### Design Choice

Workers **never talk to WebSockets directly**.

Instead:

```
Worker → Internal HTTP → API → Socket.IO → Frontend
```

This keeps workers stateless and failure‑isolated.

---

## ❤️ Worker Heartbeats

Each worker emits a heartbeat every few seconds.

* Frontend derives `Alive / Dead` state
* No polling required
* Stale workers disappear automatically

This models real liveness detection used in distributed systems.

---

## 🛑 Graceful Shutdown

Workers listen for `SIGTERM` / `SIGINT`.

On shutdown:

1. Stop accepting new jobs
2. Finish in‑flight job
3. Stop heartbeats
4. Close DB connections
5. Exit cleanly

This prevents:

* Partial execution
* Corrupted state
* Duplicate side effects

---

## 🧹 Automatic Cleanup (Data Lifecycle)

### MongoDB (Tasks)

* Each task has a `createdAt` timestamp
* A **TTL index** automatically deletes tasks after 24 hours
* No cron jobs or manual cleanup required

### Redis (Queue)

* BullMQ is configured with:

  * `removeOnComplete`
  * `removeOnFail`
* Completed and failed jobs are removed after 24 hours

This prevents unbounded growth even if users spam the system.

---

## 🧪 Failure Scenarios Handled

* Worker crashes mid‑job
* Duplicate job execution
* External service failures
* Retry storms
* API restarts
* Socket disconnects
* Redis persistence failures

Each scenario was intentionally designed for and tested.

---

## 🛠 Tech Stack

* **Node.js / Express** – API server
* **BullMQ + Redis** – Async job queue
* **MongoDB** – Durable state + idempotency
* **Socket.IO** – Real‑time event streaming
* **Next.js** – Observability dashboard

---

## 🎯 Why This Project Exists

This project demonstrates:

* Event‑driven architecture
* Distributed system thinking
* Failure‑first design
* Operational hygiene
* Production‑grade patterns

It is intentionally **not** feature‑heavy.

The focus is **correctness, resilience, and clarity**.

---

## 🧠 Key Takeaway

> The frontend observes.
> The backend decides.
> Failures are expected.
> Cleanup is automatic.

---

## 📌 Future Improvements (Optional)

* Redis pub/sub for worker events
* DLQ visualization
* Event persistence & replay
* Rate limiting per user
* Multi‑worker scaling demo

---

If you are reviewing this project:

💡 Start a job → break a worker → watch the system recover.

That is the point.
