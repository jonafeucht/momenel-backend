// import { log } from "console";
import supabase from "../supabase/supabase.js";

// this will get all the posts by the user
const getUserPosts = async (req, res) => {
  const { data, error } = await supabase
    .from("post")
    .select(
      `*, likes: like(user_id), comments: comment(user_id), reposts: repost(user_id), content(*)`
    )
    .eq("user_id", req.user.id);

  if (error) return res.status(500).json({ error: error.message });

  data.forEach((post) => {
    post.isLiked = false;
    post.isReposted = false;

    // check if the user has liked the post
    post.likes.forEach((like) => {
      if (like.user_id === req.user.id) {
        post.isLiked = true;
      }
    });

    // check if the user has reposted the post
    post.reposts.forEach((repost) => {
      if (repost.user_id === req.user.id) {
        post.isReposted = true;
      }
    });

    post.likes = post.likes.length;
    post.comments = post.comments.length;
    post.reposts = post.reposts.length;
  });
  res.json(data);
};

// this will be turned to the feed
// GET /posts
const getPosts = async (req, res) => {
  // return all the posts for the user user with comments
  const { data, error } = await supabase
    .from("post")
    .select(
      `*, user:profiles(id, name, username, profile_url), likes: like(user_id), comments: comment(user_id), reposts: repost(user_id), content(*)`
    );

  if (error) return res.status(500).json({ error: error.message });

  // check if each post of the data is liked by the user
  data.forEach((post) => {
    post.isLiked = false;
    post.isReposted = false;

    // check if the user has liked the post
    post.likes.forEach((like) => {
      if (like.user_id === req.user.id) {
        post.isLiked = true;
      }
    });

    // check if the user has reposted the post
    post.reposts.forEach((repost) => {
      if (repost.user_id === req.user.id) {
        post.isReposted = true;
      }
    });

    post.likes = post.likes.length;
    post.comments = post.comments.length;
    post.reposts = post.reposts.length;
  });

  // console.log(data);
  res.json(data);
};

// GET /posts/:id
const getOnePost = async (req, res) => {
  const { id } = req.params;
  let { data, error } = await supabase
    .from("post")
    .select(
      `*, user:profiles(id, name, username, profile_url), likes: like(user_id), comments: comment(user_id), reposts: repost(user_id), content(*)`
    )
    .eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  // console.log(data[0]);

  // count the likes comments and resposts of the data
  data[0].isLiked = false;
  data[0].isReposted = false;

  // check if the user has liked the post
  data[0].likes.forEach((like) => {
    if (like.user_id === req.user.id) {
      data[0].isLiked = true;
    }
  });

  // check if the user has reposted the post
  data[0].reposts.forEach((repost) => {
    if (repost.user_id === req.user.id) {
      data[0].isReposted = true;
    }
  });

  data[0].likes = data[0].likes.length;
  data[0].comments = data[0].comments.length;
  data[0].reposts = data[0].reposts.length;

  res.json(data);
};

// POST /posts
const createPost = async (req, res) => {
  // get the caption from the body
  const { caption } = req.body;
  const { id: userId } = req.user;
  // create the post
  console.log({ userId, caption });
  const { data, error } = await supabase
    .from("post")
    .insert([
      {
        user_id: userId,
        caption,
      },
    ])
    .select(
      `*, user:profiles(id, name, username, profile_url), likes: like(user_id), comments: comment(user_id), reposts: repost(user_id), content(*)`
    );
  if (error) return res.status(500).json({ error: error.message });

  // console.log(data[0]);

  // count the likes comments and resposts of the data
  data[0].isLiked = false;
  data[0].isReposted = false;

  // check if the user has liked the post
  data[0].likes.forEach((like) => {
    if (like.user_id === req.user.id) {
      data[0].isLiked = true;
    }
  });

  // check if the user has reposted the post
  data[0].reposts.forEach((repost) => {
    if (repost.user_id === req.user.id) {
      data[0].isReposted = true;
    }
  });

  data[0].likes = data[0].likes.length;
  data[0].comments = data[0].comments.length;
  data[0].reposts = data[0].reposts.length;

  res.json(data);
};

// PATCH /posts/:id
const updatePost = async (req, res) => {
  const { id } = req.params;
  const { caption } = req.body;

  console.log({ id, caption });
  const { data, error } = await supabase
    .from("post")
    .update({ caption })
    .match({ id: id })
    .select(
      `*, user:profiles(id, name, username, profile_url), likes: like(user_id), comments: comment(user_id), reposts: repost(user_id), content(*)`
    )
    .eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  // console.log(data[0]);

  // count the likes comments and resposts of the data
  data[0].isLiked = false;
  data[0].isReposted = false;

  // check if the user has liked the post
  data[0].likes.forEach((like) => {
    if (like.user_id === req.user.id) {
      data[0].isLiked = true;
    }
  });

  // check if the user has reposted the post
  data[0].reposts.forEach((repost) => {
    if (repost.user_id === req.user.id) {
      data[0].isReposted = true;
    }
  });

  data[0].likes = data[0].likes.length;
  data[0].comments = data[0].comments.length;
  data[0].reposts = data[0].reposts.length;

  res.json(data);

  // if (error) return res.status(500).json({ error: error.message });
  // console.log(data);
  // res.json(data);
};

// DELETE /posts/:id
const deletePost = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from("post").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// module.exports = { getPosts, createPost, updatePost, deletePost };

export {
  getPosts,
  getOnePost,
  getUserPosts,
  deletePost,
  createPost,
  updatePost,
};
