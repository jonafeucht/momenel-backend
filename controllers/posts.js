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
  // return all the posts for the user user with comments
  const { data, error } = await supabase
    .from("post")
    .select(
      `*, comments:comment(id, text, user:profiles(id, name, username, profile_url), created_at), user:profiles(id, name, username, profile_url), likes:like(created_at, user:profiles(id, username, profile_url))`
    );
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
export { test, test2, getPosts, getOnePost, getUserPosts, deletePost };
