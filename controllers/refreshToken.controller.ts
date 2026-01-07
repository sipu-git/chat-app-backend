import type { Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export const refreshToken = (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    ) as JwtPayload & { id: string };

    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" } 
    );

    return res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (err) {
    return res.status(401).json({
      message: "Refresh token expired or invalid",
    });
  }
};
