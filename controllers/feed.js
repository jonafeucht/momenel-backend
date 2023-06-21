import supabase from "../supabase/supabase.js";

//todo: get home feed for a user => posts from users they follow and their own posts
const getHomeFeed = async (req, res) => {};

// get discover feed for a user => posts from users they don't follow + top hashtags + following hashtags
const getDiscoverFeed = async (req, res) => {
  const { id: userId } = req.user;
  let { from, to } = req.params;
  const querySQL = `post!inner(id,caption,user_id,created_at, user:profiles(name,username,profile_url), likes: like(count), comments: comment(count), reposts: repost(count), content(id,type,width,height,blurhash,format))`;
  let posts = [];
  // get all the hashtags the user follows
  const { data, error } = await supabase
    .from("user_hashtag")
    .select(`hashtag(id,hashtag)`)
    .eq("user_id", userId);

  if (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }

  const { data: data23, error: error3 } = await supabase
    .from("post_hashtags")
    .select(querySQL)
    .eq("post.published", true)
    .in(
      "hashtag_id",
      data.map((h) => h.hashtag.id)
    )
    .order("created_at", { foreignTable: "post", ascending: false })
    .range(from, to);
  if (error3) {
    console.log(error3);
    return res.status(500).json({ error: "Something went wrong" });
  }
  posts = [...posts, ...data23];

  // get most popular hashtags from last 7 days from post_hashtags
  const { data: data2, error: error2 } = await supabase
    .from("trending_hashtags")
    .select(`hashtag(id,hashtag)`);

  if (error2) {
    console.log(error2);
    return res.status(500).json({ error: "Something went wrong" });
  }

  const { data: trendingPosts, error: trendingPostsError } = await supabase
    .from("post_hashtags")
    .select(querySQL)
    .eq("post.published", true)
    .in(
      "hashtag_id",
      data2.map((h) => h.hashtag.id)
    )
    .order("created_at", { foreignTable: "post", ascending: false })
    .range(from, parseInt(from) + Math.max(20 - posts.length, 0)); // increase the range to get more posts if there are not enough posts from the hashtags the user follows (min 10)

  if (trendingPostsError) {
    console.log(trendingPostsError);
    return res.status(500).json({ error: "Something went wrong" });
  }

  posts = [...posts, ...trendingPosts];

  // sort posts by created_at
  posts.sort((a, b) => {
    return new Date(b.post.created_at) - new Date(a.post.created_at);
  });
  // get all posts ids in a new array
  const postIds = posts.map((post) => post.post.id);

  const { data: hook, error: hookerror } = await supabase.rpc(
    "check_likes_reposts",
    { user_id: userId, post_ids: postIds }
  );

  if (hookerror) {
    console.log(hookerror);
    return res.status(500).json({ error: "Something went wrong" });
  }

  // add isLiked and isReposted to posts and set them true or false  hook={ liked: [ 100, 91 ], reposted: [ 99 ] }
  posts = posts.map((post) => {
    const { liked, reposted } = hook;
    let updatedPost = post;

    if (liked.includes(post.post.id)) {
      updatedPost = { ...updatedPost, isLiked: true };
    } else {
      updatedPost = { ...updatedPost, isLiked: false };
    }

    if (reposted.includes(post.post.id)) {
      updatedPost = { ...updatedPost, isReposted: true };
    } else {
      updatedPost = { ...updatedPost, isReposted: false };
    }

    return updatedPost;
  });

  // remove post dubplicates
  posts = posts.filter((post, index, self) => {
    return (
      index ===
      self.findIndex(
        (t) => t.post.id === post.post.id && t.post.id === post.post.id
      )
    );
  });

  return res.json({
    posts,
    trendingHashtags: data2,
    followingHashtags: data.splice(5, data.length - 5),
  });
};

export { getHomeFeed, getDiscoverFeed };
