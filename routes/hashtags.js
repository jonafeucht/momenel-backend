import express from "express";
import { getHashtags, postHashtag } from "../controllers/hashtags.js";

const router = express.Router();

router.get("/", getHashtags);
router.post("/", postHashtag);

export default router;
