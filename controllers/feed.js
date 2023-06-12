import supabase from "../supabase/supabase.js";

const currentDate = new Date();
const sevenDaysAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);

const formattedDate = sevenDaysAgo
  .toISOString()
  .replace("T", " ")
  .replace("Z", "+00");
console.log(formattedDate);

//todo: get home feed for a user => posts from users they follow and their own posts
const getHomeFeed = async (req, res) => {};

//todo: get discover feed for a user => posts from users they don't follow + top hashtags + following hashtags
const getDiscoverFeed = async (req, res) => {
  // get all the hashtags the user follows
  //   const { data, error } = await supabase.from("hashtag").select(`*`);
  // get most popular hashtags from last 7 days from post_hashtags
  const { data, error } = await supabase
    .from("post_hashtags")
    .select(
      ` post(*,  likes: like(user_id), comments: comment(user_id), reposts: repost(user_id), content(*))`
    )
    .gte("created_at", formattedDate);

  // get the posts for all the hashtags that the user follows
  const { data: data2, error: error2 } = await supabase
    .from("user_hashtag")
    .select(`hashtag(id, hashtag)`);

  const hashtagIds = data2.map((hashtag) => hashtag.hashtag.id);
  console.log(hashtagIds);

  // get the posts for all the hashtags that the user follows which is in data2
  const { data: data3, error: error3 } = await supabase
    .from("post_hashtags")
    .select(
      ` post(*,  likes: like(user_id), comments: comment(user_id), reposts: repost(user_id), content(*))`
    )
    .in("hashtag_id", hashtagIds);

  //   //   const hashtagIds = [15, 33];
  //   // get post for a specific hashtag id
  //   const { data: data4, error: error4 } = await supabase
  //     .from("post_hashtags")
  //     .select(` post(*, user:profiles(id, name, username, profile_url))`)
  //     .in("hashtag_id", hashtagIds);

  // console.log(data4);
  //   console.log(data2);

  // posts = data.concat(data3);

  const posts = data
    .concat(data3)
    .map((post) => {
      return post.post;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB - dateA;
    });

  //   get rid of duplicates from posts

  const uniquePosts = {};
  const uniqueData = [];

  for (const post of posts) {
    const postId = post.id;
    if (!uniquePosts[postId]) {
      uniquePosts[postId] = true;
      uniqueData.push(post);
    }
  }

  uniqueData.forEach((post) => {
    post.isLiked = false;
    post.isReposted = false;

    // check if the user has liked the post
    post.likes.forEach((like) => {
      if (like.user_id === req.user.id) {
        post.isLiked = true;
      }
    });

    // check if the user has reposted the post
    post.reposts.forEach((repost) => {
      if (repost.user_id === req.user.id) {
        post.isReposted = true;
      }
    });

    post.likes = post.likes.length;
    post.comments = post.comments.length;
    post.reposts = post.reposts.length;
  });

  if (error) return res.status(500).json({ error: error.message });
  if (error2) return res.status(500).json({ error: error2.message });
  if (error3) return res.status(500).json({ error: error3.message });

  return res.json(uniqueData);
};

export { getHomeFeed, getDiscoverFeed };
