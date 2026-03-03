module.exports = async function handler(req, res) {
  return res.status(200).json({
    updatedAt: new Date().toISOString(),
    picks: [
      "PJ Washington over 15pts.",
      "Lakers ML",
      "Celtics -4.5"
    ]
  });
};
