import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import User from "../models/user.model";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { deleteImageObject, uploadProfileImage } from "./media.controller";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, email, phone, password, description } = req.body;
    const emailCheck = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneCheck = /^[6-9]\d{9}$/;
    const passwordCheck = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!username || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are mandatory!" })
    }
    if (!emailCheck.test(email)) {
      return res.status(401).json({ message: "Invaild email address!" })
    }
    if (!phoneCheck.test(phone)) {
      return res.status(401).json({ messaage: "Invalid phone number!" })
    }
    if (!passwordCheck.test(password)) {
      return res.status(401).json({ message: "Invalid password format!" })
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const fetchUsers = await User.findOne({ $or: [{ email }, { phone }] });
    if (fetchUsers) {
      return res.status(409).json({ message: "User with given email or phone or username already exists!" });
    }
    const addUser = await User.create({
      username,
      email,
      phone,
      description,
      password: hashedPassword,
      provider: "local"
    });
    if (req.file) {
      console.log("Uploading the image to the AWS S3 Bucket...");
      const fileKey = await uploadProfileImage(req.file, addUser._id.toString())
      addUser.profilePic = fileKey;
      await addUser.save()
      console.log("Image uploaded to S3 with key:", fileKey);
    }

    return res.status(201).json({
      message: "User registered successfully!", user: {
        id: addUser._id,
        description: addUser.description,
        username: addUser.username,
        email: addUser.email,
        profilePic: addUser.profilePic,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
}

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are mandatory!" });
    }

    const findUser = await User.findOne({ email });
    if (findUser?.provider === "google") {
      return res.status(400).json({ message: "Please login with google" })
    }
    if (!findUser) {
      return res.status(404).json({ message: "User not found!" });
    }
    if (!findUser.password) {
      return res.status(400).json({
        message: "Password login not available for this account",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, findUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    findUser.isOnline = true;
    findUser.lastLogin = new Date();
    await findUser.save();

    const accessToken = jwt.sign(
      { id: findUser._id },
      process.env.JWT_SECRET!,
      { expiresIn: "2h" }
    );

    const refreshToken = jwt.sign(
      { id: findUser._id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "30d" }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      message: "Login successful!",
      accessToken,
      user: {
        id: findUser._id,
        username: findUser.username,
        email: findUser.email,
        description: findUser.description,
        phone: findUser.phone,
        isOnline: findUser.isOnline,
        profilePic: findUser.profilePic,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const removeProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.profilePic) {
      return res.status(400).json({ message: "No profile image to remove" });
    }
    await deleteImageObject(user.profilePic);
    user.profilePic = undefined;
    await user.save();

    return res.status(200).json({
      message: "Profile image removed successfully",
    });
  } catch (error) {
    console.error("Remove profile image error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const viewProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized!" })
    }
    const fetchUser = await User.findById(userId).select(
      "_id username email phone profilePic isOnline"
    );

    if (!fetchUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User profile fetched successfully",
      user: {
        id: fetchUser._id,
        username: fetchUser.username,
        email: fetchUser.email,
        phone: fetchUser.phone,
        isOnline: fetchUser.isOnline,
        profilePic: fetchUser.profilePic,
      },
    });
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ message: "Internal server error!" });
  }
};

export const viewProfileById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized!" })
    }
    const { id } = req.params;
    const user = await User.findById(id).select(
      "_id username email phone profilePic isOnline"
    )
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
}

export const fetchUsers = async (req: Request, res: Response) => {
  try {
    const findUsers = await User.find({}, {
      password: 0, _v: 0,
    }).sort({ isOnline: -1 });

    if (!findUsers || findUsers.length === 0) {
      return res.status(404).json({ message: "No users found!" })
    }
    return res.status(200).json({
      message: "Users fetched successfully!",
      users: findUsers
    })
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
}