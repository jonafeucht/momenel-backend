import express from "express";
import { handleLike, getLikes } from "../controllers/likes.js";

const router = express.Router();

router.post("/:id", handleLike);
router.get("/:id", getLikes);

export default router;
