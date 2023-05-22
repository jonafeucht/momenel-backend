import supabase from "../supabase/supabase.js";

const getNotification = async (req, res) => {
  const { id: userId } = req.user;
  const { from, to } = req.params;
  // get all notifications for a user from the database

  let { data: notifications, error } = await supabase
    .from("notifications ")
    .select(
      "*, user:profiles!notifications_sender_id_fkey(id,username,profile_url),post(id)"
    )
    .eq("receiver_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }

  const { data: doFollow, error: error2 } = await supabase
    .from("follower")
    .select("following_id")
    .eq("follower_id", req.user.id)
    .in(
      "following_id",
      notifications.map((follow) => follow.user.id)
    );

  if (error2) {
    console.log(error2);
    return res.status(500).json({ error: "Something went wrong" });
  }

  // map the doFollow and get the following_id. then add the isFollowed to the notifications after matching the id with following_id
  notifications.forEach((notification) => {
    notification.isFollowed = false;
    doFollow.forEach((follow) => {
      if (follow.following_id === notification.user.id) {
        notification.isFollowed = true;
      }
    });
  });

  res.json({ notifications });
};

const readAllNotifications = async (req, res) => {
  const { id: userId } = req.user;
  console.log("read all notifications called");
  // set all notifications for a user as read in the database
  const { error } = await supabase
    .from("notifications")
    .update({ isRead: true })
    .eq("receiver_id", userId);

  if (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }

  res.send();
};

export { getNotification, readAllNotifications };
