import mongoose, { Types } from "mongoose";
import type { IUser } from "./user.model";

export interface IChat {
    senderId: mongoose.Types.ObjectId | IUser;
    receiverId: mongoose.Types.ObjectId | IUser;
    message: string;
    isRead: boolean;
    status?: string;
    timestamps: Date;
}

const chatSchema = new mongoose.Schema<IChat>(
    {
        senderId: { type: mongoose.Schema.Types.ObjectId, required: true, trim: true }, 
        receiverId: { type: mongoose.Schema.Types.ObjectId, required: true, trim: true },
        message: { type: String, required: true, trim: true },
        isRead: { type: Boolean, default: false },
        status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
        timestamps: { type: Date, default: Date.now }
    },
    { timestamps: true }
);  
const Chat = mongoose.model<IChat>("Chat", chatSchema);
export default Chat;
