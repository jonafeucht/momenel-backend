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
//todo: update email based on --> const { user, error } = await supabase.auth.update({email: 'new@email.com'})
const updatePersonalInfo = async (req, res) => {
  const { email, dob } = req.body;
  const { data, error } = await supabase
    .from("profiles")
    .update({ email, dob })
    .eq("id", req.user.id)
    .limit(1)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export { getProfileInitialData, updatePersonalInfo, getProfileInfo };
