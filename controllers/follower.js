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
    const { data, error } = await supabase
      .from("follower")
      .delete()
      .eq("follower_id", user_id)
      .eq("following_id", following_id)
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).send();
  }

  // if user is not following the follower_id
  // follow the user
  const { data: data2, error: error2 } = await supabase
    .from("follower")
    .insert([{ follower_id: user_id, following_id: following_id }]);
  if (error2) return res.status(500).json({ error: error2.message });

  return res.status(201).send();
};

export { handleFollow };
