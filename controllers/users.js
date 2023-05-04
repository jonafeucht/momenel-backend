import { log } from "console";
import supabase from "../supabase/supabase.js";

// return has_onBoarded, username, profile_url, preview_url
const getProfileInitialData = async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  //todo: add this in middleware Retrieve the user
  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // get data using the user.id
  const { data, error } = await supabase
    .from("profiles")
    .select("has_onboarded, username, profile_url, preview_url")
    .eq("id", user.id)
    .limit(1)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export { getProfileInitialData };
