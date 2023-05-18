import supabase from "../supabase/supabase.js";

// GET /comment/:id => get all comments for a post
const getComments = async (req, res) => {
  const { id: postId } = req.params;

  // get all comments for a post and sort by created_at
  const { data, error } = await supabase
    .from("comment")
    .select("*, user:profiles(id, username, profile_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
  return res.status(200).json(data);
};

// POST /comment/:id => create a new comment
const createComment = async (req, res) => {
  const { id: userId } = req.user;
  const { id: postId } = req.params;
  const { text } = req.body;

  // create the comment and return the comment with user data
  const { data, error } = await supabase
    .from("comment")
    .insert([{ post_id: postId, user_id: userId, text: text }])
    .select("*, user:profiles(id, username, profile_url)")
    .single();
  if (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }
  return res.status(201).json(data);
};

// DELETE /comment/:id => delete a comment
const deleteComment = async (req, res) => {
  const { id: userId } = req.user;
  const { id: commentId } = req.params;

  // delete the comment
  const { error } = await supabase
    .from("comment")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId);
  if (error) {
    console.log(error);
    return res.status(400).json({ error: error.message });
  }

  res.status(204).send();
};

export { createComment, getComments, deleteComment };
