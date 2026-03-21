import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import departmentsRouter from "./departments";
import hospitalsRouter from "./hospitals";
import doctorsRouter from "./doctors";
import appointmentsRouter from "./appointments";
import reviewsRouter from "./reviews";
import usersRouter from "./users";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(departmentsRouter);
router.use(hospitalsRouter);
router.use(doctorsRouter);
router.use(appointmentsRouter);
router.use(reviewsRouter);
router.use(usersRouter);
router.use(adminRouter);

export default router;
