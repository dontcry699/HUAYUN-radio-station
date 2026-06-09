import { Router, type IRouter } from "express";
import healthRouter from "./health";
import songsRouter from "./songs";
import submissionsRouter from "./submissions";
import announcementsRouter from "./announcements";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(songsRouter);
router.use(submissionsRouter);
router.use(announcementsRouter);
router.use(statsRouter);

export default router;
