import mongoose from "mongoose";

export interface IUser {
  username: string;
  email: string;
  phone: string;
  profilePic: string;
  isOnline: boolean;
  password: string;
  lastLogin: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    username: { type: String, required: true,trim:true },   
    email: { type: String, required: true, lowercase:true,trim:true, unique: true },
    phone: { type: String, required: true,trim:true, unique: true },
    profilePic: { type: String,trim:true, default: "" },
    isOnline: { type: Boolean, default: false },
    password: { type: String,trim:true, required: true },
    lastLogin:{ type: Date, default: Date.now }
    },
    { timestamps: true }
);

const User = mongoose.model<IUser>("User", userSchema);
export default User;