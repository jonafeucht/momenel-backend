import supabase from "../supabase/supabase.js";

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

export { handleRepost };
