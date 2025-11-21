import { Server } from "socket.io";
import http from "http";
import express from "express";
import Chat from "../models/chat.model";

const app = express();
const server = http.createServer(app);

// Create Socket.IO instance
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Store userId → socketId
const userSockets: Record<string, string> = {};

// Helper function to get socketId of a user
export function receiverSocketId(userId: string) {
  return userSockets[userId];
}

// New user connection
io.on("connection", (socket) => {
  console.log("New User connected:", socket.id);

  // Get userId from handshake query
  const rawId = socket.handshake.query.userId;
  const userId = typeof rawId === "string" ? rawId : undefined;

  if (userId) {
    userSockets[userId] = socket.id;
  }

  // Send active users list
  io.emit("getActiveUsers", Object.keys(userSockets));

  socket.on("sendMessage", async (msg) => {
    try {
      let savedMsg = await Chat.create({
        ...msg,
        status: "sent",
      });

      const receiverSocket = userSockets[msg.receiverId];
      const senderSocket = userSockets[msg.senderId];

      if (receiverSocket) {
        savedMsg.status = "delivered";
        await savedMsg.save();

        io.to(receiverSocket).emit("newMessage", savedMsg);
        if (senderSocket) {
          io.to(senderSocket).emit("messageDelivered", savedMsg);
        }
      } else {
        if (senderSocket) {
          io.to(senderSocket).emit("newMessage", savedMsg);
        }
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (userId) {
      delete userSockets[userId];
    }

    io.emit("getActiveUsers", Object.keys(userSockets));
  });
});

export { io, server, app };
