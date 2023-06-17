const videoHook = async (req, res) => {
  console.log("video hook");
  console.log(req.body); // Call your action on the request here
  res.status(200).end(); // Responding is important
};

export { videoHook };
