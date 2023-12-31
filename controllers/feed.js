import supabase from "../supabase/supabase.js";

const getForYouFeed = async (req, res) => {
  const { id: userId } = req.user;
  const from = parseInt(req.params.from) || 0;
  const to = parseInt(req.params.to) || 14;

  try {
    const { data: posts, error } = await supabase.rpc("get_feed", {
      p_user_id: userId,
      p_from: from,
      p_to: to,
    });

    if (error) {
      res.status(500).json({ error: "An error occurred while fetching feed" });
      return;
    }
    const feed = await Promise.all(
      posts.map(async (post) => {
        // Fetch related data for each post
        const { data: content } = await supabase
          .from("content")
          .select("*")
          .eq("post_id", post.f_post_id);

        const { data: userDb } = await supabase
          .from("profiles")
          .select("id, username,profile_url,name")
          .eq("id", post.f_user_id);
        const user = userDb[0];

        const { count: likes } = await supabase
          .from("like")
          .select("id", { count: "exact", head: true })
          .eq("post_id", post.f_post_id);
        const { count: comments } = await supabase
          .from("comment")
          .select("id", { count: "exact", head: true })
          .eq("post_id", post.f_post_id);
        const { count: reposts } = await supabase
          .from("repost")
          .select("id", { count: "exact", head: true })
          .eq("post_id", post.f_post_id);

        let repostedBy = null;
        let repostId = null;
        if (post.f_type === "repost") {
          const { data: repostUserDb } = await supabase
            .from("profiles")
            .select("id, username")
            .eq("id", post.f_repost_user_id);
          repostedBy = repostUserDb[0];
          repostId = post.f_repost_id;
        }
        // Assemble the final object for this post
        return {
          type: post.f_type, // 'post' or 'repost'
          id: post.f_post_id,
          repostId,
          caption: post.f_caption,
          user_id: post.f_user_id,
          created_at: post.f_created_at,
          content,
          user,
          likes: likes,
          comments: comments,
          reposts: reposts,
          repostedBy,
          isLiked: post.isliked,
          isReposted: post.isreposted,
        };
      })
    );
    res.json(feed);
  } catch (err) {
    res.status(500).json({ error: "An error occurred while fetching feed" });
  }
};

//get home feed for a user => posts from users they follow and their own posts
const getHomeFeed = async (req, res) => {
  const { id: userId } = req.user;
  let { from, to } = req.params;
  let posts = [];

  // get all users the user follows
  let { data, error } = await supabase
    .from("follower")
    .select(`following_id`)
    .eq("follower_id", userId);

  if (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }

  // add userId to data array at end in format  { following_id: 'e0d08cf8-98de-4d53-a92b-7bb857d3f9db' },
  data = [...data, { following_id: userId }];

  // get all blocked users
  const { data: blockedUsers, error: error4 } = await supabase
    .from("blocked")
    .select(`blocked_id`)
    .eq("user_id", userId);

  if (error4) {
    return res.status(500).json({ error: "Something went wrong" });
  }

  // get all blocked ids in format (id1,id2,id3)
  const blockedIds = blockedUsers.map((b) => b.blocked_id);
  const blockedIdsString = `(${blockedIds.join(",")})`;

  // get all posts from users the user follows
  const { data: followingPosts, error: error2 } = await supabase
    .from("post")
    .select(
      `id,caption,user_id,created_at, user:profiles(name,username,profile_url), likes: like(count), comments: comment(count), reposts: repost(count), content(id,type,width,height,blurhash,format)`
    )
    .eq("published", true)
    .in(
      "user_id",
      data.map((f) => f.following_id)
    )
    .not("user_id", "in", blockedIdsString)
    .order("created_at", { ascending: false })
    .order("created_at", { foreignTable: "content", ascending: true })
    .range(from, to)
    .limit(15);

  if (error2) {
    return res.status(500).json({ error: "Something went wrong" });
  }
  // add to posts with type post
  posts = [...posts, ...followingPosts.map((p) => ({ type: "post", ...p }))];

  // get all reposts from the followed users
  const { data: reposts, error: error3 } = await supabase
    .from("repost")
    .select(
      `id,created_at,repostedBy:profiles(id,username),post!inner(id,caption,user_id,created_at, user:profiles(name,username,profile_url), likes: like(count), comments: comment(count), reposts: repost(count), content(id,type,width,height,blurhash,format))`
    )
    .eq("post.published", true)
    .in(
      "user_id",
      data.map((f) => f.following_id)
    )
    .not("post.user_id", "in", blockedIdsString)
    .not("user_id", "in", blockedIdsString)
    .range(from, to)
    .limit(15)
    .order("created_at", { ascending: false })
    .order("created_at", { foreignTable: "post.content", ascending: true });

  if (error3) {
    return res.status(500).json({ error: "Something went wrong" });
  }

  // add to posts with type repost
  posts = [...posts, ...reposts.map((r) => ({ type: "repost", ...r }))];

  // get all posts ids in a new array based on the type
  const postIds = posts.map((post) =>
    post.type === "post" ? post.id : post.post.id
  );

  const { data: hook, error: hookerror } = await supabase.rpc(
    "check_likes_reposts",
    { user_id: userId, post_ids: postIds }
  );

  if (hookerror) {
    return res.status(500).json({ error: "Something went wrong" });
  }

  // add isLiked and isReposted to posts and set them true or false  hook={ liked: [ 100, 91 ], reposted: [ 99 ] }
  posts = posts.map((post) => {
    const { liked, reposted } = hook;
    let updatedPost = post;
    let id = post.type === "post" ? post.id : post.post.id;

    if (liked.includes(id)) {
      updatedPost = { ...updatedPost, isLiked: true };
    } else {
      updatedPost = { ...updatedPost, isLiked: false };
    }

    if (reposted.includes(id)) {
      updatedPost = { ...updatedPost, isReposted: true };
    } else {
      updatedPost = { ...updatedPost, isReposted: false };
    }

    return updatedPost;
  });

  // remove duplicates
  posts = posts.filter(
    (post, index, self) =>
      index === self.findIndex((p) => p.id === post.id && p.type === post.type)
  );

  // sort by created_at
  posts = posts.sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  res.json(posts);
};

