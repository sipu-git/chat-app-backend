import express from "express";
import multer from "multer";

import {fetchUsers,loginUser,registerUser,removeProfileImage,viewProfile} from "../controllers/user.controller";
import { refreshToken } from "../controllers/refreshToken.controller";
import { verifyToken } from "../middlewares/auth.middleware";
import { viewImage } from "../controllers/media.controller";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/register", upload.single("profilePic"), registerUser);
router.post("/loginUser", loginUser);
router.post("/refresh-token", refreshToken);
router.get("/view-image",viewImage);
router.get("/get-users", fetchUsers);
router.get("/viewProfile",verifyToken,viewProfile);
router.delete("/delete-profile",verifyToken,removeProfileImage);
export default router;