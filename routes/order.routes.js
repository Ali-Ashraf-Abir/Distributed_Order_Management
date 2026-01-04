import { Router } from "express";
import {createOrderController} from "../controllers/oreder.controller.js"
const router = Router();

router.post("/",createOrderController );

export default router;