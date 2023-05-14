import { log } from "console";
import supabase from "../supabase/supabase.js";

// test function
const test = (req, res) => {
  res.json({ message: "Hello from the posts controller!" });
};

// create a second test
const test2 = (req, res) => {
  res.json({ message: "Hello from the second test!" });
};

const getUserPosts = async (req, res) => {
  console.log(req.user.id);

  const { data, error } = await supabase
    .from("post")
    .select("*")
    .eq("user_id", req.user.id);
  res.json(data);
};
// GET /posts
const getPosts = async (req, res) => {
  const { data, error } = await supabase.from("post").select("*");
  if (error) return res.status(500).json({ error: error.message });
  console.log(data);
  res.json(data);
};

// GET /posts/:id
const getOnePost = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from("post").select("*").eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// POST /posts/like/:id (id of post)
const handleLike = async (req, res) => {
  const { id: userId } = req.user;
  const { id: postId } = req.params;

  // check if user has already liked this post and if so, remove like from like table. if not, add like to like table using postId and userId.
  const { data, error } = await supabase
    .from("like")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId);

  if (error) return res.status(500).json({ error: "Something went wrong" });
  if (data.length > 0) {
    // user has already liked this post, so remove like
    const { data, error } = await supabase
      .from("like")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) return res.status(500).json({ error: "Something went wrong" });
    return res.status(204).send();
  } else {
    console.log("user has not liked this post");
    // user has not liked this post, so add like
    const { data, error } = await supabase.from("like").insert([
      {
        post_id: postId,
        user_id: userId,
      },
    ]);
    if (error) return res.status(500).json({ error: "Something went wrong" });
    // get count of likes for this post
    const { count: likesCount, error: error2 } = await supabase
      .from("like")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    if (error2) return res.status(500).json({ error: "Something went wrong" });
    return res.json({ likes: likesCount });
  }
};

// GET /posts/likes/:id (id of post)
const getLikes = async (req, res) => {
  const { id: postId } = req.params;
  const { id: userId } = req.user;

  // get all likes for this post with count sorted by created_at, also get user id, username, and profile pic for each like (join with profile table), also get if userId is following the user who liked the post
  const { data, error } = await supabase
    .from("like")
    .select(
      `*,
    user: profiles(id, username, profile_url)
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  console.log(error);
  if (error) return res.status(500).json({ error: "Something went wrong" });

  return res.json({ data });
};

// POST /posts/repost/:id (id of post)
const handleRepost = async (req, res) => {
  const { id: userId } = req.user;
  const { id: postId } = req.params;

  // check if user has already reposted this post and if so, remove repost from repost table. if not, add repost to repost table using postId and userId.
  const { data, error } = await supabase
    .from("repost")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId);

  if (error) return res.status(500).json({ error: "Something went wrong" });
  if (data.length > 0) {
    // user has already reposted this post, so remove repost
    const { data, error } = await supabase
      .from("repost")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) return res.status(500).json({ error: "Something went wrong" });
    return res.status(204).send();
  } else {
    console.log("user has not reposted this post");
    // user has not reposted this post, so add repost
    const { data, error } = await supabase.from("repost").insert([
      {
        post_id: postId,
        user_id: userId,
      },
    ]);
    if (error) return res.status(500).json({ error: "Something went wrong" });
    // return success response
    return res.status(201).send();
  }
};

// POST /posts
// const createPost = async (req, res) => {
//   const { title, content } = req.body;
//   const { data, error } = await supabase
//     .from("posts")
//     .insert({ title, content });
//   if (error) return res.status(500).json({ error: error.message });
//   res.json(data);
// };

// PATCH /posts/:id
// const updatePost = async (req, res) => {
//   const { id } = req.params;
//   const { title, content } = req.body;
//   const { data, error } = await supabase
//     .from("posts")
//     .update({ title, content })
//     .eq("id", id);
//   if (error) return res.status(500).json({ error: error.message });
//   res.json(data);
// };

// DELETE /posts/:id
const deletePost = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from("posts").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// module.exports = { getPosts, createPost, updatePost, deletePost };
export {
  test,
  test2,
  getPosts,
  getOnePost,
  getUserPosts,
  deletePost,
  handleLike,
  getLikes,
  handleRepost,
};
