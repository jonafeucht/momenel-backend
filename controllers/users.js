import supabase from "../supabase/supabase.js";

// return has_onBoarded, username, profile_url, cover_url
const getProfileInitialData = async (req, res) => {
  // get data using the user.id
  const { data, error } = await supabase
    .from("profiles")
    .select("has_onboarded, username, profile_url, cover_url")
    .eq("id", req.user.id)
    .limit(1)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

//get user email and date of birth
const getProfileInfo = async (req, res) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("email, date_of_birth")
    .eq("id", req.user.id)
    .limit(1)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// update user email and/or date of birth
//todo: chnage update logic to update only the fields that are passed in the request body
//todo: add validation to check if the email is valid and date of birth is in the correct format
//todo: add validation to check if the email is already in use
//todo: add validation to check if the date of birth is in the past

// updatePersonalInfo used to update date of birth only. email is updated on the frontend.
const updatePersonalInfo = async (req, res) => {
  console.log("updatePersonalInfo called");
  const { email, birthday } = req.body;
  if (!birthday)
    return res.status(400).json({ error: "Birthday cannot be empty" });

  console.log(birthday);
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

export { getProfileInitialData, updatePersonalInfo, getProfileInfo };
