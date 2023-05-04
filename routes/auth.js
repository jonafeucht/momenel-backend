import express from "express";
import { doesEmailExist, signIn } from "../controllers/auth.js";

const router = express.Router();

router.get("/verify", doesEmailExist);
router.post("/signin", signIn);

export default router;
