import express from "express";
import { getLikes, handleLike } from "../controllers/like.js";

const router = express.Router();

router.post("/post/:id", handleLike);
router.get("/post/:id", getLikes);

export default router;
