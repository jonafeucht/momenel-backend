import express from "express";
import { getSuggestedProfiles } from "../controllers/suggested_profiles.js";

const router = express.Router();

router.get("/", getSuggestedProfiles);

export default router;
