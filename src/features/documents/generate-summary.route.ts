import { Router } from 'express';
import { generarResumen } from './documents.controller';

const router = Router();

router.post('/generate-summary', generarResumen);

export default router;
