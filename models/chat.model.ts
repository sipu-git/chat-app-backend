import mongoose, { Types } from "mongoose";
import type { IUser } from "./user.model";

export interface IChat {
    senderId: mongoose.Types.ObjectId | IUser;
    receiverId: mongoose.Types.ObjectId | IUser;
    message: string;
    mediaKey?: string;
    mediaType?: "image";
    isRead: boolean;
    status?: "sent" | "delivered" | "seen";
    createdAt: Date;
    updatedAt: Date;
}

const chatSchema = new mongoose.Schema<IChat>(
    {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        mediaKey: { type: String },
        mediaType: {
            type: String,
            enum: ["image"],
            default: null,
        }, message: { type: String, required: true, trim: true },
        isRead: { type: Boolean, default: false },
        status: { type: String, enum: ["sent", "delivered", "seen"], default: "sent" },
    },
    { timestamps: true }
);
const Chat = mongoose.model<IChat>("Chat", chatSchema);
export default Chat;
