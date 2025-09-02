const aiService = require("../services/ai.service");

module.exports.getReview = async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "code is required" });
  }

  const response = await aiService.generateText(code);
  console.log("response from controller:", response);
  res.send(response);
};
