import { Router } from 'express';
import { registerUser } from './users.controller';

const router = Router();

router.post('/register', registerUser);

export default router;
