import supabase from "../supabase/supabase.js";

const getBlockedUsers = async (req, res) => {
  const { id: userId } = req.user;

  let { data, error } = await supabase
    .from("blocked")
    .select(
      "id,blocked_id, profile:profiles!blocked_blocked_id_fkey(username, profile_url)"
    )
    .eq("user_id", userId);

  console.log(error);
  if (error) return res.status(500).json({ error: error.message });

  // add isBlocked to true for each data
  data.forEach((user) => {
    user.isBlocked = true;
  });

  res.json(data);
};

const handleBlock = async (req, res) => {
  const { id: userId } = req.user;
  const { id: blocked_id } = req.params;

  // check if the user is trying to block himself
  if (userId === blocked_id) {
    return res.status(400).json({ error: "You cannot block yourself" });
  }

  // check if userId has already blocked blocked_id
  const { data, error } = await supabase
    .from("blocked")
    .select("*")
    .eq("user_id", userId)
    .eq("blocked_id", blocked_id)
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });

  // if user is already following the follower_id
  if (data.length > 0) {
    // unfollow the user
    const { data, error } = await supabase
      .from("blocked")
      .delete()
      .eq("user_id", userId)
      .eq("blocked_id", blocked_id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).send();
  } else {
    const { data: data2, error: error2 } = await supabase
      .from("blocked")
      .insert([{ user_id: userId, blocked_id: blocked_id }]);

    if (error2) return res.status(500).json({ error: error2.message });

    return res.status(201).send();
  }
};

export { getBlockedUsers, handleBlock };
