export function isLotOwner(
  user: { id: string } | null | undefined,
  lot: { id?: unknown; owner_user_id?: unknown; ownerId?: unknown } | null | undefined,
): boolean {
  if (!user?.id || !lot?.id) return false;
  const ownerId = lot.owner_user_id ?? lot.ownerId;
  return typeof ownerId === "string" && ownerId === user.id;
}
