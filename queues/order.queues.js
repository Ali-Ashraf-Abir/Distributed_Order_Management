import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
  maxRetriesPerRequest: null
});


const orderQueue = new Queue("orderQueue", { connection });

export default orderQueue;
