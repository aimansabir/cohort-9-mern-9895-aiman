import { Router } from 'express';

import { getMe, postLogin, postLogout, postSignup } from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/signup', postSignup);
router.post('/login', postLogin);

// Logout is authenticated so the action can be attributed to a user in the
// activity log, even though no server-side session is being ended.
router.post('/logout', authenticate, postLogout);
router.get('/me', authenticate, getMe);

export default router;
