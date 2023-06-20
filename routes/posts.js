import express from "express";
import {
  getPosts,
  deletePost,
  getOnePost,
  getUserPosts,
  createPost,
  updatePost,
  getPostsByHashtag,
} from "../controllers/posts.js";
import multer from "multer";

const router = express.Router();
// const upload = multer({
//   limits: {
//     fieldNameSize: (req, file, cb) => {
//       if (file.mimetype.startsWith("image/")) {
//         console.log("here");
//         cb(null, 10 * 1000000); // 10 MB for image files
//       } else if (file.mimetype.startsWith("video/")) {
//         cb(null, 50 * 1000000); // 50 MB for video files
//       } else {
//         cb(null, 5 * 1000000); // 5 MB for other file types
//       }
//     },
//   },
// }); //multer options
const upload = multer({
  limits: {
    fieldSize: 500 * 1000000,
    files: 10,
  },
}); //multer options

router.get("/user", getUserPosts);
router.get("/", getPosts);
router.get("/:id", getOnePost);
// router.post("/", upload.array("content"), createPost);
router.post(
  "/",
  (req, res, next) => {
    upload.array("content")(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred during file upload
        console.log("Multer Error:", err.code);
        // Handle the error and send an appropriate response
        return res.status(400).json({
          error:
            err.code === "LIMIT_FILE_SIZE"
              ? "One of the media exceeds the size limit"
              : "Something went wrong with the media upload",
        });
      } else if (err) {
        // An unknown error occurred
        console.log("Unknown Error:", err);
        // Handle the error and send an appropriate response
        return res.status(500).json({ error: "Internal server error" });
      }

      // If there are no errors, continue to the next middleware or route handler
      next();
    });
  },
  createPost
);
router.patch("/:id", updatePost);
router.delete("/:id", deletePost);
router.get("/hashtag/:hashtag", getPostsByHashtag);
//todo: handle new posts
//todo: list of all likes for a post
//todo: list of all reposts for a post
//todo: get user liked posts

//done: get single post data with id
//todo: get all comments for a post
//todo: post a new comment to a post
//todo: delete a comment
//todo: like a comment

export default router;
