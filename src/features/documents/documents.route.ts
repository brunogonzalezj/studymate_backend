import { Router } from 'express';
import {
    subirDocumentoPDF,
    generarResumen,
    obtenerDocumentoPorId,
    obtenerResumenPorDocumento, obtenerFlashcardsPorDocumento
} from './documents.controller';
import { upload } from '../../config/multer';
import { obtenerTodosLosDocumentos } from './documents.controller';
import { obtenerMisDocumentos } from './documents.controller';
import { obtenerDocumentosPorEstudiante } from './documents.controller';



const router = Router();

router.post('/upload', upload.single('archivo'), subirDocumentoPDF);
router.post('/generate-summary', generarResumen);
router.get('/', obtenerTodosLosDocumentos);
router.get('/mis-documentos', obtenerMisDocumentos);
router.get('/documentos-usuario/:estudianteId', obtenerDocumentosPorEstudiante);
router.get('/flashcards/:documentoId', obtenerFlashcardsPorDocumento);
router.get('/resumen/:documentoId', obtenerResumenPorDocumento);



// 🔁 ESTA VA AL FINAL
router.get('/:id', obtenerDocumentoPorId);

console.log({ subirDocumentoPDF, generarResumen, obtenerDocumentoPorId });

export default router;
