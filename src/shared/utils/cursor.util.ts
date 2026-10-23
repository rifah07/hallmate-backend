// Keyset pagination cursor: "the last row I saw" as an opaque string.
// (createdAt, id) because two rows can share a timestamp.
export interface Cursor {
  createdAt: Date;
  id: string;
}

export const encodeCursor = (c: Cursor): string =>
  Buffer.from(`${c.createdAt.toISOString()}|${c.id}`).toString('base64url');

export const decodeCursor = (raw?: string): Cursor | undefined => {
  if (!raw) return undefined;
  const [iso, id] = Buffer.from(raw, 'base64url').toString().split('|');
  const createdAt = new Date(iso);
  return id && !Number.isNaN(createdAt.getTime()) ? { createdAt, id } : undefined;
};

/** Prisma `where` fragment for "older than the cursor", newest-first lists. */
export const olderThan = (cursor?: Cursor) =>
  cursor
    ? {
        OR: [
          { createdAt: { lt: cursor.createdAt } },
          { createdAt: cursor.createdAt, id: { lt: cursor.id } },
        ],
      }
    : {};

/** Rows were fetched with take: limit + 1; split into a page and the next cursor. */
export const toPage = <T extends Cursor>(rows: T[], limit: number) => {
  const items = rows.slice(0, limit);
  const last = items[items.length - 1];
  return { items, nextCursor: rows.length > limit && last ? encodeCursor(last) : null };
};
