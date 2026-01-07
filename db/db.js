import { MongoClient } from "mongodb";
import "dotenv/config";
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI missing");
}

const client = new MongoClient(uri);

export async function connectDB() {
  await client.connect();
  console.log("✅ MongoDB connected");
}

export const db = client.db(process.env.MONGODB_DB || "orders");
export const orders = db.collection("orders");
export const payments = db.collection("payments");

export default client;
