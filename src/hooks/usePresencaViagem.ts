import { registrarAcao } from '../utils/telemetriaFila';
import { useCallback, useEffect, useState } from 'react';
import { alunoService } from '../services';
import { useToast } from '../components/Toast';
import type { Escolha, PontoEscolha } from '../components/EscolhaPontoSheet';
import type { EscolhaPontos } from '../services/alunoService';
import { unwrapItems } from '../types';
import { getErrorMessageFromError } from '../utils/errors';
import { compartilhar } from '../utils/requisicaoCompartilhada';
import {
  corpoConfirmacao,
  erroDeCampoPonto,
  mensagemDeErroPonto,
  nomeDoPonto,
  precisaEscolher,
} from '../utils/presenca';

type ViagemPresenca = {
  id?: string;
  rota_id?: string;
  tipo?: string;
  ponto_embarque_id?: string;
  ponto_destino_id?: string;
  precisa_escolher_ponto?: boolean;
};

type ModoFolha = 'confirmar' | 'alterar' | null;

/**
 * Confirmar e cancelar presença numa viagem, com a escolha de pontos do aluno. Sem pontos
 * lembrados para o horário (precisa_escolher_ponto) o Confirmar abre a tela de pontos; com eles
 * confirma direto. Usado na home, no detalhe da viagem e na lista de viagens da rota.
 */
export function usePresencaViagem(
  viagem: ViagemPresenca | null | undefined,
  inicial: boolean,
  aoMudar?: (confirmada: boolean) => void,
) {
  const toast = useToast();
  const [confirmada, setConfirmada] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const [folha, setFolha] = useState<ModoFolha>(null);
  const [erroFolha, setErroFolha] = useState('');
  const [pontos, setPontos] = useState<PontoEscolha[] | null>(null);
  const [pedirEscolha, setPedirEscolha] = useState(precisaEscolher(viagem));
  const [escolha, setEscolha] = useState<Escolha>({
    embarqueId: viagem?.ponto_embarque_id ?? null,
    desembarqueId: viagem?.ponto_destino_id ?? null,
  });

  const carregarPontos = useCallback(async () => {
    if (pontos || !viagem?.rota_id) return;
    try {
      // Vários cards da mesma rota abrem juntos: dividem a mesma busca.
      const lista = (await compartilhar(`pontos:${viagem.rota_id}:${viagem.tipo}`, () =>
        alunoService.listarPontosRota(viagem.rota_id as string, viagem.tipo).then(unwrapItems),
      )) as PontoEscolha[];
      setPontos(lista);
    } catch (e) {
      setErroFolha(`Não foi possível buscar os pontos da rota: ${getErrorMessageFromError(e)}`);
      setPontos([]);
    }
  }, [pontos, viagem?.rota_id]);

  // O nome dos pontos escolhidos aparece no card da viagem confirmada.
  useEffect(() => {
    if (confirmada) carregarPontos();
  }, [confirmada, carregarPontos]);

  const abrirFolha = async (modo: ModoFolha) => {
    setErroFolha('');
    setFolha(modo);
    await carregarPontos();
  };

  const enviar = async (confirmar: boolean, corpo: EscolhaPontos, nova?: Escolha): Promise<boolean> => {
    if (!viagem?.id || salvando) return false;
    setSalvando(true);
    try {
      await alunoService.alterarPresencaViagem(viagem.id, confirmar, corpo);
      registrarAcao(confirmar ? 'presenca_confirmar' : 'presenca_cancelar');
      setConfirmada(confirmar);
      if (nova) setEscolha(nova);
      if (confirmar) setPedirEscolha(false);
      setFolha(null);
      toast.success(confirmar ? 'Presença confirmada!' : 'Presença cancelada.');
      aoMudar?.(confirmar);
      return true;
    } catch (e) {
      const msg = mensagemDeErroPonto(e, getErrorMessageFromError(e) || 'Não foi possível atualizar a presença.');
      if (folha || erroDeCampoPonto(e)) {
        if (!folha) {
          setFolha('confirmar');
          carregarPontos();
        }
        setErroFolha(msg);
      } else {
        toast.error(msg);
      }
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const confirmar = async (): Promise<boolean> => {
    if (pedirEscolha) {
      await abrirFolha('confirmar');
      return false;
    }
    return enviar(true, {});
  };

  // Os dois pontos vão na confirmação e o backend lembra para este horário. Em Alterar o aluno
  // já está confirmado: confirmar de novo troca os pontos da viagem.
  const confirmarEscolha = async (nova: Escolha) => {
    if (!viagem?.rota_id) return;
    setErroFolha('');
    await enviar(true, corpoConfirmacao(nova), nova);
  };

  const nomesPontos = {
    embarque: nomeDoPonto(pontos, escolha.embarqueId),
    desembarque: nomeDoPonto(pontos, escolha.desembarqueId),
  };

  return {
    confirmada,
    setConfirmada,
    salvando,
    confirmar,
    cancelar: () => enviar(false, {}),
    alterar: () => abrirFolha('alterar'),
    nomesPontos,
    folhaProps: {
      visible: folha !== null,
      pontos,
      inicial: escolha,
      erro: erroFolha,
      salvando,
      onClose: () => setFolha(null),
      onConfirmar: confirmarEscolha,
    },
  };
}
