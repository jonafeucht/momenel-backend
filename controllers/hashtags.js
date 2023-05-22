import supabase from "../supabase/supabase.js";

// get all hashtags
const getHashtags = async (req, res) => {
  const { data, error } = await supabase.from("hashtag").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

// post a hashtag
const postHashtag = async (req, res) => {
  console.log(req.body);
  //hashtag must start with #
  if (!req.body.hashtag.startsWith("#"))
    return res.status(400).json({ error: "Hashtag must start with #" });

  // check if hashtag already exists
  const { data, error } = await supabase
    .from("hashtag")
    .select("*")
    .eq("hashtag", req.body.hashtag);
  if (error) return { error: error.message };
  if (data.length > 0)
    return res.status(400).json({ error: "Hashtag already exist" });

  // insert hashtag into database
  const { data: data2, error: error2 } = await supabase
    .from("hashtag")
    .insert([{ hashtag: req.body.hashtag }])
    .select();

  if (error2) return res.status(500).json({ error: error2.message });
  return res.status(201).json(data2);
};

export { getHashtags, postHashtag };
