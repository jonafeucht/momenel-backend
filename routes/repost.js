import express from "express";
import { getReposts, handleRepost } from "../controllers/repost.js";

const router = express.Router();

router.get("/:id", getReposts);
router.post("/:id", handleRepost);

export default router;
