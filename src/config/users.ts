/**
 * Usuarios de demostración (solo desarrollo / prototipo).
 * En producción las credenciales deben validarse en el servidor, no en el frontend.
 */
import type { AppUser } from "../types/auth";

export type DemoUserRecord = AppUser & { password: string };

export const DEMO_USERS: DemoUserRecord[] = [
  {
    id: "usuario-1",
    email: "usuario@nautia.com",
    password: "usuario123",
    full_name: "Usuario Demo",
  },
];
