export default async function handler(req, res) {
  // Allow GET so you can test in the browser (no more 404 confusion)
  return res.status(200).json({
    ok: true,
    message: "cron-daily endpoint is live ✅",
    time: new Date().toISOString(),
  });
}
