import supabase from "../supabase/supabase.js";

const getSearchSuggestions = async (req, res) => {
  let { query } = req.params;
  if (query[0] === "#") {
    // find all hashtags that start with the query
    let { data, error } = await supabase
      .from("hashtag")
      .select("id,hashtag")
      .ilike("hashtag", `%${query.substring(1)}%`)
      .limit(5);

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.send(data);
  } else if (query[0] === "@") {
    // find all usernames that start with the query
    // return the top 5 results
    let { data: usernames, error: usernamesError } = await supabase
      .from("profiles")
      .select("id,username,profile_url")
      .ilike("username", `%${query.substring(1)}%`)
      .limit(5);

    if (usernamesError) {
      return res.status(500).json({ error: usernamesError.message });
    }
    return res.send(usernames);
  } else {
    // find all hashtags that start with the query
    let { data, error } = await supabase
      .from("hashtag")
      .select("id,hashtag")
      .ilike("hashtag", `%${query}%`)
      .limit(5);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // find all usernames that start with the query
    // return the top 5 results
    let { data: usernames, error: usernamesError } = await supabase
      .from("profiles")
      .select("id,username,profile_url")
      .ilike("username", `%${query}%`)
      .limit(5);

    if (usernamesError) {
      return res.status(500).json({ error: usernamesError.message });
    }

    data = data.concat(usernames);

    return res.send(data);
  }
};

const searchFeed = async (req, res) => {
  const { id: userId } = req.user;
  let { from, to, hashtag } = req.params;
  let hashtagId;
  const querySQL = `id,post!inner(id,caption,user_id,created_at, user:profiles(name,username,profile_url), likes: like(count), comments: comment(count), reposts: repost(count), content(id,type,width,height,blurhash,format))`;

  // get hashtag id
  let { data: data1, error: error1 } = await supabase
    .from("hashtag")
    .select("id")
    .eq("hashtag", hashtag)
    .limit(1);

  if (error1) {
    return res.status(500).json({ error: "Something went wrong" });
  }

  if (data1.length === 0) {
    return res.status(404).json({ error: "Hashtag not found" });
  }

  hashtagId = data1[0].id;

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

  let { data: data23, error: error3 } = await supabase
    .from("post_hashtags")
    .select(querySQL)
    .eq("post.published", true)
    .eq("hashtag_id", hashtagId)
    .not("post.user_id", "in", blockedIdsString)
    .order("created_at", { ascending: false })
    .range(from, to)
    .limit(10);

  if (error3) {
    return res.status(500).json({ error: "Something went wrong" });
  }

  // remove all dubplicates
  data23 = data23.filter(
    (post, index, self) => index === self.findIndex((t) => t.id === post.id)
  );

  // get is user is following the hashtag
  let { data: data2, error: error2 } = await supabase
    .from("user_hashtag")
    .select("hashtag_id")
    .eq("user_id", userId)
    .eq("hashtag_id", hashtagId);

  if (error2) {
    return res.status(500).json({ error: "Something went wrong" });
  }

  // get all posts ids in a new array based on the type
  const postIds = data23.map((post) =>
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
  data23 = data23.map((post) => {
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

  let resData = {
    hashtagId: hashtagId,
    isFollowing: data2.length > 0,
    posts: data23,
  };

  return res.send(resData);
};

export { getSearchSuggestions, searchFeed };
