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

    // remove like notification
    const { data: noti, error: e4 } = await supabase
      .from("notifications")
      .delete()
      .eq("sender_id", userId)
      .eq("comment_id", commentId)
      .eq("type", "comment_like");

    return res.status(204).send();
  } else {
    // user has not liked this post, so add like
    const { data, error } = await supabase
      .from("comment_likes")
      .insert([{ comment_id: commentId, user_id: userId }])
      .select("comment(post(user_id))")
      .single();
    if (error) return res.status(500).json({ error: "Something went wrong" });
    // send like notification
    if (data.comment.post.user_id !== userId) {
      const { data: data3, error: error3 } = await supabase
        .from("notifications")
        .insert([
          {
            sender_id: userId,
            receiver_id: data.comment.post.user_id,
            type: "comment_like",
            isRead: false,
            comment_id: commentId,
          },
        ]);
    }

    return res.status(201).send();
  }
};

export { handleLikeComment };
