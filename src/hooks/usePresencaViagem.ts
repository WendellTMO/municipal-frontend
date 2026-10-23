import { useCallback, useState } from 'react';
import { alunoService } from '../services';
import { useToast } from '../components/Toast';
import { unwrapItems } from '../types';
import { getErrorMessageFromError } from '../utils/errors';
import { escolherPontoEmbarque, MSG_SEM_PONTO } from '../utils/presenca';

type ViagemPresenca = {
  id?: string;
  rota_id?: string;
  ponto_embarque_id?: string;
};

/**
 * Confirmar e cancelar presença numa viagem, com estado otimista que volta atrás se a
 * chamada falhar, toast de sucesso e mensagem de erro clara. Usado na home e no detalhe.
 */
export function usePresencaViagem(
  viagem: ViagemPresenca | null | undefined,
  inicial: boolean,
  aoMudar?: (confirmada: boolean) => void,
) {
  const toast = useToast();
  const [confirmada, setConfirmada] = useState(inicial);
  const [salvando, setSalvando] = useState(false);

  const alterar = useCallback(
    async (confirmar: boolean): Promise<boolean> => {
      if (!viagem?.id || salvando) return false;
      let pontoId: string | null = null;
      if (confirmar) {
        let pontos: Record<string, unknown>[] = [];
        if (!viagem.ponto_embarque_id && viagem.rota_id) {
          try {
            pontos = (await alunoService.listarPontosRota(viagem.rota_id).then(unwrapItems)) as Record<string, unknown>[];
          } catch (e) {
            toast.error(`Não foi possível buscar os pontos da rota: ${getErrorMessageFromError(e)}`);
            return false;
          }
        }
        pontoId = escolherPontoEmbarque(viagem, pontos);
        if (!pontoId) {
          toast.error(MSG_SEM_PONTO);
          return false;
        }
      }
      setSalvando(true);
      setConfirmada(confirmar); // otimista
      try {
        await alunoService.alterarPresencaViagem(viagem.id, confirmar, pontoId);
        toast.success(confirmar ? 'Presença confirmada!' : 'Presença cancelada.');
        aoMudar?.(confirmar);
        return true;
      } catch (e) {
        setConfirmada(!confirmar); // volta ao estado anterior
        toast.error(getErrorMessageFromError(e) || 'Não foi possível atualizar a presença.');
        return false;
      } finally {
        setSalvando(false);
      }
    },
    [viagem, salvando, toast, aoMudar],
  );

  return { confirmada, setConfirmada, salvando, confirmar: () => alterar(true), cancelar: () => alterar(false) };
}
