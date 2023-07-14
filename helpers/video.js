import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import axios from "axios";
import supabase from "../supabase/supabase.js";

process.on("message", (payload) => {
  const { path, userId, post_id, newFile, width, height, guid } = payload;

  const endProcess = (endPayload) => {
    const { statusCode, text } = endPayload;
    // Remove temp file

    fs.unlink(path, (err) => {
      if (err) {
        process.send({ statusCode: 500, text: err.message, post_id: post_id });
      }
    });
    // Format response so it fits the api response
    process.send({ statusCode, text, post_id: post_id });
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
        //* upload video
        const baseUrl = "https://video.bunnycdn.com/library/";
        axios
          .put(
            `${baseUrl}${process.env.Video_Upload_ID}/videos/${guid}`,
            data,
            {
              headers: {
                AccessKey: process.env.Video_Upload_Access_Key,
                "Content-Type": "application/octet-stream",
              },
            }
          )
          .then((response) => {
            endProcess({ statusCode: 200, text: "Success" });
          })
          .catch(async (error) => {
            await supabase
              .from("content")
              .update({ status: "error" })
              .eq("id", guid);
            endProcess({ statusCode: 500, text: "upload error" });
          });
      });
    })
    .on("error", (err) => {
      endProcess({ statusCode: 500, text: err.message });
    })
    .saveToFile(newFile);
});

process.on("uncaughtException", (err) => {
  process.exit(1);
});
