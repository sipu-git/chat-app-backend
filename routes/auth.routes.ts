import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import type { IUser } from "../models/user.model";

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `http://localhost:3000/login`,
  }),
  (req: Request, res: Response) => {
    const user = req.user as unknown as IUser;

    const accessToken = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET!,
      { expiresIn: "2h" }
    );

    return res.redirect(
      `http://localhost:3000/auth/callback?token=${accessToken}`
    );
  }
);

export default router;
