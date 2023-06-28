import supabase from "../supabase/supabase.js";

const getSearchSuggestions = async (req, res) => {
  let { query } = req.params;
  console.log(query);
  if (query[0] === "#") {
    // find all hashtags that start with the query
    let { data, error } = await supabase
      .from("hashtag")
      .select("id,hashtag")
      .ilike("hashtag", `%${query.substring(1)}%`)
      .limit(5);

    if (error) {
      console.log(error);
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
      console.log(usernamesError);
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
      console.log(error);
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
      console.log(usernamesError);
      return res.status(500).json({ error: usernamesError.message });
    }

    data = data.concat(usernames);

    return res.send(data);
  }
};

const searchFeed = async (req, res) => {
  const { id: userId } = req.user;
  let { from, to, hashtag } = req.params;
  console.log(from, to, hashtag);
  let hashtagId;
  const querySQL = `id,post!inner(id,caption,user_id,created_at, user:profiles(name,username,profile_url), likes: like(count), comments: comment(count), reposts: repost(count), content(id,type,width,height,blurhash,format))`;

  // get hashtag id
  let { data: data1, error: error1 } = await supabase
    .from("hashtag")
    .select("id")
    .eq("hashtag", hashtag)
    .limit(1);

  if (error1) {
    console.log(error1);
    return res.status(500).json({ error: "Something went wrong" });
  }

  if (data1.length === 0) {
    return res.status(404).json({ error: "Hashtag not found" });
  }

  hashtagId = data1[0].id;

  let { data: data23, error: error3 } = await supabase
    .from("post_hashtags")
    .select(querySQL)
    .eq("post.published", true)
    .eq("hashtag_id", hashtagId)
    .order("created_at", { ascending: false })
    .range(from, to)
    .limit(10);

  if (error3) {
    console.log(error3);
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
    console.log(error2);
    return res.status(500).json({ error: "Something went wrong" });
  }

  let resData = {
    hashtagId: hashtagId,
    isFollowing: data2.length > 0,
    posts: data23,
  };

  return res.send(resData);
};

export { getSearchSuggestions, searchFeed };
