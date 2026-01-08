import type { Request, Response } from "express";
import { generateImageUrl } from "../utils/s3";

export const viewImage = async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;

    if (!key) {
      return res.status(400).json({ message: "File key is required!" });
    }

    const url = await generateImageUrl(key);

    return res.status(200).json({
      success: true,
      url,
    });
  } catch (error) {
    console.error("S3 view error:", error);
    return res.status(500).json({
      message: "Failed to generate view URL due to technical issue!",
    });
  }
};
