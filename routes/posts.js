import express from "express";
import {
  test,
  getPosts,
  deletePost,
  getOnePost,
  getUserPosts,
  test2,
  handleLike,
  handleRepost,
} from "../controllers/posts.js";

const router = express.Router();

router.get("/test", test);
router.get("/user", getUserPosts);
router.get("/test2", test2);
router.get("/", getPosts);
router.get("/:id", getOnePost);
router.delete("/:id", deletePost);
//todo: handle new post
router.post("/like/:id", handleLike);
router.post("/repost/:id", handleRepost);
//todo: list of all likes for a post
//todo: list of all reposts for a post

//todo: get single post data with id
//todo: get all comments for a post
//todo: post a new comment to a post
//todo: delete a comment
//todo: like a comment

export default router;
