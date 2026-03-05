export default async function handler(req, res) {
  const SWAMP_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";

  try {
    // For now return the mint so we confirm it loads correctly
    return res.status(200).json({ holders: 0, mint: SWAMP_MINT });
  } catch (e) {
    return res.status(200).json({ holders: 0, error: String(e?.message || e) });
  }
}
