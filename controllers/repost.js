import supabase from "../supabase/supabase.js";

// GET /repost/:id (id of post)
const getReposts = async (req, res) => {
  const { id: postId } = req.params;
  const { id: userId } = req.user;

  // get all likes for this post with count sorted by created_at, also get user id, username, and profile pic for each like (join with profile table), also get if userId is following the user who liked the post
  const { data, error } = await supabase
    .from("repost")
    .select(
      `
    user: profiles(id,username, profile_url)
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  // console.log(error);
  if (error) return res.status(500).json({ error: "Something went wrong" });

  // get if user is following the user who liked the post
  const { data: doFollow, error: error2 } = await supabase
    .from("follower")
    .select("following_id")
    .eq("follower_id", userId)
    .in(
      "following_id",
      data.map(({ user }) => user.id)
    );

  if (error2) return res.status(500).json({ error: "Something went wrong" });

  // map the doFollow and get the following_id. then add the isFollowed to the notifications after matching the id with following_id
  data.forEach((user) => {
    user.isFollowed = false;
    doFollow.forEach((follow) => {
      if (follow.following_id === user.user.id) {
        user.isFollowed = true;
      }
    });
    if (user.user.id === userId) user.isFollowed = null;
  });

  res.send(data);
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

export { getReposts, handleRepost };
