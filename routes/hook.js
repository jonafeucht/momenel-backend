import express from "express";
import { trendingHashtagsHook, videoHook } from "../controllers/hook.js";

const router = express.Router();

router.post("/video", videoHook);
router.post("/trendingHashtags", trendingHashtagsHook);

export default router;
