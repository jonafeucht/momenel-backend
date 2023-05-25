import express from "express";
import postsRouter from "./routes/posts.js";
import commentRouter from "./routes/comment.js";
import authRouter from "./routes/auth.js";
import userRouter from "./routes/user.js";
import feedRouter from "./routes/feed.js";
import searchRouter from "./routes/search.js";
import reportRouter from "./routes/reports.js";
import notificationsRouter from "./routes/notifications.js";
import likeRouter from "./routes/likes.js";
import commentLikeRouter from "./routes/commentsLike.js";
import repostRouter from "./routes/repost.js";
import followerRouter from "./routes/follower.js";
import bodyParser from "body-parser";
import verify from "./middleware/auth.js";
import hashtagRouter from "./routes/hashtags.js";

const app = express();

// Middleware
// ...
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/auth", authRouter);
app.use(verify);

// Routes
app.use("/feed", feedRouter);
app.use("/search", searchRouter);
app.use("/posts", postsRouter);
app.use("/comment", commentRouter);
app.use("/user", userRouter);
app.use("/followuser", followerRouter);
app.use("/notifications", notificationsRouter);
app.use("/report", reportRouter);
app.use("/like", likeRouter);
app.use("/likeComment", commentLikeRouter);
app.use("/repost", repostRouter);
app.use("/hashtag", hashtagRouter);

// Error handling middleware
// ...

app.listen(3000, () => {
  console.log(`Server listening on port ${3000}`);
});
