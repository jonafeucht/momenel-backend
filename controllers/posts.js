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
import SendNotification from "../helpers/Notification.js";

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

  res.json(data);
};

// GET /posts/:id
const getOnePost = async (req, res) => {
  const { id } = req.params;
  const { id: userId } = req.user;
  let { data, error } = await supabase
    .from("post")
    .select(
      `id,caption,user_id,created_at, user:profiles(name,username,profile_url), likes: like(count), comments: comment(count), reposts: repost(count), content(id,type,width,height,blurhash,format)`
    )
    .eq("id", id)
    .order("created_at", { foreignTable: "content", ascending: true })
    .single();
  if (error) return res.status(500).json({ error: error.message });

  // get ids
  let { data: hook, error: hookerror } = await supabase.rpc(
    "check_likes_reposts",
    { user_id: userId, post_ids: [id] }
  );

  if (hookerror) return res.status(500).json({ error: hookerror.message });

  // add isLiked and isReposted to posts and set them true or false  hook={ liked: [ 100, 91 ], reposted: [ 99 ] }
  data.isLiked = hook.liked.includes(data.id);
  data.isReposted = hook.reposted.includes(data.id);

  res.json([data]);
};

// POST /posts
const createPost = async (req, res) => {
  const { caption } = req.body;
  let dimensions = [];
  if (req.body.dimensions) dimensions = JSON.parse(req.body.dimensions);
  const { id: userId } = req.user;
  const { files: media } = req;
  let isError = false;

  // * create the post
  const { data, error } = await supabase
    .from("post")
    .insert([
      {
        user_id: userId,
        caption,
        published: media.length > 0 ? false : true,
      },
    ])
    .select(
      `*, user:profiles(id, name, username, profile_url), likes: like(user_id), comments: comment(user_id), reposts: repost(user_id), content(*)`
    );
  if (error) return res.status(500).json({ error: error.message });

  // pass caption, userId, and postId to the extractHashtags function
  extractHashtags(caption, userId, data[0].id);

  // count the likes comments and resposts of the data
  data[0].isLiked = false;
  data[0].isReposted = false;
  data[0].likes = data[0].likes.length;
  data[0].comments = data[0].comments.length;
  data[0].reposts = data[0].reposts.length;

  if (!media || media.length === 0) {
    // send notification to post owner
    await supabase.from("notifications").insert([
      {
        sender_id: userId,
        receiver_id: data[0].user_id,
        type: "system",
        post_id: data[0].id,
        system_message: "post has been published",
      },
    ]);
    SendNotification({
      type: "post_published",
      senderId: userId,
      receiverId: data[0].user_id,
    });
    res.status(201).json(data);

    // get mentioned users in caption
    let mentionedUsers = caption.match(/@\w+/g);
    // remove dublicates
    mentionedUsers = [...new Set(mentionedUsers)];
    // get the ids of the mentioned users
    let { data: mentionedUsersData, error: mentionedUsersError } =
      await supabase
        .from("profiles")
        .select("id")
        .in(
          "username",
          mentionedUsers.map((user) => user.slice(1))
        );
    if (mentionedUsersError) return;

    // send notification to mentioned users
    mentionedUsersData.map(async (user) => {
      if (user.id === userId) return;
      await supabase.from("notifications").insert([
        {
          sender_id: userId,
          receiver_id: user.id,
          type: "mentionPost",
          post_id: data[0].id,
        },
      ]);
      SendNotification({
        type: "post_mention",
        senderId: userId,
        receiverId: user.id,
      });
    });
    return;
  }

  // else if there is media files then send a resonse before creating the media
  res.status(201).json(data);

  // * create the media
  // loop through the media files and check if the file is a video or image

  const child = fork("helpers/video.js"); // compress video in a child process
  try {
    for (const [index, file] of media.entries()) {
      if (isError) break;
      if (file.mimetype.toString().startsWith("image")) {
        let width = dimensions[index]?.width || 500,
          height = dimensions[index]?.height || 500;
        let buffer = file.buffer;
        let format = file.mimetype.toString().split("/")[1];

        // if file is heic convert it to jpeg
        if (
          file.mimetype.toString() === "image/heic" ||
          file.mimetype.toString() === "image/heif"
        ) {
          buffer = await convert({
            buffer,
            format: "JPEG",
          });
          format = "jpeg";
        }

        /* If the file size is greater than 10,000,000 bytes (10MB), the quality is set to 80. If the file size is
        less than 1,000,000 bytes (1MB), the quality is set to 100. Otherwise, the quality is set to
        88. This is done to balance the image quality and file size, so that larger images have
        lower quality to reduce their size, while smaller images have higher quality to maintain
        their details. */
        let quality =
          file.size > 10000000 ? 80 : file.size < 1000000 ? 100 : 88;
        let hasBeenFlipped = false;
        // if the file is not a gif then compress it
        if (file.mimetype.toString() !== "image/gif") {
          await sharp(buffer)
            .jpeg({ mozjpeg: true, quality: quality, force: false })
            .png({ quality: quality, force: false })
            .toBuffer({ resolveWithObject: true })
            .then(({ data, info }) => {
              if (info.width === height && info.height === width) {
                hasBeenFlipped = true;
                return;
              } else {
                buffer = data;
                format = info.format;
              }
            })
            .catch(() => {});
        } else if (file.mimetype.toString() === "image/gif") {
          await sharp(buffer, { animated: true })
            .resize(200)
            .toBuffer({ resolveWithObject: true })
            .then(({ data, info }) => {
              buffer = data;
              format = info.format;
            })
            .catch(() => {});
        }

        // create blurhash
        const { data: sharpBuffer, info } = await sharp(buffer)
          .resize(500)
          .ensureAlpha()
          .raw()
          .toBuffer({
            resolveWithObject: true,
          });

        const blurhash = encode(sharpBuffer, info.width, info.height, 3, 3);

        // create the media with type image
        const { data: media, error } = await supabase
          .from("content")
          .insert([
            {
              post_id: data[0].id,
              type: "image",
              width,
              height,
              blurhash,
              format,
            },
          ])
          .select("id")
          .single();

        if (error) {
          isError = true;
          break;
        }

        await axios
          .put(
            `${process.env.Image_Upload_Url}/${media.id}.${format}`,
            buffer,
            {
              headers: {
                AccessKey: process.env.Image_Upload_Access_Key,
                "Content-Type": "application/octet-stream",
              },
            }
          )
          .then(async () => {
            // update status to published
            await supabase
              .from("content")
              .update({ status: "published" })
              .eq("id", media.id);
          })
          .catch(async () => {
            isError = true;
            await supabase
              .from("content")
              .update({ status: "error" })
              .eq("id", media.id);
          });
      } else if (file.mimetype.toString().startsWith("video")) {
        let width = dimensions[index]?.width || 500,
          height = dimensions[index]?.height || 500;
        let buffer = file.buffer;
        const originalFileName = file.originalname;

        tmp.file(
          { postfix: path.extname(originalFileName) },
          (err, tempFilePath, fd, cleanupCallback) => {
            if (err) {
              isError = true;
              return;
            }
            tmp.file(
              { postfix: path.extname(originalFileName) },
              (err, finalFile, fd, cleanupCallbackNew) => {
                if (err) {
                  isError = true;
                  return;
                }
                fs.writeFile(tempFilePath, buffer, (err) => {
                  if (err) {
                    isError = true;
                    return;
                  } else {
                    const baseUrl = "https://video.bunnycdn.com/library/";
                    const createOptions = {
                      method: "POST",
                      url: `${baseUrl}${process.env.Video_Upload_ID}/videos`,
                      headers: {
                        AccessKey: process.env.Video_Upload_Access_Key,
                        "Content-Type": "application/json",
                      },
                      data: { title: `${userId}.${"mp4"}` },
                    };
                    axios
                      .request(createOptions)
                      .then(async (response) => {
                        // create the media with type video
                        const { error } = await supabase
                          .from("content")
                          .insert([
                            {
                              id: response.data.guid,
                              post_id: data[0].id,
                              type: "video",
                              width,
                              height,
                            },
                          ])
                          .select("id")
                          .single();
                        if (error) {
                          isError = true;
                          return;
                        }
                        // upload video
                        child.send({
                          path: tempFilePath,
                          post_id: data[0].id,
                          userId,
                          newFile: finalFile,
                          width,
                          height,
                          guid: response.data.guid,
                        });
                      })
                      .catch(() => {
                        isError = true;
                      });
                  }
                });
              }
            );
          }
        );
      }
    }
  } catch (error) {
    isError = true;
  }

  child.on("message", (message) => {
    const { statusCode } = message;
    if (statusCode !== 200) {
      isError = true;
      return;
    }
  });

  /*check if there are any items in the `media` array whose `mimetype` property
  starts with the string "video". If there are no such items, it updates the `published` property of
  the first item in the `post` table of a Supabase database to `true`. */
  if (!media.some((item) => item.mimetype.startsWith("video")) && !isError) {
    await supabase
      .from("post")
      .update({ published: true })
      .eq("id", data[0].id);

    // send notification to post owner
    await supabase.from("notifications").insert([
      {
        sender_id: userId,
        receiver_id: data[0].user_id,
        type: "system",
        post_id: data[0].id,
        system_message: "post has been published",
      },
    ]);
    SendNotification({
      type: "post_published",
      senderId: userId,
      receiverId: data[0].user_id,
    });

    // get mentioned users in caption
    let mentionedUsers = caption.match(/@\w+/g);
    // remove dublicates
    mentionedUsers = [...new Set(mentionedUsers)];

    // get the ids of the mentioned users
    let { data: mentionedUsersData, error: mentionedUsersError } =
      await supabase
        .from("profiles")
        .select("id")
        .in(
          "username",
          mentionedUsers.map((user) => user.slice(1))
        );
    if (mentionedUsersError) return;

    // send notification to mentioned users
    mentionedUsersData.map(async (user) => {
      if (user.id === userId) return;

      await supabase.from("notifications").insert([
        {
          sender_id: userId,
          receiver_id: user.id,
          type: "mentionPost",
          post_id: data[0].id,
        },
      ]);
      SendNotification({
        type: "post_mention",
        senderId: userId,
        receiverId: user.id,
      });
    });
  } else if (isError) {
    // set post published to null
    await supabase
      .from("post")
      .update({ published: null })
      .eq("id", data[0].id);
  }
};

