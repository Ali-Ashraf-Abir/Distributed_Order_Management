import {createOrder} from "../services/order.service.js"

export async function createOrderController (req, res) {
  // Logic to create a new order
  const orderData = req.body
  const order = await createOrder(orderData)


  res.status(201).send({ message: "Order created",orderId: order.orderId });
}