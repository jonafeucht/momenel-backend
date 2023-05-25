import supabase from "../supabase/supabase.js";

const getOptions = async (req, res) => {
  const { type } = req.params;

  const { data, error } = await supabase
    .from("report_options")
    .select("id, heading, description")
    .contains("type", [`${type}`])
    .order("index", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.send(data);
};

const handleReport = async (req, res) => {
  const { item_id, type, report_id } = req.params;
  const { id: userId } = req.user;
  const { reason } = req.body;

  console.log(
    type,
    "of report id",
    report_id,
    "and item id",
    item_id,
    "is reported by",
    userId,
    "for reason",
    reason
  );
  if (type === "post" || type === "comment") {
    // check if report already exists for this user and post/comment
    const { data, error } = await supabase
      .from("reports")
      .select("id")
      .eq("reporter_id", userId)
      .eq("type", type)
      .or(`reported_post_id.eq.${item_id},reported_comment_id.eq.${item_id}`);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (data.length > 0) {
      return res.status(400).json({ error: "Already reported" });
    }
    // insert report
    const { data: reportData, error: reportError } = await supabase
      .from("reports")
      .insert([
        {
          reporter_id: userId,
          type: type,
          reported_post_id: type === "post" ? item_id : null,
          reported_comment_id: type === "comment" ? item_id : null,
          description: reason,
          report_option_id: report_id,
        },
      ]);
    if (reportError) {
      console.log(reportError);
      return res.status(500).json({ error: reportError.message });
    }
    console.log(reportData);
  } else if (type === "profile") {
    // check if report already exists for this user and post/comment
    const { data, error } = await supabase
      .from("reports")
      .select("id")
      .eq("reporter_id", userId)
      .eq("reported_profile_id", item_id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (data.length > 0) {
      return res.status(400).json({ error: "Already reported" });
    }
    // insert report
    const { data: reportData, error: reportError } = await supabase
      .from("reports")
      .insert([
        {
          reporter_id: userId,
          type: "profile",
          reported_profile_id: item_id,
          description: reason,
          report_option_id: report_id,
        },
      ]);
    if (reportError) {
      console.log(reportError);
      return res.status(500).json({ error: reportError.message });
    }
    console.log(reportData);
  } else {
    return res.status(400).json({ error: "Something went wrong." });
  }

  res.send("Reported");
};

export { getOptions, handleReport };
