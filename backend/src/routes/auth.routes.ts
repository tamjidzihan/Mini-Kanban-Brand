import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  searchUsers,
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { avatarUploadMiddleware } from '../middlewares/avatarUpload.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.get('/users', authenticateToken, searchUsers);
router.patch('/profile', authenticateToken, avatarUploadMiddleware, updateProfile);
router.patch('/change-password', authenticateToken, changePassword);

export default router;
