import { mapvisorApi } from "./mapvisorApi";

const USER_LOTS_KEY = "mapvisor_user_lots";

export interface UserLotRecord {
  id: string;
  ownerId: string;
  nombre: string;
  tipoPropiedad?: string;
  operacion?: string;
  estado: string;
  precio: string;
  area: string;
  ciudad?: string;
  distrito?: string;
  dormitorios?: string;
  banos?: string;
  etapa: string;
  createdAt: string;
}

const readAllUserLots = (): UserLotRecord[] => {
  try {
    const raw = localStorage.getItem(USER_LOTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(USER_LOTS_KEY);
    return [];
  }
};

const writeAllUserLots = (lots: UserLotRecord[]) => {
  localStorage.setItem(USER_LOTS_KEY, JSON.stringify(lots));
  window.dispatchEvent(new CustomEvent("userLotsChanged"));
};

export const getUserLots = (ownerId: string) =>
  readAllUserLots().filter((lot) => lot.ownerId === ownerId);

export const fetchUserLots = async (): Promise<UserLotRecord[]> => {
  const result = await mapvisorApi<{ ok: boolean; lots: any[] }>("/api/lots?mine=1");
  return (result.lots || []).map((lot) => ({
    id: String(lot.id),
    ownerId: String(lot.owner_user_id || ""),
    nombre: String(lot.nombre || ""),
    tipoPropiedad: String(lot.tipo_propiedad || ""),
    operacion: String(lot.operacion || ""),
    estado: String(lot.estado || ""),
    precio: lot.precio == null ? "" : String(lot.precio),
    area: lot.area == null ? "" : String(lot.area),
    ciudad: String(lot.ciudad || ""),
    distrito: String(lot.distrito || ""),
    dormitorios: lot.dormitorios == null ? "" : String(lot.dormitorios),
    banos: lot.banos == null ? "" : String(lot.banos),
    etapa: String(lot.etapa || ""),
    createdAt: String(lot.created_at || ""),
  }));
};

export const saveUserLot = (lot: UserLotRecord) => {
  const lots = readAllUserLots();
  const nextLots = lots.filter((item) => item.id !== lot.id);
  writeAllUserLots([lot, ...nextLots]);
};
