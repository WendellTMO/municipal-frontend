/**
 * Demo: cartão para o aluno confirmado compartilhar a localização do ônibus quando o motorista
 * não usa o app, e para pedir aos colegas que compartilhem. Some sozinho quando o servidor não
 * liga o recurso, então fora da demo a tela fica como sempre foi.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { borderRadius, colors, spacing, textStyles } from '../theme';
import DialogoConfirmacao from './DialogoConfirmacao';
import { useToast } from './Toast';
import {
  buscarEstado,
  escutarCompartilhamento,
  estadoDaSessao,
  iniciarCompartilhamento,
  motivoDaParada,
  pararCompartilhamento,
  pedirLocalizacao,
  responderChegada,
} from '../services/compartilharLocalizacao';
import type { EstadoColaborativo } from '../services/compartilharLocalizacao';
import { avisoSemCompartilhamento } from '../utils/colaborativa';

const RELER_ESTADO_MS = 20_000;

type Props = { viagemId?: string };

const CompartilharLocalizacao: React.FC<Props> = ({ viagemId }) => {
  const toast = useToast();
  const emFoco = useIsFocused();
  const [estado, setEstado] = useState<EstadoColaborativo | null>(null);
  const [euCompartilho, setEuCompartilho] = useState(estadoDaSessao().viagemId === viagemId);
  const [perguntandoChegada, setPerguntandoChegada] = useState(false);
  const [dialogo, setDialogo] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const buscar = useCallback(async () => {
    if (!viagemId) return;
    try {
      setEstado(await buscarEstado(viagemId));
    } catch {
      setEstado(null);
    }
  }, [viagemId]);

  useEffect(() => {
    if (!emFoco || !viagemId) return;
    buscar();
    const intervalo = setInterval(buscar, RELER_ESTADO_MS);
    return () => clearInterval(intervalo);
  }, [emFoco, viagemId, buscar]);

  // Quem para por ter chegado ao destino é avisado, para saber que o envio terminou.
  const compartilhavaAntes = useRef(euCompartilho);
  useEffect(
    () =>
      escutarCompartilhamento((atual) => {
        const agora = !!viagemId && atual.viagemId === viagemId;
        setEuCompartilho(agora);
        setPerguntandoChegada(agora && atual.perguntando);
        if (compartilhavaAntes.current && !agora && motivoDaParada() === 'chegada') {
          toast.info('Chegamos ao seu destino. Paramos de compartilhar a sua localização.');
        }
        compartilhavaAntes.current = agora;
      }),
    [viagemId, toast],
  );

  if (!viagemId || !estado || !estado.ativa) return null;
  if (!estado.pode_compartilhar && !euCompartilho) return null;

  const total = estado.compartilhando ?? 0;
  const aviso = euCompartilho ? '' : avisoSemCompartilhamento(estado);

  const comecar = async () => {
    setDialogo(false);
    setOcupado(true);
    try {
      const resultado = await iniciarCompartilhamento(viagemId, estado.destino ?? null);
      if (resultado === 'sem-permissao') toast.warning('Permita o acesso à localização para compartilhar.');
      if (resultado === 'sem-gps') toast.warning('Este aparelho não informa a localização.');
    } finally {
      setOcupado(false);
      buscar();
    }
  };

  const parar = async () => {
    setOcupado(true);
    try {
      await pararCompartilhamento(true);
    } finally {
      setOcupado(false);
      buscar();
    }
  };

  const pedir = async () => {
    setOcupado(true);
    try {
      const resposta = await pedirLocalizacao(viagemId);
      if (resposta.avisados > 0) toast.success(`Avisamos ${resposta.avisados} colega(s) da viagem.`);
      else if (resposta.motivo === 'recente') toast.info('Já pedimos há pouco. Dá para pedir de novo em alguns minutos.');
      else toast.info('Não há outros colegas confirmados para avisar.');
    } catch {
      toast.warning('Não foi possível pedir agora. Tente de novo.');
    } finally {
      setOcupado(false);
    }
  };

  const textoPessoas =
    total === 1 ? '1 pessoa está compartilhando.' : `${total} pessoas estão compartilhando.`;
  const dica =
    Platform.OS === 'web'
      ? 'Deixe esta aba aberta e a tela acesa.'
      : 'Continua funcionando com a tela bloqueada.';

  return (
    <View style={styles.cartao}>
      <Text style={styles.titulo}>
        {euCompartilho ? 'Você está compartilhando o ônibus' : 'Você está no ônibus?'}
      </Text>
      <Text style={styles.texto}>
        {euCompartilho
          ? `Seus colegas veem o ônibus no mapa, sem o seu nome. ${dica}`
          : 'Compartilhe a sua localização para a turma ver o ônibus no mapa.'}
      </Text>
      {total > 0 ? <Text style={styles.contagem}>{textoPessoas}</Text> : null}
      {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}

      {euCompartilho ? (
        <TouchableOpacity
          style={[styles.botao, styles.botaoSecundario]}
          onPress={parar}
          disabled={ocupado}
          accessibilityRole="button"
          accessibilityLabel="Parar de compartilhar a localização">
          {ocupado ? <ActivityIndicator color={colors.text.primary} /> : <Text style={styles.textoSecundario}>Parar de compartilhar</Text>}
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity
            style={styles.botao}
            onPress={() => setDialogo(true)}
            disabled={ocupado}
            accessibilityRole="button"
            accessibilityLabel="Compartilhar localização do ônibus">
            {ocupado ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.textoBotao}>Compartilhar localização</Text>}
          </TouchableOpacity>
          {total === 0 ? (
            <TouchableOpacity
              style={[styles.botao, styles.botaoSecundario]}
              onPress={pedir}
              disabled={ocupado}
              accessibilityRole="button"
              accessibilityLabel="Pedir aos colegas que compartilhem a localização">
              <Text style={styles.textoSecundario}>Pedir aos colegas</Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}

      <DialogoConfirmacao
        visible={dialogo}
        titulo="Compartilhar a localização do ônibus?"
        resumo="O seu celular vai enviar a sua posição enquanto você estiver no ônibus. Os colegas veem só o ônibus no mapa, sem o seu nome. Você pode parar quando quiser, e as posições são apagadas quando a viagem termina."
        onCancelar={() => setDialogo(false)}
        principal={{ texto: 'Compartilhar', cor: colors.primary.main, onPress: comecar }}
        secundario={{
          texto: 'Agora não',
          cor: colors.background.default,
          corTexto: colors.text.primary,
          onPress: () => setDialogo(false),
        }}
      />

      <DialogoConfirmacao
        visible={perguntandoChegada}
        titulo="Você chegou ao seu destino?"
        resumo="Se você já desceu, paramos de compartilhar a sua localização. Sem resposta em 1 minuto, paramos sozinhos."
        onCancelar={() => responderChegada(false)}
        principal={{ texto: 'Cheguei, parar de compartilhar', cor: colors.primary.main, onPress: () => responderChegada(true) }}
        secundario={{
          texto: 'Ainda estou no ônibus',
          cor: colors.background.default,
          corTexto: colors.text.primary,
          onPress: () => responderChegada(false),
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  titulo: { ...textStyles.h4, color: colors.text.primary },
  texto: { ...textStyles.body, color: colors.text.secondary, marginTop: spacing.xs },
  contagem: { ...textStyles.body, color: colors.success.main, marginTop: spacing.xs },
  aviso: { ...textStyles.body, color: colors.warning.main, marginTop: spacing.xs },
  botao: {
    minHeight: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  botaoSecundario: { backgroundColor: colors.background.default },
  textoBotao: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  textoSecundario: { color: colors.text.primary, fontSize: 16, fontWeight: '600' },
});

export default CompartilharLocalizacao;
