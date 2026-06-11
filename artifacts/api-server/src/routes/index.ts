import { Router, type IRouter } from "express";
import healthRouter from "./health";
import songsRouter from "./songs";
import submissionsRouter from "./submissions";
import announcementsRouter from "./announcements";
import statsRouter from "./stats";
import authRouter from "./auth";
import usersRouter from "./users";
import configRouter from "./config";
import eventsRouter from "./events";
import feedbackRouter from "./feedback";
import analyticsRouter from "./analytics";
import exportRouter from "./export";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(configRouter);
router.use(eventsRouter);
router.use(feedbackRouter);
router.use(analyticsRouter);
router.use(exportRouter);
router.use(songsRouter);
router.use(submissionsRouter);
router.use(announcementsRouter);
router.use(statsRouter);

export default router;
