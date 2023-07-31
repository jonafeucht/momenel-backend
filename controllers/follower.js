import supabase from "../supabase/supabase.js";

// handle user follow and unfollow
const handleFollow = async (req, res) => {
  const { id: user_id } = req.user;
  const { id: following_id } = req.params;

  // check if user_id is already following follower_id
  const { data, error } = await supabase
    .from("follower")
    .select("*")
    .eq("follower_id", user_id)
    .eq("following_id", following_id)
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });

  // if user is already following the follower_id
  if (data.length > 0) {
    // unfollow the user
    const { error } = await supabase
      .from("follower")
      .delete()
      .eq("follower_id", user_id)
      .eq("following_id", following_id)
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // remove the follow notification
    await supabase
      .from("notifications")
      .delete()
      .eq("sender_id", user_id)
      .eq("receiver_id", following_id)
      .eq("type", "follow");

    return res.status(204).send();
  }

  // if user is not following the follower_id
  // follow the user
  const { error: error2 } = await supabase
    .from("follower")
    .insert([{ follower_id: user_id, following_id: following_id }]);
  if (error2) return res.status(500).json({ error: error2.message });

  // send the follow notification
  if (user_id !== following_id) {
    await supabase.from("notifications").insert([
      {
        sender_id: user_id,
        receiver_id: following_id,
        type: "follow",
        isRead: false,
      },
    ]);
  }
  return res.status(201).send();
};

// GET followers of a user
const getFollowers = async (req, res) => {
  const { id: userId } = req.params;

  // get all the followers of the user
  let { data, error } = await supabase
    .from("follower")
    .select("user:profiles!follower_follower_id_fkey(id,username, profile_url)")
    .eq("following_id", userId)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  // get if user is following the user who liked the post
  const { data: doFollow, error: error2 } = await supabase
    .from("follower")
    .select("following_id")
    .eq("follower_id", req.user.id)
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

// GET followers of a user
const getFollowing = async (req, res) => {
  const { id: userId } = req.user;

  // get all the followers of the user
  let { data, error } = await supabase
    .from("follower")
    .select(
      "user:profiles!follower_following_id_fkey(id,username, profile_url)"
    )
    .eq("follower_id", userId)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // map the doFollow and get the following_id. then add the isFollowed to the notifications after matching the id with following_id
  data.forEach((user) => {
    user.isFollowed = true;
    if (user.user.id === userId) user.isFollowed = null;
  });

  res.send(data);
};

export { handleFollow, getFollowers, getFollowing };
