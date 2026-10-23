const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

// For any user-supplied text placed into email HTML: a name like
// `<a href="evil">` must arrive as text, not as a working link.
export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (c) => ENTITIES[c]);
