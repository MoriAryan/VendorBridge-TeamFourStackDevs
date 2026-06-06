import { Router } from "express";
import { getActivityLogs, getGroupedActivityLogs, getRecentActivities } from "../controllers/activityLog.controller.js";

const router = Router();

router.route("/").get(getActivityLogs);
router.route("/grouped").get(getGroupedActivityLogs);
router.route("/recent").get(getRecentActivities);

export default router;
