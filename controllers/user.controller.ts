import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import cloudinary from "../configs/uploadMedias";
// import { Request, Response } from "express";
import streamifier from "streamifier";
import User from "../models/user.model";
import jwt, { type Jwt, type JwtPayload, type Secret, type SignOptions } from 'jsonwebtoken';

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { username, email, phone, password } = req.body;
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
        if (!req.file) {
            console.log("No file received!");
            return res.status(400).json({ message: "Profile image is required!" });
        }
        console.log("Incoming file details:", req.file);
        console.log("☁️ Uploading image to Cloudinary...");

        const uploadImage: any = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: process.env.CLOUDINARY_API_FOLDER || 'chat-web-app' },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary upload error:", error);
                        reject(error);
                    } else {
                        console.log("Cloudinary upload result:", result);
                        resolve(result);
                    }
                }
            );

            streamifier.createReadStream(req.file!.buffer).pipe(uploadStream);
        });
        const fetchUsers = await User.findOne({ $or: [{ email }, { phone }] });
        if (fetchUsers) {
            return res.status(409).json({ message: "User with given email or phone or username already exists!" });
        }
        const addUser = await User.create({
            username,
            email,
            phone,
            profilePic: uploadImage.secure_url,
            password: hashedPassword,
        });
        res.status(201).json({
            message: "User registered successfully!", user: addUser
        })
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
}

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validate fields
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are mandatory!" });
        }

        // Check if user exists
        const findUser = await User.findOne({ email });
        if (!findUser) {
            return res.status(404).json({ message: "User not found!" });
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, findUser.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials!" });
        }
         findUser.lastLogin = new Date();
        await findUser.save();
        // Generate JWT Token
        const token = jwt.sign(
            {
                id: findUser._id,
                email: findUser.email,
                username: findUser.username,
                profilePic: findUser.profilePic
            },
            process.env.JWT_SECRET || "default_secret",
            { expiresIn: "1d" }
        );

        // Optional: Set token cookie
        res.cookie("authToken", token, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Successful login response
        return res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                id: findUser._id,
                username: findUser.username,
                email: findUser.email,
                phone: findUser.phone,
                profilePic: findUser.profilePic,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};

export const viewProfile = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        const token = req.cookies?.token || (authHeader && authHeader.split(" ")[1]);
         const decodedToken = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload & { id: string };
        const fetchUser = await User.findById(decodedToken.id)
        if (!fetchUser) {
            return res.status(404).json({ message: "User doesn't exist!" })
        }
        return res.status(200).json({
            message: "User profile fetched successfully!",
            user: {
                id: fetchUser._id,
                username: fetchUser.username,
                email: fetchUser.email,
                phone: fetchUser.phone,
                profilePic: fetchUser.profilePic},
        });
    } catch (error) {
        console.error("Login failed:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
}