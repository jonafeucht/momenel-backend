import express from "express";
import { test, getPosts, deletePost } from "../controllers/posts.js";

const router = express.Router();

router.get("/test", test);
router.get("/", getPosts);
router.delete("/:id", deletePost);

export default router;
