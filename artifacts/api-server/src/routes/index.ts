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
import symptomsRouter from "./symptoms";
import notificationsRouter from "./notifications";
import medicalRecordsRouter from "./medical-records";
import paymentsRouter from "./payments";

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
router.use(symptomsRouter);
router.use(notificationsRouter);
router.use(medicalRecordsRouter);
router.use(paymentsRouter);

export default router;
