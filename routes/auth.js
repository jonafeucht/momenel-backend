import express from "express";
import { doesEmailExist, resetPassword, signIn } from "../controllers/auth.js";

const router = express.Router();

router.get("/verify", doesEmailExist);
router.post("/signin", signIn);
router.post("/resetpassword/:password", resetPassword);

export default router;
