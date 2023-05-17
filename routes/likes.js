import express from "express";
import { handleLike, getLikes } from "../controllers/likes.js";

const router = express.Router();

router.post("/like/:id", handleLike);
router.get("/like/:id", getLikes);

export default router;
