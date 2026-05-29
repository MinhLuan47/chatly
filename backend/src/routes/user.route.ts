import { Router } from 'express';
import userController from '../controllers/user.controller';
import { upload } from '../middlewares/upload.middleware';
const router = Router();

router.get('/me', userController.authMe);
router.get('/search', userController.searchUserByUserName);
router.post('/uploadAvatar', upload.single('file'), userController.uploadAvatar);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);
export default router;
