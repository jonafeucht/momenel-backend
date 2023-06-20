import supabase from "../supabase/supabase.js";
import extractHashtags from "../helpers/hashtags.js";
import axios from "axios";
import sharp from "sharp";
import { encode } from "blurhash";
import convert from "heic-convert";
import tmp from "tmp";
import fs from "fs";
import path from "path";
import { fork } from "child_process";

// this will get all the posts by the user
const getUserPosts = async (req, res) => {
  const { data, error } = await supabase
    .from("post")
    .select(
      `*, likes: like(user_id), comments: comment(user_id), reposts: repost(user_id), content(*)`
    )
    .eq("user_id", req.user.id);

  if (error) return res.status(500).json({ error: error.message });

  data.forEach((post) => {
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
  res.json(data);
};

// this will be turned to the feed
// GET /posts
const getPosts = async (req, res) => {
  // return all the posts for the user user with comments
  const { data, error } = await supabase
    .from("post")
    .select(
      `*, user:profiles(id, name, username, profile_url), likes: like(user_id), comments: comment(user_id), reposts: repost(user_id), content(*)`
    );

  if (error) return res.status(500).json({ error: error.message });

  // check if each post of the data is liked by the user
  data.forEach((post) => {
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

  // console.log(data);
  res.json(data);
};

// GET /posts/:id
const getOnePost = async (req, res) => {
  const { id } = req.params;
  let { data, error } = await supabase
    .from("post")
    .select(
      `*, user:profiles(id, name, username, profile_url), likes: like(user_id), comments: comment(user_id), reposts: repost(user_id), content(*)`
    )
    .eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  // count the likes comments and resposts of the data
  data[0].isLiked = false;
  data[0].isReposted = false;

  // check if the user has liked the post
  data[0].likes.forEach((like) => {
    if (like.user_id === req.user.id) {
      data[0].isLiked = true;
    }
  });

  // check if the user has reposted the post
  data[0].reposts.forEach((repost) => {
    if (repost.user_id === req.user.id) {
      data[0].isReposted = true;
    }
  });

  data[0].likes = data[0].likes.length;
  data[0].comments = data[0].comments.length;
  data[0].reposts = data[0].reposts.length;

  res.json(data);
};

// POST /posts
const createPost = async (req, res) => {
  const { caption } = req.body;
  let dimensions = [];
  if (req.body.dimensions) dimensions = JSON.parse(req.body.dimensions);
  const { id: userId } = req.user;
  const { files: media } = req;

  console.log(caption, dimensions, userId, media);
  res.status(200).send([{ caption, published: false }]);

  // * create the post
  // const { data, error } = await supabase
  //   .from("post")
  //   .insert([
  //     {
  //       user_id: userId,
  //       caption,
  //       published: media.length > 0 ? false : true,
  //     },
  //   ])
  //   .select(
  //     `*, user:profiles(id, name, username, profile_url), likes: like(user_id), comments: comment(user_id), reposts: repost(user_id), content(*)`
  //   );
  // if (error) return res.status(500).json({ error: error.message });

  // // pass caption, userId, and postId to the extractHashtags function
  // extractHashtags(caption, userId, data[0].id);

  // // count the likes comments and resposts of the data
  // data[0].isLiked = false;
  // data[0].isReposted = false;
  // data[0].likes = data[0].likes.length;
  // data[0].comments = data[0].comments.length;
  // data[0].reposts = data[0].reposts.length;

  // if (!media || media.length === 0) return res.status(201).json(data);

  // // else if there is media files then send a resonse before creating the media
  // res.status(201).json(data);

  //* create the media
  // loop through the media files and check if the file is a video or image
  // try {
  //   media.forEach(async (file, index) => {
  //     if (file.mimetype.toString().startsWith("image")) {
  //       let width = dimensions[index]?.width || 500,
  //         height = dimensions[index]?.height || 500;
  //       let buffer = file.buffer;
  //       let format = file.mimetype.toString().split("/")[1];

  //       // if file is heic convert it to jpeg
  //       if (
  //         file.mimetype.toString() === "image/heic" ||
  //         file.mimetype.toString() === "image/heif"
  //       ) {
  //         buffer = await convert({
  //           buffer,
  //           format: "JPEG",
  //         });
  //         format = "jpeg";
  //       }

  //       /* If the file size is greater than 10,000,000 bytes (10MB), the quality is set to 80. If the file size is
  //       less than 1,000,000 bytes (1MB), the quality is set to 100. Otherwise, the quality is set to
  //       88. This is done to balance the image quality and file size, so that larger images have
  //       lower quality to reduce their size, while smaller images have higher quality to maintain
  //       their details. */
  //       let quality =
  //         file.size > 10000000 ? 80 : file.size < 1000000 ? 100 : 88;

  //       // if the file is not a gif then compress it
  //       if (file.mimetype.toString() !== "image/gif") {
  //         await sharp(buffer)
  //           .jpeg({ mozjpeg: true, quality: quality, force: false })
  //           .png({ quality: quality, force: false })
  //           .toBuffer({ resolveWithObject: true })
  //           .then(({ data, info }) => {
  //             buffer = data;
  //             format = info.format;
  //           })
  //           .catch((err) => {});
  //       } else if (file.mimetype.toString() === "image/gif") {
  //         await sharp(buffer, { animated: true })
  //           .resize(200)
  //           .toBuffer({ resolveWithObject: true })
  //           .then(({ data, info }) => {
  //             buffer = data;
  //             console.log(info.width, info.height);
  //             format = info.format;
  //           })
  //           .catch((err) => {});
  //       }

  //       // create blurhash
  //       const { data: sharpBuffer, info } = await sharp(buffer)
  //         .resize(500)
  //         .ensureAlpha()
  //         .raw()
  //         .toBuffer({
  //           resolveWithObject: true,
  //         });

  //       const blurhash = encode(sharpBuffer, info.width, info.height, 3, 3);

  //       // create the media with type image
  //       const { data: media, error } = await supabase
  //         .from("content")
  //         .insert([
  //           {
  //             post_id: data[0].id,
  //             type: "image",
  //             width,
  //             height,
  //             blurhash,
  //           },
  //         ])
  //         .select("id")
  //         .single();

  //       if (error) return;

  //       axios
  //         .put(
  //           `${process.env.Image_Upload_Url}/${media.id}.${format}`,
  //           buffer,
  //           {
  //             headers: {
  //               AccessKey: "d915734c-bee2-4e6a-bb362bf9f500-edf0-4ba6",
  //               "Content-Type": "application/octet-stream",
  //             },
  //           }
  //         )
  //         .then(async (response) => {
  //           console.log(response.status);
  //           // update status to published
  //           await supabase
  //             .from("content")
  //             .update({ status: "published" })
  //             .eq("id", media.id);
  //         })
  //         .catch((error) => {
  //           console.log(error.message);
  //         });
  //     } else if (file.mimetype.toString().startsWith("video")) {
  //       let width = dimensions[index]?.width || 500,
  //         height = dimensions[index]?.height || 500;
  //       let buffer = file.buffer;
  //       const originalFileName = file.originalname;
  //       // ! COMPRESS VIDEO
  //       const child = fork("helpers/video.js");
  //       tmp.file(
  //         { postfix: path.extname(originalFileName) },
  //         (err, tempFilePath, fd, cleanupCallback) => {
  //           if (err) {
  //             console.log(err);
  //             return;
  //           }
  //           tmp.file(
  //             { postfix: path.extname(originalFileName) },
  //             (err, finalFile, fd, cleanupCallbackNew) => {
  //               if (err) {
  //                 console.log(err);
  //                 return;
  //               }

  //               fs.writeFile(tempFilePath, buffer, (err) => {
  //                 if (err) {
  //                   console.log(err);
  //                 } else {
  //                   console.log(tempFilePath);
  //                   child.send({
  //                     path: tempFilePath,
  //                     post_id: data[0].id,
  //                     userId,
  //                     newFile: finalFile,
  //                     width,
  //                     height,
  //                   });
  //                 }
  //               });
  //             }
  //           );
  //         }
  //       );

  //       child.on("message", (message) => {
  //         const { statusCode, text } = message;
  //         console.log(statusCode, text);
  //       });
  //     } else {
  //       console.log("other");
  //     }
  //   });
  // } catch (error) {
  //   console.log(error);
  // }

  // /*check if there are any items in the `media` array whose `mimetype` property
  // starts with the string "video". If there are no such items, it updates the `published` property of
  // the first item in the `post` table of a Supabase database to `true`. */
  // if (!media.some((item) => item.mimetype.startsWith("video"))) {
  //   await supabase
  //     .from("post")
  //     .update({ published: true })
  //     .eq("id", data[0].id);
  // }
};

// PATCH /posts/:id
const updatePost = async (req, res) => {
  const { id } = req.params;
  const { caption } = req.body;

  console.log({ id, caption });
  const { data, error } = await supabase
    .from("post")
    .update({ caption })
    .match({ id: id })
    .select(
      `*, user:profiles(id, name, username, profile_url), likes: like(user_id), comments: comment(user_id), reposts: repost(user_id), content(*)`
    )
    .eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  // console.log(data[0]);

  // count the likes comments and resposts of the data
  data[0].isLiked = false;
  data[0].isReposted = false;

  // check if the user has liked the post
  data[0].likes.forEach((like) => {
    if (like.user_id === req.user.id) {
      data[0].isLiked = true;
    }
  });

  // check if the user has reposted the post
  data[0].reposts.forEach((repost) => {
    if (repost.user_id === req.user.id) {
      data[0].isReposted = true;
    }
  });

  data[0].likes = data[0].likes.length;
  data[0].comments = data[0].comments.length;
  data[0].reposts = data[0].reposts.length;

  res.json(data);

  // if (error) return res.status(500).json({ error: error.message });
  // console.log(data);
  // res.json(data);
};

// DELETE /posts/:id
const deletePost = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from("post").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.staus(204).json(data);
};

// get posts for a hashtag
// GET /posts/hashtag/:hashtag
const getPostsByHashtag = async (req, res) => {
  const { hashtag } = req.params;
  const { data, error } = await supabase
    .from("post")
    .select(
      `*, user:profiles(id, name, username, profile_url), likes: like(user_id), comments: comment(user_id), reposts: repost(user_id), content(*)`
    )
    .ilike("caption", `%#${hashtag}%`);
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
};

export {
  getPosts,
  getOnePost,
  getUserPosts,
  deletePost,
  createPost,
  updatePost,
  getPostsByHashtag,
};
