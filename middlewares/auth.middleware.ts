import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: JwtPayload & { id: string };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const headerToken =
      req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null;

    const token = req.cookies?.token || headerToken;

    if (!token) {
      return res.status(401).json({ message: "No token provided!" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET missing");

    const decoded = jwt.verify(token, secret) as JwtPayload & { id: string };
    req.user = decoded;

    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(403).json({ message: "Invalid or expired token!" });
  }
};
