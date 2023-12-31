import SendNotification from "../helpers/Notification.js";
import supabase from "../supabase/supabase.js";

// GET /comment/:id => get all comments for a post
const getComments2 = async (req, res) => {
  const { id: postId, from, to } = req.params;
  const { id: userId } = req.user;

  // get all comments for a post and sort by created_at
  const { data, error } = await supabase
    .from("comment")
    .select("*, user:profiles(id, username, profile_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .range(from, to)
    .limit(30);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  const { data: likesCount, error: error2 } = await supabase.rpc(
    "get_comment_likes",
    {
      commentid: data.map((comment) => comment.id),
    }
  );

  if (error2) return res.status(400).json({ error: error2.message });

  // map the likesCount and get the like_count. then add the like_count to the data after matching the id with comment_id
  req.user.id;
  data.forEach((comment) => {
    comment.likes = 0;
    likesCount.forEach((like) => {
      if (like.comment_id === comment.id) {
        comment.likes = like.like_count;
      }
    });
  });

  // get all comments that the user has liked from the comment_id
  const { data: likedComments, error: error3 } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .in(
      "comment_id",
      likesCount.map((like) => like.comment_id)
    )
    .eq("user_id", req.user.id);
  if (error3) return res.status(400).json({ error: error3.message });

  // map the likedComments and get the comment_id. then add the isLiked to the data after matching the id with comment_id
  data.forEach((comment) => {
    comment.isLiked = false;
    likedComments.forEach((like) => {
      if (like.comment_id === comment.id) {
        comment.isLiked = true;
      }
    });
  });

  let post = {};
  // if from is 0, then get the post details
  if (from === "0") {
    let { data, error } = await supabase
      .from("post")
      .select(
        `id,caption,user_id,created_at, user:profiles(name,username,profile_url), likes: like(count), comments: comment(count), reposts: repost(count), content(id,type,width,height,blurhash,format)`
      )
      .eq("id", postId)
      .order("created_at", { foreignTable: "content", ascending: true })
      .single();
    if (error) return res.status(500).json({ error: error.message });

    // get ids
    let { data: hook, error: hookerror } = await supabase.rpc(
      "check_likes_reposts",
      { user_id: userId, post_ids: [postId] }
    );
    if (hookerror) return res.status(500).json({ error: hookerror.message });
    data.isLiked = hook.liked.includes(parseInt(postId));
    data.isReposted = hook.reposted.includes(parseInt(postId));
    post = data;
  }

  return res.status(200).json({ post, comments: data });
};
const getComments = async (req, res) => {
  const { id: postId, from, to } = req.params;

  // get all comments for a post and sort by created_at
  const { data, error } = await supabase
    .from("comment")
    .select("*, user:profiles(id, username, profile_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .range(from, to)
    .limit(30);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  const { data: likesCount, error: error2 } = await supabase.rpc(
    "get_comment_likes",
    {
      commentid: data.map((comment) => comment.id),
    }
  );

  if (error2) return res.status(400).json({ error: error2.message });

  // map the likesCount and get the like_count. then add the like_count to the data after matching the id with comment_id
  req.user.id;
  data.forEach((comment) => {
    comment.likes = 0;
    likesCount.forEach((like) => {
      if (like.comment_id === comment.id) {
        comment.likes = like.like_count;
      }
    });
  });

  // get all comments that the user has liked from the comment_id
  const { data: likedComments, error: error3 } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .in(
      "comment_id",
      likesCount.map((like) => like.comment_id)
    )
    .eq("user_id", req.user.id);
  if (error3) return res.status(400).json({ error: error3.message });

  // map the likedComments and get the comment_id. then add the isLiked to the data after matching the id with comment_id
  data.forEach((comment) => {
    comment.isLiked = false;
    likedComments.forEach((like) => {
      if (like.comment_id === comment.id) {
        comment.isLiked = true;
      }
    });
  });

  return res.status(200).json(data);
};

// POST /comment/:id => create a new comment
const createComment = async (req, res) => {
  const { id: userId } = req.user;
  const { id: postId } = req.params;
  const { text } = req.body;

  // create the comment and return the comment with user data
  const { data, error } = await supabase
    .from("comment")
    .insert([{ post_id: postId, user_id: userId, text: text }])
    .select("*, user:profiles(id, username, profile_url),post(user_id)")
    .single();
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // send notification to the post owner
  if (userId !== data.post.user_id) {
    await supabase.from("notifications").insert([
      {
        sender_id: userId,
        receiver_id: data.post.user_id,
        type: "comment",
        comment_id: data.id,
      },
    ]);
    SendNotification({
      type: "post_comment",
      senderId: userId,
      receiverId: data.post.user_id,
      comment: text,
    });
  }

  res.status(201).json(data);

  // send notification if the user mentioned in the comment
  const mentionedUsers = text.match(/@\w+/g);
  //remove duplicate usernames
  const uniqueMentionedUsers = [...new Set(mentionedUsers)];

  if (uniqueMentionedUsers) {
    uniqueMentionedUsers.forEach(async (username) => {
      try {
        const { data: mentionedUser, error: error3 } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username.slice(1));

        if (error3) return Error(error3);

        if (mentionedUser) {
          if (
            mentionedUser[0].id === userId ||
            mentionedUser[0].id === data.post.user_id
          )
            return;
          await supabase.from("notifications").insert([
            {
              sender_id: userId,
              receiver_id: mentionedUser[0].id,
              type: "mentionComment",
              comment_id: data.id,
            },
          ]);
          SendNotification({
            type: "comment_mention",
            senderId: userId,
            receiverId: mentionedUser[0].id,
            comment: text,
          });
        }
      } catch (error) {
        return;
      }
    });
  }
};

// DELETE /comment/:id => delete a comment
const deleteComment = async (req, res) => {
  const { id: userId } = req.user;
  const { id: commentId } = req.params;

  // delete the comment
  const { error } = await supabase
    .from("comment")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId);
  if (error) {
    error;
    return res.status(400).json({ error: error.message });
  }

  res.status(204).send();
};

export { createComment, getComments, deleteComment, getComments2 };
