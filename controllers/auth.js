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

// this is a test route to get a token

const signIn = async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export { doesEmailExist, signIn };
