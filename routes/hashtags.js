import express from "express";
import {
  getHashtags,
  postHashtag,
  followHashtag,
  getPostsByHashtag,
} from "../controllers/hashtags.js";

const router = express.Router();

router.get("/", getHashtags);
router.get("/:id/:from/:to", getPostsByHashtag);
router.post("/", postHashtag);
router.post("/follow/:id", followHashtag);

export default router;
