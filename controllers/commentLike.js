import supabase from "../supabase/supabase.js";

const handleLikeComment = async (req, res) => {
  const { id: userId } = req.user;
  const { id: commentId } = req.params;

  // check if user has already liked this post and if so, remove like from like table. if not, add like to like table using postId and userId.
  const { data, error } = await supabase
    .from("comment_likes")
    .select("*")
    .eq("comment_id", commentId)
    .eq("user_id", userId);

  if (error) return res.status(500).json({ error: "Something went wrong" });
  if (data.length > 0) {
    // user has already liked this post, so remove like
    const { data, error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userId);
    if (error) return res.status(500).json({ error: "Something went wrong" });
    return res.status(204).send();
  } else {
    console.log("user has not liked this post");
    // user has not liked this post, so add like
    const { data, error } = await supabase
      .from("comment_likes")
      .insert([{ comment_id: commentId, user_id: userId }]);
    if (error) return res.status(500).json({ error: "Something went wrong" });
    return res.status(201).send();
  }
};

export { handleLikeComment };