// get discover feed for a user => posts from users they don't follow + top hashtags + following hashtags
const getDiscoverFeed = async (req, res) => {
  const { id: userId } = req.user;
  let { from, to, ids } = req.params;

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

  // get all blocked users
  const { data: blockedUsers, error: error4 } = await supabase
    .from("blocked")
    .select(`blocked_id`)
    .eq("user_id", userId);

  if (error4) {
    return res.status(500).json({ error: "Something went wrong" });
  }

  // get all blocked ids in format (id1,id2,id3)
  const blockedIds = blockedUsers.map((b) => b.blocked_id);
  // also add userId to it
  blockedIds.push(userId);
  const blockedIdsString = `(${blockedIds.join(",")})`;

  const { data: data23, error: error3 } = await supabase
    .from("post_hashtags")
    .select(querySQL)
    .eq("post.published", true)
    .in(
      "hashtag_id",
      data.map((h) => h.hashtag.id)
    )
    .not("post.user_id", "in", blockedIdsString)
    .order("created_at", { ascending: false })
    .order("created_at", { foreignTable: "post.content", ascending: true })
    .range(from, to)
    .limit(30);
  if (error3) {
    return res.status(500).json({ error: "Something went wrong" });
  }
  posts = [...posts, ...data23];

  // get most popular hashtags from last 7 days from post_hashtags
  const { data: data2, error: error2 } = await supabase
    .from("trending_hashtags")
    .select(`hashtag(id,hashtag)`);

  if (error2) {
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
    .not("post.user_id", "in", blockedIdsString)
    .order("created_at", { ascending: false })
    .order("created_at", { foreignTable: "post.content", ascending: true })
    .range(from, to)
    .limit(30);

  if (trendingPostsError) {
    return res.status(500).json({ error: "Something went wrong" });
  }

  posts = [...posts, ...trendingPosts];

  // get all posts ids in a new array
  const postIds = posts.map((post) => post.post.id);

  const { data: hook, error: hookerror } = await supabase.rpc(
    "check_likes_reposts",
    { user_id: userId, post_ids: postIds }
  );

  if (hookerror) {
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

  // remove post dubplicates that have post.id from the ids after coverting ids to array and type int
  ids = ids.split(",").map((id) => parseInt(id));
  posts = posts.filter((post) => !ids.includes(post.post.id));

  // remove post dubplicates
  posts = posts.filter((post, index, self) => {
    return (
      index ===
      self.findIndex(
        (t) => t.post.id === post.post.id && t.post.id === post.post.id
      )
    );
  });

  // sort posts by created_at
  posts.sort((a, b) => {
    return new Date(b.post.created_at) - new Date(a.post.created_at);
  });

  return res.json({
    posts,
    trendingHashtags: data2,
    followingHashtags: data,
  });
};

export { getHomeFeed, getDiscoverFeed, getForYouFeed };
