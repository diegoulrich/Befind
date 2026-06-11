import { Router, type IRouter } from "express";

import chatRouter from "./chat";
import healthRouter from "./health";
import quizRouter from "./quiz";
import shopRouter from "./shop";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(quizRouter);
router.use(chatRouter);
router.use(stripeRouter);
router.use(shopRouter);

export default router;
