// src/features/users/users.service.ts

import { PrismaClient } from '../../generated/prisma';
import { CreateUserDto } from './users.dto';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const createUsuario = async (data: CreateUserDto) => {
  // Verificamos que todos los campos requeridos existan
  if (!data.nombre || !data.correo || !data.contrasena) {
    throw new Error('Nombre, correo y contraseña son campos requeridos');
  }

  // Verificamos si ya existe un usuario con ese correo
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { correo: data.correo }
  });

  if (usuarioExistente) {
    throw new Error('Ya existe un usuario con este correo electrónico');
  }

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
