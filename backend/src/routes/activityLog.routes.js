import { Router } from "express";
import {
  getActivityLogs,
  getRecentActivities,
} from "../controllers/activityLog.controller.js";

const router = Router();

router.route("/").get(getActivityLogs);
router.route("/recent").get(getRecentActivities);

export default router;
