import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import axios from "axios";
import supabase from "../supabase/supabase.js";

process.on("message", (payload) => {
  const { path, userId, post_id, newFile, width, height } = payload;
  console.log("video child");
  const endProcess = (endPayload) => {
    const { statusCode, text } = endPayload;
    // Remove temp file

    fs.unlink(path, (err) => {
      if (err) {
        process.send({ statusCode: 500, text: err.message });
      }
    });
    // Format response so it fits the api response
    process.send({ statusCode, text });
    // End process
    process.exit();
  };

  // Process video and send back the result
  ffmpeg(path)
    .setFfmpegPath(ffmpegPath.path)
    .toFormat("mp4")
    .fps(30)
    .addOptions(["-crf 38"])
    .on("start", () => {})
    .on("end", async (e) => {
      // covert newFile to base64
      fs.readFile(newFile, function (err, data) {
        const baseUrl = "https://video.bunnycdn.com/library/";
        let libraryId = process.env.Video_Upload_ID;
        const createOptions = {
          method: "POST",
          url: `${baseUrl}${libraryId}/videos`,
          headers: {
            AccessKey: "83cb2977-bab2-48ff-a8365d239ec5-4a70-43e0",
            "Content-Type": "application/json",
          },
          data: { title: `${userId}.${"mp4"}` },
        };
        axios
          .request(createOptions)
          .then(async (response) => {
            // create the media with type video
            const { data: media, error } = await supabase
              .from("content")
              .insert([
                {
                  id: response.data.guid,
                  post_id: post_id,
                  type: "video",
                  width,
                  height,
                },
              ])
              .select("id")
              .single();
            if (error) return;
            //* upload video
            axios
              .put(
                `${baseUrl}${libraryId}/videos/${response.data.guid}`,
                data,
                {
                  headers: {
                    AccessKey: "83cb2977-bab2-48ff-a8365d239ec5-4a70-43e0",
                    "Content-Type": "application/octet-stream",
                  },
                }
              )
              .then((response) => {
                endProcess({ statusCode: 200, text: "Success" });
              })
              .catch(async (error) => {
                //todo: send error notification
                //todo: delete video from bunnycdn
                await supabase
                  .from("content")
                  .update({ status: "error" })
                  .eq("id", response.data.guid);
                endProcess({ statusCode: 500, text: "upload error" });
              });
          })
          .catch(async (error) => {
            await supabase
              .from("content")
              .insert([
                {
                  status: "error",
                  post_id: post_id,
                  type: "video",
                  width,
                  height,
                },
              ])
              .select("id")
              .single();

            endProcess({ statusCode: 500, text: "uplaod error 2" });
          });
      });
    })
    .on("error", (err) => {
      endProcess({ statusCode: 500, text: err.message });
    })
    .saveToFile(newFile);
});
