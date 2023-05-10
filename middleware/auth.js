import e from "express";
import supabase from "../supabase/supabase.js";

const verify = async (req, res, next) => {
  // if token doesn't exist, return 401
  if (!req.headers.authorization) {
    return res.status(401).json({ error: "Unauthorized" });
  } else {
    const token = req.headers.authorization.split(" ")[1]; // Get token from Authorization header
    //   console.log(token);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error) return res.status(401).json({ error: "Please log in" });
    req.user = user;
  }

  //   console.log(user);
  next();
};

export default verify;
