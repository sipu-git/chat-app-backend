import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { createChat, getChats, searchApi } from '../controllers/message.controller';
import multer from 'multer';

const router = express.Router();
const upload = multer({
    storage:multer.memoryStorage(),
    limits:{
        fileSize:5*1024*1024
    }
})
router.post('/create-chat/:id',upload.single('image'),verifyToken,createChat);
router.get('/get-chats/:id',verifyToken,getChats);
router.get('/searchApi',verifyToken,searchApi)
export default router;