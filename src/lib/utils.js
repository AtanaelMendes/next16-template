/**
 * Utilitário nativo leve para mesclagem de classes CSS (substituto de clsx + twMerge)
 * Suporta strings, arrays, objetos condicionais e valores falsy sem dependências externas.
 */
export function cn(...inputs) {
  const classes = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const inner = cn(...input);
      if (inner) classes.push(inner);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(' ');
}

/**
 * Validação de valores nulos, vazios ou indefinidos
 * Compatível com o padrão utilizado em formulários legados.
 */
export function empty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'boolean') return false;
  if (typeof value === 'number') return isNaN(value);
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Converte quebras de linha em tags <br /> para renderização HTML segura
 */
export function nl2br(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/(\r\n|\n\r|\r|\n)/g, '<br />');
}

/**
 * Verifica se um valor numérico está no intervalo [min, max]
 */
export function numberBetween(value, min, max) {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
}

export default {
  cn,
  empty,
  nl2br,
  numberBetween,
};
