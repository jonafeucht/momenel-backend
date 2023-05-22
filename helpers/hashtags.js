// import { postHashtag } from "../controllers/hashtags.js";
import supabase from "../supabase/supabase.js";
// import fetch from "node-fetch";

// build a helper function to extract hashtags from a string

function extractHashtags(str, userId, postId) {
  console.log(str);
  const regexp = /#\w+/g;

  let tags = str.match(regexp);
  console.log(tags);
  // if hashtags is not null
  if (tags) {
    // loop through hashtags
    tags?.forEach(async (hashtag) => {
      // console.log(hashtag);
      // check if hashtag already exists
      const { data, error } = await supabase
        .from("hashtag")
        .select("*")
        .eq("hashtag", hashtag);
      if (error) return { error: error.message };
      if (data.length > 0) return { error: "Hashtag already exists" };

      // insert hashtag into database
      const { data: data2, error: error2 } = await supabase
        .from("hashtag")
        .insert([{ hashtag: hashtag }])
        .select();

      if (error2) return { error: error2.message };
      // create association between hashtag and post and hashtag and user
      // get the id of the hashtag
      const hashtagId = data2[0].id;

      // create association between hashtag and post
      const { data: data3, error: error3 } = await supabase
        .from("post_hashtags")
        .insert([{ hashtag_id: hashtagId, post_id: postId }]);

      // send error
      if (error3) return { error: error3.message };

      // create association between hashtag and user
      const { data: data4, error: error4 } = await supabase
        .from("user_hashtag")
        .insert([{ hashtag_id: hashtagId, user_id: userId }]);

      // send error
      if (error4) return { error: error4.message };
    });
  }
}

// console.log(
//   extractHashtags(
//     "Hello #world! this is a caption or comment of a post. #another_tag cool stuffs #someTagsWithCamelCase, #some_tags_with_snake_case, #nightlight #dreamteam #photography"
//   )
// ); // => ["#world"]

export default extractHashtags;
