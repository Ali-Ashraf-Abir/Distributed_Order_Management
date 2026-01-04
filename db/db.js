import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

// emulate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FORCE single DB location
const dbPath = path.join(__dirname, "..", "orders.db");

const db = new Database(dbPath);

db.prepare(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    amount INTEGER,
    status TEXT
  )
`).run();

// payments table (idempotency!)
db.prepare(`
  CREATE TABLE IF NOT EXISTS payments (
    order_id TEXT PRIMARY KEY
  )
`).run();
export default db;
