import express from "express";
import postsRouter from "./routes/posts.js";
import authRouter from "./routes/auth.js";
import userRouter from "./routes/user.js";
import bodyParser from "body-parser";
import verify from "./middleware/auth.js";
const app = express();

// Middleware
// ...
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(verify);

// Routes
app.use("/auth", authRouter);
app.use("/posts", postsRouter);
app.use("/user", userRouter);

// Error handling middleware
// ...

app.listen(3000, () => {
  console.log(`Server listening on port ${3000}`);
});
