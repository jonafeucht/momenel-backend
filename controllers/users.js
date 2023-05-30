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
  const { username } = req.params;
  console.log(username);

  // check if username is taken
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username);

  if (error) return res.status(500).json({ error: error.message });

  if (data.length > 0) {
    console.log(data);
    return res.status(400).json({ error: "Username is taken" });
  } else {
    return res.status(200).json({ message: "Username is available" });
  }
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
      .json({ error: "Username cannot be more than 30 characters" });
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
  const age = today.getFullYear() - date.getFullYear();
  const month = today.getMonth() - date.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  if (age < 18) {
    return res
      .status(400)
      .json({ error: "You must be 18 years or older to use this app" });
  }
  // if age is older than 200 years
  if (age > 200) {
    return res
      .status(400)
      .json({ error: "You must be 200 years or younger to use this app" });
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

export {
  getProfileInitialData,
  updatePersonalInfo,
  getDob,
  getEditProfileData,
  updateEditProfile,
  checkUsername,
};
