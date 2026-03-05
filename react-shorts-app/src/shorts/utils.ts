export function incrementLabel(label: string | number): string {
  const s = String(label);
  if (s.endsWith("K")) {
    const n = parseFloat(s) + 0.1;
    return `${Math.round(n * 10) / 10}K`;
  }
  if (s.endsWith("M")) {
    const n = parseFloat(s) + 0.1;
    return `${Math.round(n * 10) / 10}M`;
  }
  return String(parseInt(s, 10) + 1);
}

