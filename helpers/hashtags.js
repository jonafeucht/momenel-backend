// import { postHashtag } from "../controllers/hashtags.js";
import supabase from "../supabase/supabase.js";
// import fetch from "node-fetch";

// build a helper function to extract hashtags from a string

function extractHashtags(str, userId, postId) {
  const regexp = /#\w+/g;

  let tags = str.match(regexp);

  // remove dublicates
  tags = [...new Set(tags)];

  if (tags) {
    // remove the # from the hashtag
    tags = tags.map((tag) => tag.slice(1));
    // check if the hashtag already exists in the database
    tags.forEach(async (tag) => {
      const { data, error } = await supabase
        .from("hashtag")
        .select("*")
        .eq("hashtag", tag);

      if (error) return res.status(500).json({ error: error.message });
      if (data.length > 0) {
        let tag_id = data[0].id;

        // create post and hashtag relationship in the post_hashtags table
        const { error: error2 } = await supabase.from("post_hashtags").insert([
          {
            post_id: postId,
            hashtag_id: tag_id,
          },
        ]);
        if (error2) return { error: error2.message };
      }
      // if the hashtag does not exist, create it
      else {
        const { data: data3, error: error3 } = await supabase
          .from("hashtag")
          .insert([
            {
              hashtag: tag,
            },
          ])
          .select("*");
        if (error3) return { error: error3.message };

        // create post and hashtag relationship in the post_hashtags table
        const { error: error4 } = await supabase.from("post_hashtags").insert([
          {
            post_id: postId,
            hashtag_id: data3[0].id,
          },
        ]);
        if (error4) return { error: error4.message };
      }
    });
  }
}

export default extractHashtags;
