import { postHashtag } from "../controllers/hashtags.js";
// import fetch from "node-fetch";

// build a helper function to extract hashtags from a string

const extractHashtags = (str) => {
  const regexp = /#\w+/g;

  let tags = str.match(regexp);
  console.log(tags);
  // if hashtags is not null
  if (tags) {
    // loop through hashtags
    tags?.forEach(async (hashtag) => {
      console.log(hashtag);
      //   console.log(data);
      return data;
    });

    //   return str.match(regexp);
  }
};

// console.log(
//   extractHashtags(
//     "Hello #world! this is a caption or comment of a post. #another_tag cool stuffs #someTagsWithCamelCase, #some_tags_with_snake_case, #nightlight #dreamteam #photography"
//   )
// ); // => ["#world"]

export default extractHashtags;
