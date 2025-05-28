// src/features/documents/documents.service.ts
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export const crearDocumento = async (titulo: string, contenido: string) => {
  return prisma.documento.create({
    data: {
      titulo,
      contenido,
      formato: 'PDF', // por defecto
    },
  });
};
