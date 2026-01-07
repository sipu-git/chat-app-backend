import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { s3 } from "../configs/uploadMedias";

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

export const deleteImgaeObject = async (key:string)=>{
  if (!key) return
  const command = new DeleteObjectCommand({
    Bucket:process.env.AWS_BUCKET_NAME!,
    Key:key
  })
  await s3.send(command)
}