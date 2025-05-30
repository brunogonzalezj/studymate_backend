// src/features/documents/documents.service.ts
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export const crearDocumento = async (
  titulo: string,
  contenido: string,
  materia: string,
  tema: string,
  estudianteId: number
) => {
  return await prisma.documento.create({
    data: {
      titulo,
      contenido,
      materia,
      tema,
      estudianteId,
    },
  });
};
