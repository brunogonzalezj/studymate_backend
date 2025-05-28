// src/features/auth/auth.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response): Promise<void> => {
  const { correo, contrasena } = req.body;

  try {
   const usuario = await prisma.usuario.findUnique({
  where: { correo },
  include: { estudiante: true },
});

    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const esValido = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!esValido) {
      res.status(401).json({ error: 'Contraseña incorrecta' });
      return;
    }

    const { contrasena: _, ...usuarioSinPassword } = usuario;
    res.json({ mensaje: 'Login exitoso', usuario: usuarioSinPassword });
  } catch (err: any) {
    res.status(500).json({ error: 'Error interno', detalle: err.message });
  }
};
