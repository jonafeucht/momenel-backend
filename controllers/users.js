import supabase from "../supabase/supabase.js";

// return has_onBoarded, username, profile_url
const getProfileInitialData = async (req, res) => {
  // get data using the user.id
  const { data, error } = await supabase
    .from("profiles")
    .select("has_onboarded, username, profile_url")
    .eq("id", req.user.id)
    .limit(1)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// GET /user/editprofile
const getEditProfileData = async (req, res) => {
  console.log("getProfileInitialData called");
  const { id: userId } = req.user;

  const { data, error } = await supabase
    .from("profiles")
    .select(`username, name, bio, website, profile_url`)
    .eq("id", userId)
    .limit(1)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// GET /user/checkUsername/:username
const checkUsername = async (req, res) => {
  let { username } = req.params;
  console.log("user", username);

  username = username.toLowerCase();
  username = username.trim();

  // check error
  if (!username || username === "")
    return res.status(400).json({ error: "Username cannot be empty" });
  if (username && username.length > 38)
    return res
      .status(400)
      .json({ error: "Username cannot be more than 38 characters" });
  if (username && username.includes(" "))
    return res.status(400).json({ error: "Username cannot have spaces" });

  // username can't have special characters except underscore
  if (username && !username.match(/^[a-zA-Z0-9_]+$/))
    return res
      .status(400)
      .json({ error: "Username cannot have special characters" });

  // check if username is taken
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username);

  if (error) return res.status(500).json({ error: error.message });
  console.log(data);

  // check if data has an id that equal req.user.id. If yes, then username is available
  if (data.length > 0) {
    if (data[0].id === req.user.id) {
      return res.status(200).json({ message: "Username is available" });
    }
  }

  if (data.length > 0) {
    console.log(data);
    return res.status(400).json({ error: "Username is taken" });
  } else {
    return res.status(200).json({ message: "Username is available" });
  }
};

const updateUsername = async (req, res) => {
  let { username } = req.params;
  const { id: userId } = req.user;

  // update username, name, bio, website in lowercase and trim spaces
  username = username.toLowerCase();
  username = username.trim();

  // check if username is not an empty string or is empty spaces and max length is 30 characters and has no spaces
  if (!username || username === "")
    return res.status(400).json({ error: "Username cannot be empty" });
  if (username && username.length > 38)
    return res
      .status(400)
      .json({ error: "Username cannot be more than 38 characters" });
  if (username && username.includes(" "))
    return res.status(400).json({ error: "Username cannot have spaces" });

  // username can't have special characters except underscore
  if (username && !username.match(/^[a-zA-Z0-9_]+$/))
    return res
      .status(400)
      .json({ error: "Username cannot have special characters" });

  // update username, name, bio, website
  const { data, error } = await supabase
    .from("profiles")
    .update({ username })
    .eq("id", userId)
    .select("username")
    .single();

  if (error?.code === "23505")
    return res.status(400).json({ error: "Username is taken" });
  if (error) return res.status(500).json({ error: error.message });
  console.log(data);
  res.send(data);
};

const updateName = async (req, res) => {
  let { name } = req.params;
  const { id: userId } = req.user;

  if (name && name.length > 60)
    return res
      .status(400)
      .json({ error: "Name cannot be more than 60 characters" });

  // update username, name, bio, website
  const { data, error } = await supabase
    .from("profiles")
    .update({ name })
    .eq("id", userId)
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.send(data);
};

// POST /user/updateEditProfile
const updateEditProfile = async (req, res) => {
  const { id: userId } = req.user;
  let { username, name, bio, website, profile_url } = req.body;
  const { files: profile } = req;
  console.log(req.body);
  // update username, name, bio, website in lowercase and trim spaces
  username = username.toLowerCase();
  username = username.trim();
  name = name.trim();
  bio = bio.trim();
  website = website.trim();

  // check if username is not an empty string or is empty spaces and max length is 30 characters and has no spaces
  if (!username || username === "")
    return res.status(400).json({ error: "Username cannot be empty" });
  if (username && username.length > 38)
    return res
      .status(400)
      .json({ error: "Username cannot be more than 38 characters" });
  if (username && username.includes(" "))
    return res.status(400).json({ error: "Username cannot have spaces" });

  // username can't have special characters except underscore
  if (username && !username.match(/^[a-zA-Z0-9_]+$/))
    return res
      .status(400)
      .json({ error: "Username cannot have special characters" });

  // check if name exists and is not an empty string or is empty spaces
  if (name && name === "")
    return res.status(400).json({ error: "Name cannot be empty" });
  // max length is 60 characters
  if (name && name.length > 60)
    return res
      .status(400)
      .json({ error: "Name cannot be more than 60 characters" });

  // check if bio exists and is not an empty string or is empty spaces and max length is 300 characters
  if (bio && bio === "")
    return res.status(400).json({ error: "Bio cannot be empty" });
  if (bio && bio.length > 300)
    return res
      .status(400)
      .json({ error: "Bio cannot be more than 300 characters" });

  // check if website exists and is not an empty string or is empty spaces
  if (website && website === "")
    return res.status(400).json({ error: "Website cannot be empty" });
  // check if website is a valid url based on regex
  if (
    website &&
    !website.match(
      "^(https?:\\/\\/)?" + // protocol
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
        "(\\#[-a-z\\d_]*)?$",
      "i"
    )
  ) {
    console.log("site", website);
    return res.status(400).json({ error: "Website is not a valid url" });
  }

  // update username, name, bio, website
  const { data, error } = await supabase
    .from("profiles")
    .update({ username, name, bio, website })
    .eq("id", userId)
    .select("username, name, bio, website, profile_url")
    .single();

  if (error?.code === "23505")
    return res.status(400).json({ error: "Username is taken" });
  if (error) return res.status(500).json({ error: error.message });

  // delete old profile and update new profile picture

  if (profile?.length > 0) {
    console.log(profile);
    console.log("old pic", data.profile_url);
    console.log("update profile picture");
  } else if (profile_url === "null") {
    console.log("delete profile picture");
  }

  res.json(data);
};

//get date of birth
const getDob = async (req, res) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("date_of_birth")
    .eq("id", req.user.id)
    .limit(1)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// updatePersonalInfo used to update date of birth only. email is updated on the frontend.
const updatePersonalInfo = async (req, res) => {
  console.log("updatePersonalInfo called");
  const { birthday } = req.body;
  if (!birthday)
    return res.status(400).json({ error: "Birthday cannot be empty" });

  const date = new Date(birthday);
  //if date is invalid
  if (isNaN(date)) {
    return res.status(400).json({ error: "The date of birth is incorrect" });
  }
  //if date is in the future
  if (date > new Date()) {
    return res
      .status(400)
      .json({ error: "The date of birth cannot be in the future" });
  }

  // if user is under 18 years old based on the date of birth
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  let month = today.getMonth() - date.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  if (age < 18) {
    return res
      .status(400)
      .json({ error: "You must be 18 years or older to use this app" });
  }
  // if age is older than 200 years
  if (age > 130) {
    return res
      .status(400)
      .json({ error: "You must be 130 years or younger to use this app" });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ date_of_birth: date })
    .eq("id", req.user.id)
    .select("date_of_birth");

  if (error) return res.status(500).json({ error: error.message });
  return res
    .status(200)
    .json({ message: "Date of birth updated successfully" });
};

