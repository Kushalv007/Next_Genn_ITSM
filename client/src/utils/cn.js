/**
 * Tiny classname concatenation helper (clsx-like).
 * Supports strings, arrays and objects of the form { className: boolean }.
 */
export default function cn(...inputs) {
  const out = [];
  for (const input of inputs) {
    if (!input) continue;
    const t = typeof input;
    if (t === 'string' || t === 'number') {
      out.push(input);
    } else if (Array.isArray(input)) {
      const inner = cn(...input);
      if (inner) out.push(inner);
    } else if (t === 'object') {
      for (const key of Object.keys(input)) {
        if (input[key]) out.push(key);
      }
    }
  }
  return out.join(' ');
}
