import express from "express";
import {
  createComment,
  deleteComment,
  getComments,
  getComments2,
} from "../controllers/comment.js";

const router = express.Router();

router.get("/:id/:from/:to", getComments);
router.get("/v2/:id/:from/:to", getComments2);
router.post("/:id", createComment);
router.delete("/:id", deleteComment);

export default router;
