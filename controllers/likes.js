import supabase from "../supabase/supabase.js";

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

export { handleLike, getLikes };
