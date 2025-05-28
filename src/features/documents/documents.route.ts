import { Router } from 'express';
import { subirDocumentoPDF, generarResumen, obtenerDocumentoPorId } from './documents.controller';
import { upload } from '../../config/multer';
import { obtenerTodosLosDocumentos } from './documents.controller';

const router = Router();

router.post('/upload', upload.single('archivo'), subirDocumentoPDF);
router.post('/generate-summary', generarResumen);
router.get('/', obtenerTodosLosDocumentos);

// 🔁 ESTA VA AL FINAL
router.get('/:id', obtenerDocumentoPorId);

console.log({ subirDocumentoPDF, generarResumen, obtenerDocumentoPorId });

export default router;
