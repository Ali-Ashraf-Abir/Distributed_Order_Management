import { Queue } from "bullmq";
import IOredis from "ioredis";

const connection = new IOredis();

const orderQueue = new Queue("orderQueue", { connection });

export default orderQueue;
