import supabase from "../supabase/supabase.js";

const getSuggestedProfiles = async (req, res) => {
  // get suggested profiles
  let { data, error } = await supabase
    .from("suggested_profiles")
    .select("profile:profiles(id, username,name, profile_url,bio)")
    .order("priority", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  /* This code is querying the "follower" table in the Supabase database to get the `following_id` of
  all the profiles that the logged-in user is following. It is using the `eq` method to filter the
  results to only include rows where the `follower_id` column matches the `id` of the logged-in
  user. It is also using the `in` method to filter the results to only include rows where the
  `following_id` column matches the `id` of any profile in the `data` array. The results of this
  query are being stored in a variable called `doFollow`, which will contain an array of objects
  with a `following_id` property. If there is an error with the query, the error message will be
  stored in a variable called `error2`. */
  const { data: doFollow, error: error2 } = await supabase
    .from("follower")
    .select("following_id")
    .eq("follower_id", req.user.id)
    .in(
      "following_id",
      data.map(({ profile }) => profile.id)
    );

  if (error2) {
    console.log(error2);
    return res.status(500).json({ error: "Something went wrong" });
  }

  /* This code is iterating over the `data` array and for each object in the array, it is setting the
  `isFollowed` property of the `profile` object to `false`. Then, it is iterating over the
  `doFollow` array and checking if the `following_id` property of any object in the array matches
  the `id` property of the `profile` object. If there is a match, it sets the `isFollowed` property
  of the `profile` object to `true`. This code is essentially adding a new property `isFollowed` to
  each profile object in the `data` array based on whether the logged-in user is following that
  profile or not. */
  data.forEach(({ profile }) => {
    profile.isFollowed = false;
    doFollow.forEach((follow) => {
      if (follow.following_id === profile.id) {
        profile.isFollowed = true;
      }
    });
  });

  res.send(data);
};

export { getSuggestedProfiles };
