import SendNotification from "../helpers/Notification.js";
import supabase from "../supabase/supabase.js";

const videoHook = async (req, res) => {
  if (req.params.secret !== process.env.Secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  let { VideoGuid, Status } = req.body;
  // set video status to ready if status is 3 or 4 and error if status is 5
  if (Status == 3 || Status == 4) {
    // set post status to ready if all post videos are processed
    let { data, error } = await supabase
      .from("content")
      .update({ status: "published" })
      .select("post_id,post(user_id,caption)")
      .eq("id", VideoGuid)
      .single();

    // check if all content for post is ready
    const { data: content, error: contentError } = await supabase
      .from("content")
      .select("status")
      .eq("post_id", data.post_id);

    if (contentError) return;

    let isPublished = true;
    content.forEach((item) => {
      if (item.status !== "published") isPublished = false;
    });

    // if all the content is published then update the post status to published
    if (isPublished) {
      const { error: postError } = await supabase
        .from("post")
        .update({ published: true })
        .eq("id", data.post_id);
      if (postError) return;

      // send notification to post owner
      if (Status == 3) {
        await supabase.from("notifications").insert([
          {
            sender_id: data.post.user_id,
            receiver_id: data.post.user_id,
            type: "system",
            post_id: data.post_id,
            system_message: "post has been published",
          },
        ]);
        SendNotification({
          type: "post_published",
          senderId: data.post.user_id,
          receiverId: data.post.user_id,
        });

        // get mentioned users in caption
        let mentionedUsers = data.post.caption.match(/@\w+/g);
        mentionedUsers = [...new Set(mentionedUsers)];
        // get the ids of the mentioned users
        let { data: mentionedUsersData, error: mentionedUsersError } =
          await supabase
            .from("profiles")
            .select("id")
            .in(
              "username",
              mentionedUsers.map((user) => user.slice(1))
            );
        if (mentionedUsersError) return;

        // send notification to mentioned users
        mentionedUsersData.map(async (user) => {
          if (user.id === data.post.user_id) return;

          await supabase.from("notifications").insert([
            {
              sender_id: data.post.user_id,
              receiver_id: user.id,
              type: "mentionPost",
              post_id: data.post_id,
            },
          ]);
          SendNotification({
            type: "post_mention",
            senderId: data.post.user_id,
            receiverId: user.id,
          });
        });
      }
    }
  } else if (Status == 5) {
    const { data, error } = await supabase
      .from("content")
      .update({ status: "error" })
      .select("post_id")
      .eq("id", VideoGuid)
      .single();
    if (error) {
      return;
    }

    await supabase
      .from("post")
      .update({ published: null })
      .eq("id", data.post_id);
  }

  res.status(200).end(); // Responding is important
};

const trendingHashtagsHook = async (req, res) => {
  if (req.params.secret !== process.env.Secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { data, error } = await supabase.rpc("get_top_hashtags");

  if (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
  // delete all the hashtags from treding_hashtags and add the hashtag_id to the trending_hashtags table from data2
  const { data: data2, error: error2 } = await supabase
    .from("trending_hashtags")
    .delete()
    .neq("hashtag_id", 0);

  if (error2) {
    return res.status(500).json({ error: "Something went wrong" });
  }

  const { error: error3 } = await supabase
    .from("trending_hashtags")
    .insert(data.map((hashtag) => ({ hashtag_id: hashtag.hashtag_id })));

  if (error3) {
    return res.status(500).json({ error: "Something went wrong" });
  }

  res.send("ok");
};

export { videoHook, trendingHashtagsHook };
