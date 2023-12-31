import express from "express";
import helmet from "helmet";
import compression from "compression";
import postsRouter from "./routes/posts.js";
import hookRouter from "./routes/hook.js";
import commentRouter from "./routes/comment.js";
import authRouter from "./routes/auth.js";
import suggestedProfilesRouter from "./routes/suggested_profiles.js";
import userRouter from "./routes/user.js";
import feedRouter from "./routes/feed.js";
import searchRouter from "./routes/search.js";
import reportRouter from "./routes/reports.js";
import notificationsRouter from "./routes/notifications.js";
import likeRouter from "./routes/likes.js";
import commentLikeRouter from "./routes/commentsLike.js";
import repostRouter from "./routes/repost.js";
import followerRouter from "./routes/follower.js";
import BlockRouter from "./routes/blocked.js";
import bodyParser from "body-parser";
import verify from "./middleware/auth.js";
import hashtagRouter from "./routes/hashtags.js";
import { startCronJobs } from "./helpers/cron/CronJobs.js";
const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/auth", authRouter);
app.use("/hook", hookRouter);
app.use(verify);

// Routes
app.use("/suggestedprofiles", suggestedProfilesRouter);
app.use("/user", userRouter);
app.use("/feed", feedRouter);
app.use("/search", searchRouter);
app.use("/posts", postsRouter);
app.use("/comment", commentRouter);
app.use("/followuser", followerRouter);
app.use("/blockuser", BlockRouter);
app.use("/notifications", notificationsRouter);
app.use("/report", reportRouter);
app.use("/like", likeRouter);
app.use("/likeComment", commentLikeRouter);
app.use("/repost", repostRouter);
app.use("/hashtag", hashtagRouter);

// Start the cron jobs
startCronJobs();

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Momenel listening on port ${port}`);
});
