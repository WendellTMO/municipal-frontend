import { useCallback, useEffect, useState } from 'react';
import { alunoService } from '../services';
import { useToast } from '../components/Toast';
import type { Escolha, PontoEscolha } from '../components/EscolhaPontoSheet';
import type { EscolhaPontos } from '../services/alunoService';
import { unwrapItems } from '../types';
import { getErrorMessageFromError } from '../utils/errors';
import {
  erroDeCampoPonto,
  instituicaoDoSentido,
  linhaDosPontos,
  mensagemDeErroPonto,
  montarCorpoConfirmacao,
  montarPontosDaEscolha,
  nomeDoPonto,
  precisaEscolher,
  sentidoDe,
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
type PontoApi = PontoEscolha & { instituicao?: { nome?: string } | null };

/**
 * Confirmar e cancelar presença numa viagem, com a escolha de ponto do aluno. Sem padrão salvo
 * (precisa_escolher_ponto) o Confirmar abre a folha de escolha; com padrão confirma direto.
 * Usado na home, no detalhe da viagem e na lista de viagens da rota.
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
  const [pontos, setPontos] = useState<PontoApi[] | null>(null);
  const [pedirEscolha, setPedirEscolha] = useState(precisaEscolher(viagem));
  const [escolha, setEscolha] = useState<Escolha>({
    embarqueId: viagem?.ponto_embarque_id ?? null,
    desembarqueId: viagem?.ponto_destino_id ?? null,
  });
  const sentido = sentidoDe(viagem);

  const carregarPontos = useCallback(async () => {
    if (pontos || !viagem?.rota_id) return;
    try {
      const lista = (await alunoService.listarPontosRota(viagem.rota_id).then(unwrapItems)) as PontoApi[];
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
      setConfirmada(confirmar);
      if (nova) setEscolha(nova);
      if (corpo.lembrar_escolha) setPedirEscolha(false);
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

  const confirmarEscolha = async (nova: Escolha, lembrar: boolean) => {
    if (!viagem?.rota_id) return;
    setErroFolha('');
    // Em Alterar o aluno já está confirmado: o padrão é gravado antes e a confirmação segue o novo ponto.
    if (folha === 'alterar' && lembrar) {
      try {
        await alunoService.salvarMeuPonto(viagem.rota_id, montarPontosDaEscolha(sentido, nova));
      } catch (e) {
        setErroFolha(mensagemDeErroPonto(e, getErrorMessageFromError(e) || 'Não foi possível salvar a escolha.'));
        return;
      }
      await enviar(true, montarCorpoConfirmacao(sentido, nova, false), nova);
      return;
    }
    await enviar(true, montarCorpoConfirmacao(sentido, nova, lembrar), nova);
  };

  const instituicao = instituicaoDoSentido(sentido, viagem ?? {}, pontos);
  const linhaPontos = linhaDosPontos(
    sentido,
    nomeDoPonto(pontos, escolha.embarqueId),
    nomeDoPonto(pontos, escolha.desembarqueId),
  );

  return {
    confirmada,
    setConfirmada,
    salvando,
    confirmar,
    cancelar: () => enviar(false, {}),
    alterar: () => abrirFolha('alterar'),
    linhaPontos,
    folhaProps: {
      visible: folha !== null,
      sentido,
      pontos,
      fixoId: instituicao.pontoId,
      instituicaoNome: instituicao.nome,
      inicial: escolha,
      erro: erroFolha,
      salvando,
      onClose: () => setFolha(null),
      onConfirmar: confirmarEscolha,
    },
  };
}
