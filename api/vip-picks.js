module.exports = (req, res) => {
  res.status(200).json({
    updatedAt: new Date().toISOString(),
    picks: [
      "Pj Washington over 15pts.",
      "Lakers ML",
      "Celtics -4.5"
    ]
  });
};
