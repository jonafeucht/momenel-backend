import express from "express";
import {
  getHashtags,
  postHashtag,
  followHashtag,
} from "../controllers/hashtags.js";

const router = express.Router();

router.get("/", getHashtags);
router.post("/", postHashtag);
router.post("/follow", followHashtag);

export default router;
