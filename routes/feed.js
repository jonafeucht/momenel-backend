import express from "express";
import { getHomeFeed, getDiscoverFeed } from "../controllers/feed.js";

const router = express.Router();

router.get("/home/:from/:to", getHomeFeed);
router.get("/discover/:ids/:from/:to", getDiscoverFeed);

export default router;
