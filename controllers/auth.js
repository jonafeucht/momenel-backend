import supabase from "../supabase/supabase.js";

const doesEmailExist = async (req, res) => {
  const { email } = req.query;
  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("email", email);

  if (error) return res.status(500).json({ error: error.message });
  if (data.length > 0) return res.status(200).json({ exists: true });
  return res.status(200).json({ exists: false });
};

export { doesEmailExist };
