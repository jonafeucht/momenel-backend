import express from "express";
import {
  getPosts,
  deletePost,
  getOnePost,
  getUserPosts,
  createPost,
  updatePost,
} from "../controllers/posts.js";
import multer from "multer";

const router = express.Router();
const upload = multer(); //multer options

router.get("/user", getUserPosts);
router.get("/", getPosts);
router.get("/:id", getOnePost);
router.post("/", upload.array("content"), createPost);
router.patch("/:id", updatePost);
router.delete("/:id", deletePost);
//todo: handle new posts
//todo: list of all likes for a post
//todo: list of all reposts for a post

//done: get single post data with id
//todo: get all comments for a post
//todo: post a new comment to a post
//todo: delete a comment
//todo: like a comment

export default router;
