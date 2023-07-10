import express from "express";
import {
  getNotification,
  readAllNotifications,
} from "../controllers/notifications.js";

const router = express.Router();

router.get("/:from/:to", getNotification);
router.post("/read", readAllNotifications);

export default router;
