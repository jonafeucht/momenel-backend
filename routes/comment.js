import express from "express";
import {
  createComment,
  deleteComment,
  getComments,
} from "../controllers/comment.js";

const router = express.Router();

router.get("/:id/:from/:to", getComments);
router.post("/:id", createComment);
router.delete("/:id", deleteComment);

export default router;
