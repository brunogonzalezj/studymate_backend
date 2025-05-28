import { Request, Response } from 'express';
import fs from 'fs';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import { PrismaClient } from '../../generated/prisma';
import { crearDocumento } from './documents.service';

const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔹 Subida de PDF y extracción de texto
export const subirDocumentoPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ error: 'No se envió ningún archivo PDF' });
      return;
    }

    const buffer = fs.readFileSync(file.path);
    const parsed = await pdfParse(buffer);

    const titulo = file.originalname.replace('.pdf', '');
    const contenido = parsed.text;

    const documento = await crearDocumento(titulo, contenido);
    res.status(201).json(documento);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar el PDF', detalle: err.message });
  }
};

// 🔹 Generación de resumen y flashcards con OpenAI
export const generarResumen = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, tipo } = req.body;

    if (!id || !tipo) {
      res.status(400).json({ error: 'Faltan campos obligatorios: id y tipo' });
      return;
    }

    const documento = await prisma.documento.findUnique({ where: { id } });
    if (!documento) {
      res.status(404).json({ error: 'Documento no encontrado' });
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
      res.status(400).json({ error: 'Tipo inválido. Usa: EXTENDIDO, CORTO o FLASHCARDS.' });
      return;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: documento.contenido },
      ],
    });

    const result = completion.choices[0]?.message?.content || '';

    // --- Modo resumen largo/corto
    if (mode === 'EXTENDIDO' || mode === 'CORTO') {
      await prisma.documento.update({
        where: { id },
        data: { resumen: result },
      });

      res.json({ mensaje: 'Resumen generado', resumen: result });
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

      res.status(201).json({ mensaje: 'Flashcards generadas', total: creadas.length, flashcards: creadas });
    }
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar el contenido', detalle: err.message });
  }
};

// 🔹 Listado general de documentos
export const obtenerTodosLosDocumentos = async (req: Request, res: Response): Promise<void> => {
  try {
    const documentos = await prisma.documento.findMany({
      orderBy: { fechaSubida: 'desc' }
    });

    res.json(documentos);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener documentos', detalle: err.message });
  }
};

// 🔹 Obtener un documento por ID
export const obtenerDocumentoPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const documento = await prisma.documento.findUnique({
      where: { id },
    });

    if (!documento) {
      res.status(404).json({ error: 'Documento no encontrado' });
      return;
    }

    res.json(documento);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener documento', detalle: err.message });
  }
};
