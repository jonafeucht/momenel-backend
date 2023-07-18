import express from "express";
import { trendingHashtagsHook, videoHook } from "../controllers/hook.js";

const router = express.Router();

router.post("/video/:secret", videoHook);
router.post("/trendingHashtags/:secret", trendingHashtagsHook);

export default router;
