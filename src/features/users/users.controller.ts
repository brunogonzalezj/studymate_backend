import { Request, Response } from 'express';
import { createUsuario } from './users.service';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const nuevoUsuario = await createUsuario(req.body);
    res.status(201).json(nuevoUsuario);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: 'No se pudo crear el usuario', detalle: error.message });
    res.status(500).json({ error: 'An error occurred.' });
  }
};
