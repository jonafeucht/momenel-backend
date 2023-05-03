import express from "express";
import { doesEmailExist } from "../controllers/auth.js";

const router = express.Router();

router.get("/verify", doesEmailExist);

export default router;
