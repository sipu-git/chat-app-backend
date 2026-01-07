import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import Chat from "../models/chat.model";

let io: Server;

const userSockets: Record<string, Set<string>> = {};

export function receiverSocketId(userId: string): string[] {
  return userSockets[userId]
    ? Array.from(userSockets[userId])
    : [];
}

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as { id: string };

      socket.data.userId = decoded.id;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.data.userId;

    if (!userSockets[userId]) userSockets[userId] = new Set();
    userSockets[userId].add(socket.id);

    await User.findByIdAndUpdate(userId, { isOnline: true });

    socket.on("sendMessage", async (msg) => {
      const savedMsg = await Chat.create({
        senderId: userId,
        receiverId: msg.receiverId,
        message: msg.message,
        status: "sent",
      });

      const receiverSockets = userSockets[msg.receiverId];
      if (receiverSockets) {
        savedMsg.status = "delivered";
        await savedMsg.save();

        receiverSockets.forEach((sid) => {
          io.to(sid).emit("newMessage", savedMsg);
        });
      }
    });

    socket.on("messageSeen", async ({ senderId }) => {
      await Chat.updateMany(
        { senderId, receiverId: userId },
        { status: "seen", isRead: true }
      );

      const senderSockets = userSockets[senderId];
      senderSockets?.forEach((sid) => {
        io.to(sid).emit("messagesSeen", { receiverId: userId });
      });
    });

    socket.on("disconnect", async () => {
      userSockets[userId]?.delete(socket.id);
      if (userSockets[userId]?.size === 0) {
        delete userSockets[userId];
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
      }
    });
  });

  return io;
};

export { io };
