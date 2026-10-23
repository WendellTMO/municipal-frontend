import type { LatLng } from '../types';

const MAX_PONTOS = 100; // limite padrao de waypoints do OSRM
const TIMEOUT_MS = 6000;

const cache = new Map<string, LatLng[]>();

export function limparCacheTrajeto(): void {
  cache.clear();
}

export function chaveTrajeto(pontos: LatLng[]): string {
  const partes: string[] = [];
  for (const p of pontos) {
    partes.push(`${p.longitude},${p.latitude}`);
  }
  return partes.join(';');
}

export function montarUrlOsrm(baseUrl: string, pontos: LatLng[]): string {
  const base = baseUrl.replace(/\/+$/, '');
  return `${base}/route/v1/driving/${chaveTrajeto(pontos)}?overview=full&geometries=geojson`;
}

// Resposta do OSRM em GeoJSON ([lng, lat]) para LatLng. Resposta invalida devolve [].
export function extrairCoordenadas(json: unknown): LatLng[] {
  const resposta = json as { code?: string; routes?: { geometry?: { coordinates?: unknown } }[] };
  if (!resposta || resposta.code !== 'Ok' || !resposta.routes || resposta.routes.length === 0) return [];
  const bruto = resposta.routes[0]?.geometry?.coordinates;
  if (!Array.isArray(bruto)) return [];
  const resultado: LatLng[] = [];
  for (const par of bruto) {
    if (!Array.isArray(par) || par.length < 2) continue;
    const longitude = Number(par[0]);
    const latitude = Number(par[1]);
    if (isNaN(latitude) || isNaN(longitude)) continue;
    resultado.push({ latitude, longitude });
  }
  return resultado;
}

type Opcoes = {
  baseUrl: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

// Devolve o trajeto pelas ruas passando por todos os pontos na ordem.
// Devolve [] em qualquer falha (rede, timeout, resposta ruim): quem chama desenha a linha reta.
export async function buscarTrajetoRuas(pontos: LatLng[], opcoes: Opcoes): Promise<LatLng[]> {
  if (pontos.length < 2 || pontos.length > MAX_PONTOS) return [];
  const chave = chaveTrajeto(pontos);
  const guardado = cache.get(chave);
  if (guardado) return guardado;

  const controle = new AbortController();
  const aoCancelar = () => controle.abort();
  if (opcoes.signal) {
    if (opcoes.signal.aborted) return [];
    opcoes.signal.addEventListener('abort', aoCancelar);
  }
  const relogio = setTimeout(aoCancelar, opcoes.timeoutMs ?? TIMEOUT_MS);
  try {
    const buscar = opcoes.fetchImpl ?? fetch;
    const resposta = await buscar(montarUrlOsrm(opcoes.baseUrl, pontos), { signal: controle.signal });
    if (!resposta.ok) return [];
    const coordenadas = extrairCoordenadas(await resposta.json());
    if (coordenadas.length >= 2) cache.set(chave, coordenadas);
    return coordenadas;
  } catch {
    return [];
  } finally {
    clearTimeout(relogio);
    if (opcoes.signal) opcoes.signal.removeEventListener('abort', aoCancelar);
  }
}
