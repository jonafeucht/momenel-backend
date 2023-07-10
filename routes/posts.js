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
const upload = multer({
  limits: {
    fieldNameSize: (req, file, cb) => {
      if (file.mimetype.startsWith("image")) {
        cb(null, 10 * 1000000); // 10 MB for image files
      } else if (file.mimetype.startsWith("video")) {
        cb(null, 50 * 1000000); // 50 MB for video files
      } else {
        cb(null, 5 * 1000000); // 5 MB for other file types
      }
    },
  },
}); //multer options

router.get("/user", getUserPosts);
router.get("/", getPosts);
router.get("/:id", getOnePost);
router.post(
  "/",
  (req, res, next) => {
    upload.array("content")(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred during file upload

        // Handle the error and send an appropriate response
        return res.status(400).json({
          error:
            err.code === "LIMIT_FILE_SIZE"
              ? "One of the media exceeds the size limit"
              : err.code === "LIMIT_FILE_COUNT"
              ? "You can upload a maximum of 10 media files at a time"
              : "Something went wrong with the media upload",
        });
      } else if (err) {
        // An unknown error occurred

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

export default router;
