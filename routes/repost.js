import express from "express";
import {
  deleteRepost,
  getReposts,
  handleRepost,
} from "../controllers/repost.js";

const router = express.Router();

router.get("/:id", getReposts);
router.post("/:id", handleRepost);
router.delete("/:id", deleteRepost);

export default router;
