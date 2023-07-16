import express from "express";
import { doesEmailExist, resetPassword } from "../controllers/auth.js";

const router = express.Router();

router.get("/verify", doesEmailExist);
router.post("/resetpassword/:password", resetPassword);

export default router;
