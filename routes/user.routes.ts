import express from 'express';
import multer from 'multer';
import { registerUser } from '../controllers/user.controller';

const router = express.Router();
const upload = multer({storage: multer.memoryStorage()});

router.post('/register', upload.single('profilePic'), registerUser);
export default router;