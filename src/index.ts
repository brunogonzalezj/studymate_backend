import express from 'express';
import cors from 'cors';
import userRoutes from './features/users/users.route';
import authRoutes from './features/auth/auth.route';
import documentsRoutes from './features/documents/documents.route';

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
