import mongoose from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  phone: string;
  profilePic?: string;
  description: string;
  isOnline: boolean;
  lastSeen?: Date;
  password: string;
  provider: "local" | "google";
  googleId?: string;
  lastLogin: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    phone: {
      type: String, trim: true, unique: true, sparse: true,
      required: function () {
        return this.provider === "local"
      }
    },
    profilePic: { type: String, trim: true, default: "", required: false },
    description: {
      type: String, required: false, default: "Hii! I am using Quick Chat"
    },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    password: {
      type: String, trim: true, required: function () {
        return this.provider === "local";
      }
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
      required: true
    },
    googleId: {
      type: String,
      sparse: true,
    },
    lastLogin: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", userSchema);
export default User;