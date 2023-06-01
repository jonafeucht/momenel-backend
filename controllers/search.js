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

export { getSearchSuggestions };
