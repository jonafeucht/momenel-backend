import express from "express";
import { getProfileInitialData } from "../controllers/users.js";

const router = express.Router();

router.get("/intial", getProfileInitialData);

export default router;
