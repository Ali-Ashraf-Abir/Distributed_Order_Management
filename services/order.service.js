import {orders} from "../db/db.js"
import orderQueue from "../queues/order.queues.js"
import { v4 as uuidv4 } from "uuid";

export async function createOrder(orderData) {
    const orderId = uuidv4();
    const { userId, amount } = orderData;
    orders.set(orderId, {
        orderId,
        userId,
        amount,
        status: "PENDING"
    })

    await orderQueue.add("order.created", {
        orderId
    })

    return { orderId }
}