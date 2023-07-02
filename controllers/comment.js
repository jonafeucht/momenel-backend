import { log } from "console";
import supabase from "../supabase/supabase.js";

// GET /comment/:id => get all comments for a post
const getComments = async (req, res) => {
  const { id: postId } = req.params;

  // get all comments for a post and sort by created_at
  const { data, error } = await supabase
    .from("comment")
    .select("*, user:profiles(id, username, profile_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error) {
    console.log(error);
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
  console.log(req.user.id);
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
    console.log(error);
    return res.status(400).json({ error: error.message });
  }

  // send notification to the post owner
  if (userId !== data.post.user_id) {
    const { data: notification, error: error2 } = await supabase
      .from("notifications")
      .insert([
        {
          sender_id: userId,
          receiver_id: data.post.user_id,
          type: "comment",
          comment_id: data.id,
        },
      ]);
  }

  return res.status(201).json(data);
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
    console.log(error);
    return res.status(400).json({ error: error.message });
  }

  res.status(204).send();
};

export { createComment, getComments, deleteComment };
