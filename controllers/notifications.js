import supabase from "../supabase/supabase.js";

const getNotification = async (req, res) => {
  const { id: userId } = req.user;
  const { from, to } = req.params;
  // get all notifications for a user from the database

  let { data: notifications, error } = await supabase
    .from("notifications ")
    .select(
      "*, user:profiles!notifications_sender_id_fkey(id,username,profile_url),comment(id,post_id),post(id)"
    )
    .eq("receiver_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to)
    .limit(10);

  if (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }

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
