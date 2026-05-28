import { Router } from 'express';
import authController from '../controllers/auth.controller.ts';

const router = Router();

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/signout', authController.signout);
router.post('/refresh', authController.refreshToken);

export default router;
