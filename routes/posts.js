import express from "express";
import {
  getPosts,
  deletePost,
  getOnePost,
  getUserPosts,
} from "../controllers/posts.js";

const router = express.Router();

router.get("/user", getUserPosts);
router.get("/", getPosts);
router.get("/:id", getOnePost);
router.delete("/:id", deletePost);
//todo: handle new post
//todo: list of all likes for a post
//todo: list of all reposts for a post
//todo: get all comments for a post
//todo: post a new comment to a post
//todo: delete a comment
//todo: like a comment

export default router;
