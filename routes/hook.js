import express from "express";
import { videoHook } from "../controllers/hook.js";

const router = express.Router();

router.post("/video", videoHook);

export default router;
