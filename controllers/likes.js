import SendNotification from "../helpers/Notification.js";
import supabase from "../supabase/supabase.js";

// POST /posts/like/:id (id of post)
const handleLike = async (req, res) => {
  const { id: userId } = req.user;
  const { id: postId } = req.params;

  // check if user has already liked this post and if so, remove like from like table. if not, add like to like table using postId and userId.
  const { data, error } = await supabase
    .from("like")
    .select("*,post(user_id)")
    .eq("post_id", postId)
    .eq("user_id", userId);

  if (error) return res.status(500).json({ error: "Something went wrong" });
  if (data.length > 0) {
    // user has already liked this post, so remove like
    const { error } = await supabase
      .from("like")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) return res.status(500).json({ error: "Something went wrong" });
    res.status(204).send();

    //remove like notification
    try {
      await supabase
        .from("notifications")
        .delete()
        .eq("sender_id", userId)
        .eq("receiver_id", data[0].post.user_id)
        .eq("type", "post_like");
    } catch (error) {
      return;
    }
  } else {
    // user has not liked this post, so add like
    const { data: p, error } = await supabase
      .from("like")
      .insert([
        {
          post_id: postId,
          user_id: userId,
        },
      ])
      .select("post(user_id)")
      .single();
    if (error) return res.status(500).json({ error: "Something went wrong" });
    // get count of likes for this post
    const { count: likesCount, error: error2 } = await supabase
      .from("like")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    if (error2) return res.status(500).json({ error: "Something went wrong" });
    res.json({ likes: likesCount });

    try {
      // send like notification

      if (p.post.user_id === userId) return;
      await supabase.from("notifications").insert([
        {
          sender_id: userId,
          receiver_id: p.post.user_id,
          post_id: postId,
          type: "post_like",
          isRead: false,
        },
      ]);
      // send push notification
      SendNotification({
        type: "post_like",
        senderId: userId,
        receiverId: p.post.user_id,
      });
      return;
    } catch (error) {
      return;
    }
  }
};

// GET /likes/:id (id of post)
const getLikes = async (req, res) => {
  const { id: postId } = req.params;
  const { id: userId } = req.user;

  // get all likes for this post with count sorted by created_at, also get user id, username, and profile pic for each like (join with profile table), also get if userId is following the user who liked the post
  const { data, error } = await supabase
    .from("like")
    .select(
      `
    user: profiles(id,username, profile_url)
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

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

  res.json(data);
};

export { handleLike, getLikes };
