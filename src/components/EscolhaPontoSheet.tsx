/**
 * Folha de escolha de pontos ao confirmar presença: o aluno marca onde embarca (IDA), onde
 * desce (VOLTA) ou os dois (CIRCULAR) entre os pontos da rota e decide se o app lembra.
 * Também exporta a linha pequena "Embarca em X · Alterar" que os cards mostram depois.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { borderRadius, colors, shadows, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';
import ModalApp from './ModalApp';
import Tappable from './Tappable';
import {
  escolhaCompleta,
  instituicaoDiferente,
  pedeDesembarque,
  pedeEmbarque,
  pedeInstituicao,
  tituloEscolha,
} from '../utils/presenca';
import { confirmAction } from '../utils/confirm';

export type PontoEscolha = { id: string; apelido: string; instituicao?: unknown };
export type Escolha = { embarqueId: string | null; desembarqueId: string | null };

export type InstituicaoDaRota = { id: string; nome: string; pontoId: string };

export type EscolhaPontoSheetProps = {
  visible: boolean;
  sentido: string;
  pontos: PontoEscolha[] | null;
  /** Ponto da instituição: fica fora da lista, pois o aluno não embarca nem desce nele por escolha */
  fixoId: string | null;
  instituicaoNome: string;
  /** Instituições da rota: o aluno pode usar uma que não é a dele */
  instituicoes: InstituicaoDaRota[];
  instituicaoPropriaId: string | null;
  instituicaoAtualId: string | null;
  inicial: Escolha;
  erro: string;
  salvando: boolean;
  onClose: () => void;
  onConfirmar: (escolha: Escolha, lembrar: boolean, instituicaoId: string | null) => void;
};

const Lista = ({
  titulo,
  pontos,
  marcado,
  onMarcar,
}: {
  titulo: string;
  pontos: PontoEscolha[];
  marcado: string | null;
  onMarcar: (id: string) => void;
}) => (
  <View accessibilityRole="radiogroup">
    {titulo ? <Text style={styles.blocoTitulo}>{titulo}</Text> : null}
    {pontos.map((ponto) => {
      const ativo = marcado === ponto.id;
      return (
        <Tappable
          key={ponto.id}
          style={[styles.opcao, ativo && styles.opcaoAtiva]}
          onPress={() => onMarcar(ponto.id)}
          sombra={false}
          accessibilityRole="radio"
          accessibilityState={{ checked: ativo }}
          accessibilityLabel={ponto.apelido}>
          <Icon
            name={ativo ? 'radio-button-checked' : 'radio-button-unchecked'}
            size="md"
            color={ativo ? '#FFFFFF' : colors.neutral[400]}
          />
          <Text style={[styles.opcaoTexto, ativo && styles.opcaoTextoAtiva]}>{ponto.apelido}</Text>
        </Tappable>
      );
    })}
  </View>
);

