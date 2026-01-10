import type { Request, Response } from "express";
import Chat from "../models/chat.model";
import { receiverSocketId } from "../configs/socket";
import { io } from "../configs/socket";
import type { IUser } from "../models/user.model";
import User from "../models/user.model";
import { uploadChatImages } from "../utils/s3Uploads";

export const createChat = async (req: Request, res: Response) => {
  try {
    const senderId = req.user?.id;
    if (!senderId) {
      return res.status(401).json({ message: "Unauthorized - No user ID found" });
    }

    const message = req.body?.messaage;
    const { id: receiverId } = req.params;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    if (!message) {
      return res.status(400).json({ message: "Message or image is required" });
    }

    let mediaKey: string | undefined;
    if (req.file) {
      mediaKey = await uploadChatImages(req.file, senderId)
    }

    const newChat = await Chat.create({
      senderId,
      receiverId,
      message: message || null,
      mediaKey: mediaKey || null,
      mediaType: mediaKey ? "image" : null,
      status: "sent",
    });

    // check if receiver is online
    const socketId = receiverSocketId(receiverId);
    if (socketId) {
      newChat.status = "delivered";
      await newChat.save();
      io.to(socketId).emit("newMessage", newChat);
    }

    return res.status(201).json({
      message: "Message sent successfully",
      chat: newChat,
    });
  } catch (error) {
    console.error("Error sending chat:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const getChats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id: receiverId } = req.params;
    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    const chats = await Chat.find({
      $or: [
        { senderId: userId, receiverId },
        { senderId: receiverId, receiverId: userId },
      ],
    })
      .populate<{ senderId: IUser }>("senderId", "username profilePic isOnline")
      .populate<{ receiverId: IUser }>("receiverId", "username profilePic isOnline")
      .sort({ createdAt: 1 });

    const formattedChats = chats.map((chat) => {
      const sender = chat.senderId as IUser;
      const receiver = chat.receiverId as IUser;

      const otherUser =
        sender._id.toString() === userId ? receiver : sender;

      return {
        _id: chat._id,
        message: chat.message,
        mediaKey: chat.mediaKey,
        mediaType: chat.mediaType,
        isRead: chat.isRead,
        status: chat.status,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,

        sender: {
          id: sender._id,
          username: sender.username,
          profilePic: sender.profilePic,
        },

        receiver: {
          id: receiver._id,
          username: receiver.username,
          profilePic: receiver.profilePic,
        },

        isOtherUserOnline: otherUser.isOnline ?? false,
      };
    });

    return res.status(200).json({ chats: formattedChats });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const searchApi = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const query = req.query.q as string;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!query || !query.trim()) {
      return res.status(200).json({
        users: [],
        messages: [],
      });
    }

    const users = await User.find({
      _id: { $ne: userId },
      username: { $regex: query, $options: "i" },
    }).select("_id username profilePic isOnline lastSeen");

    const messages = await Chat.find({
      $and: [
        {
          $or: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
        {
          message: { $regex: query, $options: "i" },
        },
      ],
    })
      .populate("senderId", "username profilePic")
      .populate("receiverId", "username profilePic")
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      users,
      messages,
    });
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