// update has_onboarded to true
const updateHasOnboarded = async (req, res) => {
  const userId = req.user.id;
  const { data, error } = await supabase
    .from("profiles")
    .update({ has_onboarded: true })
    .eq("id", userId)
    .select("has_onboarded,username, profile_url")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.send(data);
};

// get own profile data
const getProfile = async (req, res) => {
  let userId = req.user.id;
  let { from, to, username } = req.params;
  if (username && username !== "null") {
    // get user id from username
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (userError) return res.status(500).json({ error: "No user exists." });
    if (!user) return res.status(404).json({ error: "User not found" });

    // check if the user has blocked the profile
    const { data: blocked, error: blockedError } = await supabase
      .from("blocked")
      .select("user_id, blocked_id")
      .eq("user_id", userId)
      .eq("blocked_id", user.id);

    // .not("id", "in", `(5,6,7,10)`);

    if (blockedError)
      return res.status(500).json({ error: blockedError.message });
    if (blocked.length > 0)
      return res.json({
        profile: {
          id: user.id,
          isBlockedByYou: true,
        },
        posts: [],
      });

    // check if the user is blocked by the profile
    const { data: blockedBy, error: blockedByError } = await supabase
      .from("blocked")
      .select("user_id, blocked_id")
      .eq("user_id", user.id)
      .eq("blocked_id", userId);

    if (blockedByError)
      return res.status(500).json({ error: blockedByError.message });

    if (blockedBy.length > 0)
      return res.json({
        profile: {
          id: user.id,
          isBlockedByUser: true,
        },
        posts: [],
      });

    userId = user.id;
  }

  let data = {};
  let posts = [];
  // get posts that equal to the user id
  const { data: postsUser, error: postsError } = await supabase
    .from("post")
    .select(
      `published,id,caption,user_id,created_at, user:profiles(name,username,profile_url), likes: like(count), comments: comment(count), reposts: repost(count), content(id,type,width,height,blurhash,format)`
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to)
    .limit(10);

  if (postsError) return res.status(500).json({ error: postsError.message });
  // add to data with type post
  posts = [...posts, ...postsUser.map((p) => ({ type: "post", ...p }))];

  // get all reposts from the followed users
  const { data: reposts, error: error3 } = await supabase
    .from("repost")
    .select(
      `id,created_at,repostedBy:profiles(id,username),post!inner(id,caption,user_id,created_at, user:profiles(name,username,profile_url), likes: like(count), comments: comment(count), reposts: repost(count), content(id,type,width,height,blurhash,format))`
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to)
    .limit(10);

  if (error3) {
    console.log(error3);
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
    console.log(hookerror);
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

  // get profile data
  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`id,username,profile_url,blurhash, name, bio, website, location`)
    .eq("id", userId)
    .single();

  if (profileError)
    return res.status(500).json({ error: profileError.message });

  // get count of followers and following
  const { data: followers, error: followersError } = await supabase
    .from("follower")
    .select("follower_id")
    .eq("following_id", userId);

  if (followersError)
    return res.status(500).json({ error: followersError.message });

  const { data: following, error: followingError } = await supabase
    .from("follower")
    .select("following_id")
    .eq("follower_id", userId);

  if (followingError)
    return res.status(500).json({ error: followingError.message });

  // get count of likes recieved by the user on all posts
  const { data: allPostIds, error: allPostIdsError } = await supabase
    .from("post")
    .select("id")
    .eq("user_id", userId);

  if (allPostIdsError)
    return res.status(500).json({ error: allPostIdsError.message });

  const allPostIdsArray = allPostIds.map((post) => post.id);
  const { count: likes, error: likesError } = await supabase
    .from("like")
    .select("*", { count: "exact", head: true })
    .in("post_id", allPostIdsArray);

  if (likesError) return res.status(500).json({ error: likesError.message });

  // if username then find if the req.user.id is following the userId
  if (username && username !== "null") {
    const { data: isFollowing, error: isFollowingError } = await supabase
      .from("follower")
      .select("follower_id")
      .eq("follower_id", req.user.id)
      .eq("following_id", userId);

    if (isFollowingError)
      return res.status(500).json({ error: isFollowingError.message });

    profile = {
      ...profile,
      isFollowing: isFollowing.length > 0 ? true : false,
    };
  }

  profile = {
    ...profile,
    followers: followers.length,
    following: following.length,
    likes_count: likes,
  };

  data = { profile, posts };

  res.send(data);
};

export {
  getProfileInitialData,
  updatePersonalInfo,
  getDob,
  getEditProfileData,
  updateEditProfile,
  checkUsername,
  updateUsername,
  updateName,
  updateHasOnboarded,
  getProfile,
};
