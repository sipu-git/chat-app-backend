import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/user.routes';
import { connectDB } from './configs/db';
import chatRoutes from './routes/chat.routes';
import authRoutes from './routes/auth.routes';
import passport from 'passport';
import "./configs/passport";
import { initSocket } from "./configs/socket";
import http from 'http';

const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: ['http://localhost:3000','http://ec2-13-233-23-20.ap-south-1.compute.amazonaws.com', 'https://chat-app-frontend-sooty-six.vercel.app'],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize())
app.use(express.urlencoded({ extended: true }))
connectDB();

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes)
const PORT = process.env.PORT || 4000;
initSocket(server)
server.listen(PORT, () => console.log(`Server and socket running on ${PORT}`));
