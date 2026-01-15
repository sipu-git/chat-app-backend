import type { Request, Response } from "express";
import { generateImageUrl } from "../utils/s3";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../configs/uploadMedias";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export const uploadProfileImage = async (file: Express.Multer.File,userId: string) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new Error("Only image files are allowed");
  }

  const ext = file.mimetype.split("/")[1];

  const fileKey = `profile-images/${userId}-${crypto.randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  return fileKey;
};

export const uploadChatImages = async (file: Express.Multer.File, userId: string) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new Error("Only image files are allowed");
  }
  const ext = file.mimetype.split("/")[1];
  const fileKey = `chat-images/${userId}-${crypto.randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  });
  await s3.send(command)
  return fileKey
}

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

export const deleteImageObject = async (key:string)=>{
  if (!key) return
  const command = new DeleteObjectCommand({
    Bucket:process.env.AWS_BUCKET_NAME!,
    Key:key
  })
  await s3.send(command)
}
