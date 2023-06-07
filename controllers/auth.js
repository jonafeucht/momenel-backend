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

// passoword reset
const resetPassword = async (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: "Unauthorized" });
  } else {
    let newPassword = req.params.password;

    // if now password then return error
    if (!newPassword)
      return res.status(400).json({ error: "please enter a password" });

    const token = req.headers.authorization.split(" ")[1]; // Get token from Authorization header

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error)
      return res.status(401).json({ error: "oops, something went wrong." });
    console.log(user.id);
    const { error2 } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (error2) return res.status(500).json({ error: error2.message });

    res.status(200).json({ message: "success" });
  }
};

const signIn = async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export { doesEmailExist, signIn, resetPassword };
