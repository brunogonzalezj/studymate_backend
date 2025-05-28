import {Request, Response} from 'express';
import fs from 'fs';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import {PrismaClient} from '../../generated/prisma';
import {crearDocumento} from './documents.service';

const prisma = new PrismaClient();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// 🔹 Subida de PDF y extracción de texto
export const subirDocumentoPDF = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = (req as any).file;
        if (!file) {
            res.status(400).json({error: 'No se envió ningún archivo PDF'});
            return;
        }

        const buffer = fs.readFileSync(file.path);
        const parsed = await pdfParse(buffer);

        const titulo = (req.body.titulo || file.originalname).replace('.pdf', '');
        const contenido = parsed.text;
        const materia = req.body.materia || 'General';
        const tema = req.body.tema || 'Sin tema';
        const estudianteId = parseInt(req.body.estudianteId);
        const documento = await crearDocumento(
            titulo,
            contenido,
            materia,
            tema,
            estudianteId
        );
        res.status(201).json(documento);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({error: 'Error al procesar el PDF', detalle: err.message});
    }
};

// 🔹 Generación de resumen y flashcards con OpenAI
export const generarResumen = async (req: Request, res: Response): Promise<void> => {
    try {
        const {id, tipo} = req.body;

        if (!id || !tipo) {
            res.status(400).json({error: 'Faltan campos obligatorios: id y tipo'});
            return;
        }

        const documento = await prisma.documento.findUnique({where: {id}});
        if (!documento) {
            res.status(404).json({error: 'Documento no encontrado'});
            return;
        }

        let prompt = '';
        let mode = tipo.toUpperCase();

        if (mode === 'EXTENDIDO') {
            prompt = 'Resumí el siguiente texto en español de forma detallada, incluyendo todos los conceptos importantes.';
        } else if (mode === 'CORTO') {
            prompt = 'Resumí el siguiente texto en español de forma breve, incluyendo solo ideas clave.';
        } else if (mode === 'FLASHCARDS') {
            prompt = `
Genera flashcards en formato JSON con al menos 5 pares pregunta/respuesta basados en el siguiente texto.

Formato:
{
  "flashcards": [
    {
      "question": "¿Pregunta 1?",
      "answer": "Respuesta 1"
    },
    ...
  ]
}

Texto:
${documento.contenido}
`;
        } else {
            res.status(400).json({error: 'Tipo inválido. Usa: EXTENDIDO, CORTO o FLASHCARDS.'});
            return;
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {role: 'system', content: prompt},
                {role: 'user', content: documento.contenido},
            ],
        });

        const result = completion.choices[0]?.message?.content || '';

        // --- Modo resumen largo/corto
        if (mode === 'EXTENDIDO' || mode === 'CORTO') {
            await prisma.resumen.create({
                data: {
                    contenido: result,
                    calidad: 0.8,
                    documentoId: id
                }
            });
            res.json({mensaje: 'Resumen generado', resumen: result});
        }

        // --- Modo flashcards
        if (mode === 'FLASHCARDS') {
            const clean = result.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(clean);
            const cards = parsed.flashcards;

            const creadas = await Promise.all(
                cards.map((card: any) =>
                    prisma.flashcard.create({
                        data: {
                            pregunta: card.question,
                            respuesta: card.answer,
                            documentoId: id,
                        },
                    })
                )
            );

            res.status(201).json({mensaje: 'Flashcards generadas', total: creadas.length, flashcards: creadas});
        }
    } catch (err: any) {
        console.error(err);
        res.status(500).json({error: 'Error al procesar el contenido', detalle: err.message});
    }
};

// 🔹 Listado general de documentos
export const obtenerTodosLosDocumentos = async (req: Request, res: Response): Promise<void> => {
    try {
        const documentos = await prisma.documento.findMany({
            orderBy: {fechaSubida: 'desc'}
        });

        res.json(documentos);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({error: 'Error al obtener documentos', detalle: err.message});
    }
};

export const obtenerDocumentoPorId = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            res.status(400).json({error: 'ID inválido'});
            return;
        }

        const documento = await prisma.documento.findUnique({
            where: {id},
        });

        if (!documento) {
            res.status(404).json({error: 'Documento no encontrado'});
            return;
        }

        res.json(documento);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({error: 'Error al obtener documento', detalle: err.message});
    }
};
// 🔹 Obtener documentos de un estudiante específico
export const obtenerMisDocumentos = async (req: Request, res: Response): Promise<void> => {
    try {
        const estudianteId = parseInt(req.query.estudianteId as string);

        if (isNaN(estudianteId)) {
            res.status(400).json({error: 'Parámetro estudianteId inválido o ausente'});
            return;
        }

        const documentos = await prisma.documento.findMany({
            where: {estudianteId},
            orderBy: {fechaSubida: 'desc'},
        });

        res.json(documentos);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({error: 'Error al obtener documentos del estudiante', detalle: err.message});
    }
};

// 🔹 Obtener documentos por estudianteId
export const obtenerDocumentosPorEstudiante = async (req: Request, res: Response): Promise<void> => {
    try {
        const estudianteId = parseInt(req.params.estudianteId);

        if (isNaN(estudianteId)) {
            res.status(400).json({error: 'ID de estudiante inválido'});
            return;
        }

        const documentos = await prisma.documento.findMany({
            where: {estudianteId},
            orderBy: {fechaSubida: 'desc'}
        });

        res.json(documentos);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({error: 'Error al obtener documentos', detalle: err.message});
    }
};
// 🔹 Obtener flashcards del estudiante
export const obtenerFlashcardsPorDocumento = async (req: Request, res: Response): Promise<void> => {
    try {
        const documentoId = parseInt(req.params.documentoId);

        if (isNaN(documentoId)) {
            res.status(400).json({error: 'ID de estudiante inválido'});
            return;
        }

        const flashcards = await prisma.flashcard.findMany({
            where: {
                documentoId
            },
        });

        res.json(flashcards);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({error: 'Error al obtener flashcards', detalle: err.message});
    }
};

export const obtenerResumenPorDocumento = async (req: Request, res: Response): Promise<void> => {
    try {
        const documentoId = parseInt(req.params.documentoId);

        if (isNaN(documentoId)) {
            res.status(400).json({error: 'ID de documento inválido'});
            return;
        }

        const resumen = await prisma.resumen.findFirst({
            where: {
                documentoId: documentoId
            }
            , include: {
                documento: {
                    select: {titulo: true, materia: true, tema: true}
                }
            }
        });

        if (!resumen) {
            res.status(404).json({error: 'Resumen no encontrado para este documento'});
            return;
        }

        res.json(resumen);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({error: 'Error al obtener resumen', detalle: err.message});
    }
}
