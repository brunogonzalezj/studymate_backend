import { Router } from 'express';
import { subirDocumentoPDF, generarResumen, obtenerDocumentoPorId } from './documents.controller';
import { upload } from '../../config/multer';
import { obtenerTodosLosDocumentos } from './documents.controller';
import { obtenerMisDocumentos } from './documents.controller';
import { obtenerDocumentosPorEstudiante } from './documents.controller';
import { obtenerFlashcardsPorEstudiante } from './documents.controller';



const router = Router();

router.post('/upload', upload.single('archivo'), subirDocumentoPDF);
router.post('/generate-summary', generarResumen);
router.get('/', obtenerTodosLosDocumentos);
router.get('/mis-documentos', obtenerMisDocumentos);
router.get('/mis-documentos/:estudianteId', obtenerDocumentosPorEstudiante);
router.get('/mis-flashcards/:estudianteId', obtenerFlashcardsPorEstudiante);



// 🔁 ESTA VA AL FINAL
router.get('/:id', obtenerDocumentoPorId);

console.log({ subirDocumentoPDF, generarResumen, obtenerDocumentoPorId });

export default router;
