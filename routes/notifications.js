import express from "express";
import {
  getNotification,
  readAllNotifications,
} from "../controllers/notifications.js";

const router = express.Router();

router.get("/:from/:to", getNotification);
router.post("/read", readAllNotifications);

//todo: send notification to a user

export default router;
