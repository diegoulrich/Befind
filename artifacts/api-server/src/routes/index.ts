import { Router, type IRouter } from "express";

import authRouter from "./auth";
import businessAgentRouter from "./businessAgent";
import chatRouter from "./chat";
import healthRouter from "./health";
import premiumToolsRouter from "./premiumTools";
import quizRouter from "./quiz";
import shopRouter from "./shop";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(quizRouter);
router.use(chatRouter);
router.use(businessAgentRouter);
router.use(premiumToolsRouter);
router.use(stripeRouter);
router.use(shopRouter);

export default router;
