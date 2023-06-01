import express from "express";
import {
  getFollowers,
  getFollowing,
  handleFollow,
} from "../controllers/follower.js";

const router = express.Router();

router.get("/followers/:id", getFollowers);
router.get("/following", getFollowing);
router.post("/:id", handleFollow);

export default router;
