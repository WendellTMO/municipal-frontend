import { useEffect, useState } from 'react';
import { OSRM_BASE_URL } from '../../../config/osrm';
import type { LatLng } from '../types';
import { buscarTrajetoRuas, chaveTrajeto } from '../utils/trajetoRuas';

// Trajeto pelas ruas passando por todos os pontos. Enquanto carrega ou se falhar, devolve [].
export function useTrajetoRuas(pontos: LatLng[]): LatLng[] {
  const [trajeto, setTrajeto] = useState<LatLng[]>([]);
  const chave = chaveTrajeto(pontos);

  useEffect(() => {
    setTrajeto([]);
    const controle = new AbortController();
    buscarTrajetoRuas(pontos, { baseUrl: OSRM_BASE_URL, signal: controle.signal }).then((coordenadas) => {
      if (!controle.signal.aborted) setTrajeto(coordenadas);
    });
    return () => controle.abort();
    // pontos entra pela chave: o array novo a cada render nao deve refazer a busca
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  return trajeto;
}
