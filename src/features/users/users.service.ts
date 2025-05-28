// src/features/users/users.service.ts

import { PrismaClient } from '../../generated/prisma';
import { CreateUserDto } from './users.dto';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const createUsuario = async (data: CreateUserDto) => {
  const hashedPassword = await bcrypt.hash(data.contrasena, 10);

  const nuevoUsuario = await prisma.usuario.create({
    data: {
      nombre: data.nombre,
      correo: data.correo,
      contrasena: hashedPassword,
      rol: data.rol || 'ESTUDIANTE',
    },
  });

  // Omitimos la contraseña al devolver
  const { contrasena, ...usuarioSinPassword } = nuevoUsuario;
  return usuarioSinPassword;
};
