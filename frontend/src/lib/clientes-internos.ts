/**
 * Clientes internos (squads, áreas CCM e parceiro) que não existem em tbl_linx,
 * mas podem ser escolhidos ao registrar uma atividade.
 */
export const CLIENTES_INTERNOS: readonly string[] = [
  'LINX SISTEMAS',
  'SQUAD CCM BULLS',
  'SQUAD CCM LAKERS',
  'SQUAD CCM ROCKETS',
  'SQUAD CCM WARRIORS',
  'ENGENHARIA CCM',
  'GRC CCM',
  'PED CCM',
];

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();

/** Clientes internos que contêm o texto digitado (todos, se vazio). */
export function filterClientesInternos(query: string): string[] {
  const q = normalize(query);
  if (!q) return [...CLIENTES_INTERNOS];
  return CLIENTES_INTERNOS.filter(c => normalize(c).includes(q));
}

/** Internos que batem com a busca primeiro, depois os da API, sem duplicar. */
export function mergeClienteSugestoes(query: string, apiResults: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of [...filterClientesInternos(query), ...apiResults]) {
    const key = normalize(s);
    if (!s || seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}
