import supabase from "../supabase/supabase.js";

const videoHook = async (req, res) => {
  let { VideoGuid, Status } = req.body;
  // set video status to ready if status is 3 or 4 and error if status is 5
  if (Status == 3 || Status == 4) {
    console.log("video ready");
    // set post status to ready if all post videos are processed
    let { data, error } = await supabase
      .from("content")
      .update({ status: "published" })
      .select("post_id")
      .eq("id", VideoGuid)
      .single();

    // check if all content for post is ready
    const { data: content, error: contentError } = await supabase
      .from("content")
      .select("status")
      .eq("post_id", data.post_id);

    if (contentError) return;

    let isPublished = true;
    content.forEach((item) => {
      if (item.status !== "published") isPublished = false;
    });

    // if all the content is published then update the post status to published
    if (isPublished) {
      const { data: post, error: postError } = await supabase
        .from("post")
        .update({ published: true })
        .eq("id", data.post_id);
      if (postError) return;
    }
  } else if (Status == 5) {
    await supabase
      .from("content")
      .update({ status: "error" })
      .eq("id", VideoGuid);

    //todo: send error notification
  }

  res.status(200).end(); // Responding is important
};

export { videoHook };
