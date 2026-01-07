import { v4 as uuidv4 } from "uuid";
import orderQueue from "../queues/order.queues.js";
import { orders } from "../db/db.js";
import { emitJobUpdate } from "../events/socket.js";

export async function createOrder(orderData) {
  const orderId = uuidv4();
  const { userId, amount } = orderData;

  await orders.insertOne({
    _id: orderId,
    userId,
    amount,
    status: "PENDING",
    createdAt: new Date(),
  });
    emitJobUpdate({
    id: orderId,
    status: "QUEUED",
  });

  await orderQueue.add(
    "order.created",
    { orderId },
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 2000 }
    }
  );

  return { orderId };
}
