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
router.post("/like/:id", handleLike);
router.post("/repost/:id", handleRepost);
//todo: list of all likes for a post
router.get("/like/:id", getLikes);
//todo: list of all reposts for a post

//done: get single post data with id
//todo: get all comments for a post
//todo: post a new comment to a post
//todo: delete a comment
//todo: like a comment

export default router;
