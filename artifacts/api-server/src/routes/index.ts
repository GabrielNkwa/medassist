import { Router, type IRouter } from "express";
import healthRouter from "./health";
import radiologyRouter from "./radiology";
import symptomsRouter from "./symptoms";
import dosageRouter from "./dosage";
import dashboardRouter from "./dashboard";
import openaiChatRouter from "./openai-chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(radiologyRouter);
router.use(symptomsRouter);
router.use(dosageRouter);
router.use(dashboardRouter);
router.use(openaiChatRouter);

export default router;
