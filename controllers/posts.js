import supabase from "../supabase/supabase.js";

// test function
const test = (req, res) => {
  res.json({ message: "Hello from the posts controller!" });
};
// GET /posts
const getPosts = async (req, res) => {
  const { data, error } = await supabase.from("post").select("*");
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
export { test, getPosts, deletePost };
