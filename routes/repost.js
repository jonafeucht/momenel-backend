import express from "express";
import { handleRepost } from "../controllers/repost.js";

const router = express.Router();

router.post("/:id", handleRepost);

export default router;
