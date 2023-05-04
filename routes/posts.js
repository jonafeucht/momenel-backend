import express from "express";
import {
  test,
  getPosts,
  deletePost,
  getOnePost,
  getUserPosts,
  test2,
} from "../controllers/posts.js";

const router = express.Router();

router.get("/test", test);
router.get("/user", getUserPosts);
router.get("/test2", test2);
router.get("/", getPosts);
router.get("/:id", getOnePost);
router.delete("/:id", deletePost);

export default router;
