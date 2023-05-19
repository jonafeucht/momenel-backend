import express from "express";
import { handleLikeComment } from "../controllers/commentLike.js";

const router = express.Router();

router.post("/:id", handleLikeComment);

export default router;
