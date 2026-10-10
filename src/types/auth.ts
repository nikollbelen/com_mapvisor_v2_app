export interface AppUser {
  id: string;
  email: string;
  full_name: string;
}

export type TopbarButtonId = "fotos" | "areas" | "lotes" | "entorno";

export type TopbarVisibility = Record<TopbarButtonId, boolean>;
