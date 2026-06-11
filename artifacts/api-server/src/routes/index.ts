import { Router, type IRouter } from "express";
import healthRouter from "./health";
import quizRouter from "./quiz";
import chatRouter from "./chat";
import stripeRouter from "./stripe";
import shopRouter from "./shop";

const router: IRouter = Router();

router.use(healthRouter);
router.use(quizRouter);
router.use(chatRouter);
router.use(stripeRouter);
router.use(shopRouter);

export default router;