const EscolhaPontoSheet = ({
  visible,
  sentido,
  pontos,
  fixoId,
  instituicaoNome,
  instituicoes,
  instituicaoPropriaId,
  instituicaoAtualId,
  inicial,
  erro,
  salvando,
  onClose,
  onConfirmar,
}: EscolhaPontoSheetProps) => {
  const [escolha, setEscolha] = useState<Escolha>(inicial);
  const [lembrar, setLembrar] = useState(false);
  const [instituicaoId, setInstituicaoId] = useState<string | null>(instituicaoAtualId);
  const [trocando, setTrocando] = useState(false);

  useEffect(() => {
    if (visible) {
      setEscolha(inicial);
      setLembrar(false);
      setInstituicaoId(instituicaoAtualId);
      setTrocando(false);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // As instituições só chegam depois da lista de pontos; sem escolha ainda, usa a atual.
  useEffect(() => {
    if (visible && instituicaoId === null && instituicaoAtualId) setInstituicaoId(instituicaoAtualId);
  }, [instituicaoAtualId]); // eslint-disable-line react-hooks/exhaustive-deps

  const circular = sentido === 'CIRCULAR';
  const comInstituicao = pedeInstituicao(sentido) && instituicoes.length > 0;
  const escolhida = instituicoes.find((i) => i.id === instituicaoId) ?? null;
  const propria = instituicoes.find((i) => i.id === instituicaoPropriaId) ?? null;
  // O ponto da instituição escolhida não é ponto de embarque ou descida por escolha.
  const pontoDaInstituicao = escolhida ? escolhida.pontoId : fixoId;
  // Na ida e na volta as instituições da rota se escolhem no bloco de cima, não na lista de pontos.
  const lista: PontoEscolha[] = [];
  for (const ponto of pontos ?? []) {
    if (circular) {
      lista.push(ponto);
    } else if (ponto.id !== pontoDaInstituicao && !(comInstituicao && ponto.instituicao)) {
      lista.push(ponto);
    }
  }
  const completa = escolhaCompleta(sentido, escolha) && (!comInstituicao || escolhida !== null);
  const verbo = sentido === 'IDA' ? 'desce' : 'embarca';
  const linhaInstituicao =
    !comInstituicao && instituicaoNome && sentido === 'IDA'
      ? `Você desce na ${instituicaoNome}`
      : !comInstituicao && instituicaoNome && sentido === 'VOLTA'
        ? `Você embarca na ${instituicaoNome}`
        : '';

  const confirmar = () => {
    const outra = instituicaoDiferente(instituicaoId, instituicaoPropriaId);
    if (!outra) {
      onConfirmar(escolha, lembrar, instituicaoId);
      return;
    }
    const nomePropria = propria ? ` (${propria.nome})` : '';
    confirmAction({
      title: 'Outra instituição',
      message: `Você ${verbo === 'desce' ? 'vai descer' : 'vai embarcar'} em ${escolhida?.nome ?? 'outra instituição'}, que não é a sua instituição${nomePropria}. Confirma?`,
      confirmText: 'Sim, confirmar',
      onConfirm: () => onConfirmar(escolha, lembrar, instituicaoId),
      onCancel: undefined,
    });
  };

  return (
    <ModalApp visible={visible} transparent animationType="slide" onRequestClose={onClose} accessibilityViewIsModal>
      <View style={styles.overlay}>
        <Tappable style={styles.backdrop} activeOpacity={1} onPress={onClose} accessibilityLabel="Fechar" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              {tituloEscolha(sentido)}
            </Text>
            <Tappable onPress={onClose} sombra={false} accessibilityLabel="Fechar" style={styles.fechar}>
              <Icon name={IconNames.close} size="md" color={colors.text.secondary} />
            </Tappable>
          </View>

          {pontos === null ? (
            <ActivityIndicator color={colors.primary.main} style={styles.carregando} />
          ) : (
            <ScrollView style={styles.lista} nestedScrollEnabled>
              {comInstituicao ? (
                <View style={styles.instituicaoBloco}>
                  <Text style={styles.blocoTitulo}>
                    {sentido === 'IDA' ? 'Você desce em' : 'Você embarca em'}
                  </Text>
                  {escolhida && !trocando ? (
                    <View style={styles.instituicaoAtual}>
                      <Icon name={IconNames.school} size="md" color={colors.primary.main} />
                      <Text style={styles.instituicaoNome}>{escolhida.nome}</Text>
                      {instituicoes.length > 1 ? (
                        <Tappable
                          onPress={() => setTrocando(true)}
                          sombra={false}
                          accessibilityLabel="Trocar instituição">
                          <Text style={styles.linhaAlterar}>Trocar</Text>
                        </Tappable>
                      ) : null}
                    </View>
                  ) : (
                    <Lista
                      titulo=""
                      pontos={instituicoes.map((i) => ({ id: i.id, apelido: i.nome }))}
                      marcado={instituicaoId}
                      onMarcar={(id) => {
                        setInstituicaoId(id);
                        setTrocando(false);
                      }}
                    />
                  )}
                </View>
              ) : null}
              {pedeEmbarque(sentido) ? (
                <Lista
                  titulo={circular ? 'Onde você vai embarcar?' : comInstituicao ? 'Onde você embarca' : ''}
                  pontos={lista}
                  marcado={escolha.embarqueId}
                  onMarcar={(id) => setEscolha((atual) => ({ ...atual, embarqueId: id }))}
                />
              ) : null}
              {pedeDesembarque(sentido) ? (
                <Lista
                  titulo={circular ? 'Onde você vai descer?' : comInstituicao ? 'Onde você desce' : ''}
                  pontos={lista}
                  marcado={escolha.desembarqueId}
                  onMarcar={(id) => setEscolha((atual) => ({ ...atual, desembarqueId: id }))}
                />
              ) : null}
            </ScrollView>
          )}

          {linhaInstituicao ? <Text style={styles.instituicao}>{linhaInstituicao}</Text> : null}

          <View style={styles.lembrarLinha}>
            <Text style={styles.lembrarTexto}>Lembrar minha escolha</Text>
            <Switch
              value={lembrar}
              onValueChange={setLembrar}
              trackColor={{ false: colors.neutral[300], true: colors.primary.main }}
              thumbColor="#FFFFFF"
              activeThumbColor="#FFFFFF"
              accessibilityLabel="Lembrar minha escolha"
            />
          </View>

          {erro ? (
            <View style={styles.erro} accessibilityRole="alert">
              <Icon name={IconNames.warning} size="sm" color={colors.error.main} />
              <Text style={styles.erroTexto}>{erro}</Text>
            </View>
          ) : null}

          <Tappable
            style={[styles.confirmar, (!completa || salvando) && styles.confirmarDesabilitado]}
            onPress={confirmar}
            disabled={!completa || salvando}
            accessibilityLabel="Confirmar presença"
            accessibilityState={{ disabled: !completa || salvando }}>
            {salvando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmarTexto}>Confirmar presença</Text>
            )}
          </Tappable>
        </View>
      </View>
    </ModalApp>
  );
};

/** Linha pequena do card: "Embarca em X" com a ação discreta "Alterar". */
export const LinhaDosPontos = ({
  texto,
  onAlterar,
  claro = false,
}: {
  texto: string;
  onAlterar: () => void;
  claro?: boolean;
}) => {
  if (!texto) return null;
  const cor = claro ? '#FFFFFF' : colors.text.secondary;
  return (
    <View style={styles.linhaPontos}>
      <Text style={[styles.linhaTexto, { color: cor }]} numberOfLines={2}>
        {texto}
      </Text>
      <Tappable onPress={onAlterar} sombra={false} accessibilityLabel="Alterar ponto">
        <Text style={[styles.linhaAlterar, { color: cor }]}>Alterar</Text>
      </Tappable>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    ...shadows.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { ...textStyles.h3, flex: 1, color: colors.text.primary },
  fechar: { padding: spacing.sm },
  carregando: { marginVertical: spacing.xl },
  lista: { maxHeight: 300 },
  blocoTitulo: { ...textStyles.h5, color: colors.text.primary, marginTop: spacing.sm, marginBottom: spacing.sm },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.default,
  },
  opcaoAtiva: { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
  opcaoTexto: { ...textStyles.body, flex: 1, color: colors.text.primary },
  opcaoTextoAtiva: { color: '#FFFFFF', fontWeight: '700' as const },
  instituicao: { ...textStyles.body, color: colors.text.secondary, marginTop: spacing.sm },
  instituicaoBloco: { marginBottom: spacing.sm },
  instituicaoAtual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary.lighter,
  },
  instituicaoNome: { ...textStyles.body, flex: 1, color: colors.text.primary, fontWeight: '700' as const },
  lembrarLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    minHeight: 48,
  },
  lembrarTexto: { ...textStyles.body, color: colors.text.primary, fontWeight: '600' as const },
  erro: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  erroTexto: { ...textStyles.caption, flex: 1, color: colors.error.main },
  confirmar: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary.main,
  },
  confirmarDesabilitado: { backgroundColor: colors.neutral[300] },
  confirmarTexto: { ...textStyles.h5, color: '#FFFFFF', fontWeight: '800' as const },
  linhaPontos: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.md, marginBottom: spacing.xs },
  linhaTexto: { ...textStyles.caption, flex: 1 },
  linhaAlterar: { ...textStyles.caption, fontWeight: '700' as const, textDecorationLine: 'underline' },
});

export default EscolhaPontoSheet;
