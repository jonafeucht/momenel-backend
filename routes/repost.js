import express from "express";
import {
  deleteRepost,
  getOneRepost,
  getReposts,
  handleRepost,
} from "../controllers/repost.js";

const router = express.Router();

router.get("/:id", getReposts);
router.post("/:id", handleRepost);
router.delete("/:id", deleteRepost);
router.get("/repost/:id", getOneRepost);

export default router;
