import { Router, type IRouter } from "express";
import healthRouter from "./health";
import songsRouter from "./songs";
import submissionsRouter from "./submissions";
import announcementsRouter from "./announcements";
import statsRouter from "./stats";
import authRouter from "./auth";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(songsRouter);
router.use(submissionsRouter);
router.use(announcementsRouter);
router.use(statsRouter);

export default router;
