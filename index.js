import express from "express";
import config from "./config.js";
import postsRouter from "./routes/posts.js";
import authRouter from "./routes/auth.js";
import userRouter from "./routes/user.js";
const app = express();

// Middleware
// ...

// Routes
app.use("/auth", authRouter);
app.use("/posts", postsRouter);
app.use("/user", userRouter);

// Error handling middleware
// ...

app.listen(3000, () => {
  console.log(`Server listening on port ${3000}`);
});
