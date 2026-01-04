import  db  from "../db/db.js"
import orderQueue from "../queues/order.queues.js"
import { v4 as uuidv4 } from "uuid";

export async function createOrder(orderData) {
    const orderId = uuidv4();
    const { userId, amount } = orderData;

  db.prepare(`
    INSERT INTO orders (id, user_id, amount, status)
    VALUES (?, ?, ?, ?)
  `).run(orderId, userId, amount, "PENDING");

    await orderQueue.add("order.created",
        {orderId},
        { attempts: 5,             
        backoff: {
            type: "exponential",     
            delay: 2000              
        }
    }
    )

    return { orderId }
}