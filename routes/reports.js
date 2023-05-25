import express, { Router } from "express";
import { getOptions, handleReport } from "../controllers/reports.js";

const router = express.Router();

router.get("/:type", getOptions);
router.post("/:item_id/:type/:report_id", handleReport);

export default router;
