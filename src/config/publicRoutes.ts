export type PublicPage = "home" | "publish" | "terms" | "refunds" | "claims" | "contact";

export const routeToPage: Record<string, PublicPage> = {
  "/": "home",
  "/publicar-lote": "publish",
  "/planes": "publish",
  "/terminos-y-condiciones": "terms",
  "/politica-devoluciones": "refunds",
  "/libro-reclamaciones": "claims",
  "/contacto": "contact",
};

export function getPublicPageFromPath(pathname: string): PublicPage | null {
  return routeToPage[pathname] ?? null;
}
