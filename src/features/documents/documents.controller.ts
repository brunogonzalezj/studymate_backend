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

// 🔹 Generación de resumen con OpenAI
export const generarResumen = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.body;
    if (!id) {
      res.status(400).json({ error: 'Falta el ID del documento' });
      return;
    }

    const documento = await prisma.documento.findUnique({ where: { id } });
    if (!documento) {
      res.status(404).json({ error: 'Documento no encontrado' });
      return;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Resumí el siguiente texto en español:' },
        { role: 'user', content: documento.contenido },
      ],
    });

    const resumen = completion.choices[0]?.message?.content || '';

    const actualizado = await prisma.documento.update({
      where: { id },
      data: { resumen },
    });

    res.json({ mensaje: 'Resumen generado', resumen });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar resumen', detalle: err.message });
  }
};
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