// PATCH /posts/:id
const updatePost = async (req, res) => {
  const { id } = req.params;
  const { caption } = req.body;

  const { data, error } = await supabase
    .from("post")
    .update({ caption })
    .match({ id: id })
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

// DELETE /posts/:id
const deletePost = async (req, res) => {
  const { id: postId } = req.params;
  const { id: userId } = req.user;

  // get id of the user who created the post
  const { data: post, error } = await supabase
    .from("post")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (error) return res.status(500).json({ error: "no post found" });

  // check if the user is the owner of the post
  if (post.user_id !== userId) {
    return res
      .status(403)
      .json({ error: "You are not allowed to delete this post" });
  }

  // delete the post
  const { data, error: deleteError } = await supabase
    .from("post")
    .delete()
    .select("content(type,id,format)")
    .eq("id", postId);

  if (deleteError)
    return res.status(500).json({ error: "Something went wrong" });

  res.status(204).send();

  // delete the content of the post
  try {
    data[0].content.map((item) => {
      if (item.type === "video") {
        const baseUrl = "https://video.bunnycdn.com/library/";
        let libraryId = process.env.Video_Upload_ID;
        const createOptions = {
          method: "DELETE",
          url: `${baseUrl}${libraryId}/videos/${item.id}`,
          headers: {
            AccessKey: process.env.Video_Upload_Access_Key,
            "Content-Type": "application/json",
          },
        };
        axios
          .request(createOptions)
          .then(function (response) {})
          .catch(function (error) {});
      } else {
        const options = {
          method: "DELETE",
          url: `https://ny.storage.bunnycdn.com/momenel/posts/${item.id}.${item.format}`,
          headers: { AccessKey: process.env.Image_Upload_Access_Key },
        };
        axios
          .request(options)
          .then(function (response) {})
          .catch(function (error) {});
      }
    });
  } catch (error) {}
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
