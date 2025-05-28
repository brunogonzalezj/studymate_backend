export interface CreateUserDto {
  nombre: string;
  correo: string;
  contrasena: string;
  rol?: 'ESTUDIANTE' | 'MAESTRO' | 'ADMIN';
}