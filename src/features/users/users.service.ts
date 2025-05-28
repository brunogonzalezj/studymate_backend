import { PrismaClient } from '../../generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const createUsuario = async (data: any) => {
  const { nombre, correo, contrasena, rol } = data;

  const hashed = await bcrypt.hash(contrasena, 10);

  // 1. Crear usuario
  const nuevoUsuario = await prisma.usuario.create({
    data: {
      nombre,
      correo,
      contrasena: hashed,
      rol,
    },
  });

  // 2. Si es estudiante, crear también su entrada en la tabla estudiantes
  if (rol === 'ESTUDIANTE') {
    await prisma.estudiante.create({
      data: {
        usuarioId: nuevoUsuario.id,
        nivelAcademico: '',
        disponibilidadHoraria: '',
      },
    });
  }

  return nuevoUsuario;
};
