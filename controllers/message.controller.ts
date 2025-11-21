import type { Request, Response } from "express";
import Chat from "../models/chat.model";
import { receiverSocketId } from "../configs/socket";
import { io } from "../configs/socket"; 
import type { AuthRequest } from "../middlewares/auth.middleware";
import type { IUser } from "../models/user.model";

export const createChat = async (req: AuthRequest, res: Response) => {
  try {
    // user id extracted from verifyToken middleware
    const senderId = req.user?.id;
    if (!senderId) {
      return res.status(401).json({ message: "Unauthorized - No user ID found" });
    }

    const { message } = req.body;
    const { id: receiverId } = req.params;

    if (!message || !receiverId) {
      return res.status(400).json({ message: "Message & receiverId are required" });
    }

    // save the chat
    const newChat = await Chat.create({
      senderId,
      receiverId,
      message,
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


export const getChats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized - No user ID found" });
    }

    const { id: receiverId } = req.params;

    const findChats = await Chat.find({
      $or: [
        { senderId: userId, receiverId },
        { senderId: receiverId, receiverId: userId },
      ],
    })
      .populate<{ senderId: IUser }>("senderId", "isOnline username profilePic")
      .populate<{ receiverId: IUser }>("receiverId", "isOnline username profilePic")
      .sort({ createdAt: 1 });

    if (!findChats || findChats.length === 0) {
      return res.status(404).json({ message: "No chats found" });
    }

    // Format response
    const formattedChats = findChats.map((chat) => ({
      _id: chat._id,
      message: chat.message,
      isRead: chat.isRead,
      timestamps: chat.timestamps,
      senderId: chat.senderId,
      receiverId: chat.receiverId,
      senderOnline: (chat.senderId as IUser).isOnline ?? false,
      receiverOnline: (chat.receiverId as IUser).isOnline ?? false,
    }));

    return res.status(200).json({ chats: formattedChats });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
