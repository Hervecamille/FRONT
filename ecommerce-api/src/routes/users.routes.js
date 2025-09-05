import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { changePasswordSchema, updateProfileSchema } from '../validators/auth.validators.js';
import { me, updateProfile, changePassword } from '../controllers/users.controller.js';

const router = Router();

router.get('/me', auth, me);
router.patch('/me', auth, validateBody(updateProfileSchema), updateProfile);
router.patch('/me/password', auth, validateBody(changePasswordSchema), changePassword);

export default router;
