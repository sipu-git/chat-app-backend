import type { Request } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export const extractUserIdFromCookie = (req: Request): string | null => {
  const token =
    req.cookies?.authToken ||
    req.cookies?.token ||
    req.headers.authorization?.split(" ")[1];

  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded.id as string;
  } catch (err) {
    console.error("JWT verification failed:", err);
    return null;
  }
};
