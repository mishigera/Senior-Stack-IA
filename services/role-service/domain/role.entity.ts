/**
 * Entidad de dominio: Role (Bounded Context: Identity/Access).
 */
export interface Role {
  id: number;
  name: string;
  description: string | null;
}
