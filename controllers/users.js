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

export { getProfileInitialData, updatePersonalInfo, getDob };
