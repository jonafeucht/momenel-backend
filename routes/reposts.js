import express from "express";
import { handleRepost } from "../controllers/reposts.js";

const router = express.Router();

router.post("/:id", handleRepost);

export default router;
