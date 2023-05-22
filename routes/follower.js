import express from "express";
import { handleFollow } from "../controllers/follower.js";

const router = express.Router();

router.post("/:id", handleFollow);

export default router;
