import express from "express";
import {
  getHomeFeed,
  getDiscoverFeed,
  getForYouFeed,
} from "../controllers/feed.js";

const router = express.Router();

router.get("/foryou/:from/:to", getForYouFeed);
router.get("/home/:from/:to", getHomeFeed);
router.get("/discover/:ids/:from/:to", getDiscoverFeed);

export default router;
