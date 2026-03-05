const SWAMP_MINT = "GXnNG5q32mmcpVmNAKKUf1WTSqNxoVKJyho6jQT4pump";

export default async function handler(req, res) {
  try {
    return res.status(200).json({
      holders: 0,
      mint: SWAMP_MINT
    });
  } catch (e) {
    return res.status(200).json({
      holders: 0,
      error: String(e)
    });
  }
}
