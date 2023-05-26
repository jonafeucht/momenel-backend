import express from "express";
import { getBlockedUsers, handleBlock } from "../controllers/blocked.js";

const router = express.Router();

router.get("/", getBlockedUsers);
router.post("/:id", handleBlock);

export default router;
