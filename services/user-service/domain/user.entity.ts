/**
 * Entidad de dominio: User (Bounded Context: Identity/Access).
 * Expone solo datos públicos; el password no forma parte del contrato de lectura.
 */
export interface User {
  id: string;
  username: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type UserPublic = User;
