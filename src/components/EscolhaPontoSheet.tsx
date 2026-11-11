/**
 * Folha de escolha de pontos ao confirmar presença: o aluno marca onde embarca (IDA), onde
 * desce (VOLTA) ou os dois (CIRCULAR) entre os pontos da rota e decide se o app lembra.
 * Também exporta a linha pequena "Embarca em X · Alterar" que os cards mostram depois.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { borderRadius, colors, shadows, spacing, textStyles } from '../theme';
import CaixaPontos from './CaixaPontos';
import Icon, { IconNames } from './Icon';
import ModalApp from './ModalApp';
import Tappable from './Tappable';
import {
  embarqueForaDaInstituicao,
  escolhaCompleta,
  instituicaoDiferente,
  inverterEscolha,
  pedeDesembarque,
  pedeEmbarque,
  pedeInstituicao,
  separarInstituicoes,
  tituloEscolha,
} from '../utils/presenca';

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
  /** Instituições cadastradas pelo aluno: aparecem primeiro na lista de troca */
  instituicoesDoAlunoIds: string[];
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
  instituicoesDoAlunoIds,
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
  const [buscandoOutra, setBuscandoOutra] = useState(false);
  // VOLTA: o aluno abriu a lista para embarcar em outro ponto que não a instituição.
  const [outroEmbarque, setOutroEmbarque] = useState(false);
  const [textoBusca, setTextoBusca] = useState('');
  // Pergunta de instituição diferente: vive dentro da folha, sem abrir outra janela por cima.
  const [confirmandoOutra, setConfirmandoOutra] = useState(false);

  useEffect(() => {
    if (visible) {
      setEscolha(inicial);
      setLembrar(false);
      setInstituicaoId(instituicaoAtualId);
      setTrocando(false);
      setBuscandoOutra(false);
      setOutroEmbarque(false);
      setTextoBusca('');
      setConfirmandoOutra(false);
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
  const { minhas, outras } = separarInstituicoes(instituicoes, instituicoesDoAlunoIds, textoBusca);
  // Sem nenhuma cadastrada na rota, a busca já vem aberta.
  const mostrarBusca = buscandoOutra || minhas.length === 0;
  const escolherInstituicao = (id: string) => {
    setInstituicaoId(id);
    setTrocando(false);
  };
  const volta = sentido === 'VOLTA';
  const embarqueLivre = volta && embarqueForaDaInstituicao(pontos, escolha.embarqueId);
  const mostrarOutroEmbarque = volta && (outroEmbarque || embarqueLivre);
  // Sem ponto marcado na lista de embarque, o embarque continua sendo a instituição.
  const escolhaFinal: Escolha = volta
    ? { ...escolha, embarqueId: embarqueLivre ? escolha.embarqueId : null }
    : escolha;
  const completa =
    escolhaCompleta(sentido, escolha) &&
    (!comInstituicao || escolhida !== null) &&
    !(outroEmbarque && !embarqueLivre);
  const verbo = sentido === 'IDA' ? 'desce' : 'embarca';
  const linhaInstituicao =
    !comInstituicao && instituicaoNome && sentido === 'IDA'
      ? `Você desce na ${instituicaoNome}`
      : !comInstituicao && instituicaoNome && sentido === 'VOLTA'
        ? `Você embarca na ${instituicaoNome}`
        : '';

  const confirmar = () => {
    // Instituição que o aluno cadastrou não pede confirmação extra.
    const cadastrada = !!instituicaoId && instituicoesDoAlunoIds.includes(instituicaoId);
    const outra = !cadastrada && instituicaoDiferente(instituicaoId, instituicaoPropriaId);
    if (!outra) {
      onConfirmar(escolhaFinal, lembrar, instituicaoId);
      return;
    }
    setConfirmandoOutra(true);
  };

  const nomePropria = propria ? ` (${propria.nome})` : '';
  const mensagemOutra = `Você ${verbo === 'desce' ? 'vai descer' : 'vai embarcar'} em ${escolhida?.nome ?? 'outra instituição'}, que não é a sua instituição${nomePropria}. Confirma?`;

  return (
    <ModalApp visible={visible} transparent animationType="slide" onRequestClose={onClose} accessibilityViewIsModal>
      <View style={styles.overlay}>
        <Tappable style={styles.backdrop} activeOpacity={1} onPress={onClose} accessibilityLabel="Fechar" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              {confirmandoOutra ? 'Outra instituição' : tituloEscolha(sentido)}
            </Text>
            <Tappable onPress={onClose} sombra={false} accessibilityLabel="Fechar" style={styles.fechar}>
              <Icon name={IconNames.close} size="md" color={colors.text.secondary} />
            </Tappable>
          </View>

          {confirmandoOutra ? (
            <View accessibilityRole="alert">
              <Text style={styles.outraTexto}>{mensagemOutra}</Text>
              <Tappable
                style={styles.confirmar}
                onPress={() => onConfirmar(escolhaFinal, lembrar, instituicaoId)}
                disabled={salvando}
                accessibilityLabel="Sim, confirmar">
                {salvando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmarTexto}>Sim, confirmar</Text>
                )}
              </Tappable>
              <Tappable
                style={styles.voltarBotao}
                onPress={() => setConfirmandoOutra(false)}
                sombra={false}
                accessibilityLabel="Voltar e escolher de novo">
                <Text style={styles.voltarTexto}>Voltar</Text>
              </Tappable>
            </View>
          ) : pontos === null ? (
            <ActivityIndicator color={colors.primary.main} style={styles.carregando} />
          ) : (
            <ScrollView style={styles.lista} nestedScrollEnabled>
              {comInstituicao && !mostrarOutroEmbarque ? (
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
                    <>
                      {minhas.length > 0 ? (
                        <Lista
                          titulo="Suas instituições"
                          pontos={minhas.map((i) => ({ id: i.id, apelido: i.nome }))}
                          marcado={instituicaoId}
                          onMarcar={escolherInstituicao}
                        />
                      ) : null}
                      {minhas.length > 0 && !buscandoOutra ? (
                        <Tappable
                          onPress={() => setBuscandoOutra(true)}
                          sombra={false}
                          accessibilityLabel="Buscar outra instituição">
                          <Text style={styles.linhaAlterar}>Outra instituição</Text>
                        </Tappable>
                      ) : null}
                      {mostrarBusca ? (
                        <View>
                          <TextInput
                            style={styles.busca}
                            value={textoBusca}
                            onChangeText={setTextoBusca}
                            placeholder="Buscar outra instituição da rota"
                            placeholderTextColor={colors.text.hint}
                            autoCorrect={false}
                            accessibilityLabel="Buscar outra instituição"
                          />
                          <Lista
                            titulo=""
                            pontos={outras.map((i) => ({ id: i.id, apelido: i.nome }))}
                            marcado={instituicaoId}
                            onMarcar={escolherInstituicao}
                          />
                          {outras.length === 0 ? (
                            <Text style={styles.instituicao}>Nenhuma instituição da rota com esse nome.</Text>
                          ) : null}
                        </View>
                      ) : null}
                    </>
                  )}
                </View>
              ) : null}
              {volta ? (
                <View style={styles.instituicaoBloco}>
                  {mostrarOutroEmbarque ? (
                    <>
                      <CaixaPontos
                        titulo="Onde você embarca"
                        pontos={lista}
                        marcado={embarqueLivre ? escolha.embarqueId : null}
                        onMarcar={(id) => setEscolha((atual) => ({ ...atual, embarqueId: id }))}
                      />
                      <Tappable
                        onPress={() => {
                          setOutroEmbarque(false);
                          setEscolha((atual) => ({ ...atual, embarqueId: null }));
                        }}
                        sombra={false}
                        accessibilityLabel="Embarcar na instituição">
                        <Text style={styles.linhaAlterar}>Embarcar na instituição</Text>
                      </Tappable>
                    </>
                  ) : (
                    <Tappable
                      onPress={() => setOutroEmbarque(true)}
                      sombra={false}
                      accessibilityLabel="Embarcar em outro ponto">
                      <Text style={styles.linhaAlterar}>Embarcar em outro ponto</Text>
                    </Tappable>
                  )}
                </View>
              ) : null}
              {pedeEmbarque(sentido) ? (
                <CaixaPontos
                  titulo={circular ? 'Onde você vai embarcar?' : comInstituicao ? 'Onde você embarca' : ''}
                  pontos={lista}
                  marcado={escolha.embarqueId}
                  onMarcar={(id) => setEscolha((atual) => ({ ...atual, embarqueId: id }))}
                />
              ) : null}
              {circular ? (
                <Tappable
                  onPress={() => setEscolha((atual) => inverterEscolha(atual))}
                  sombra={false}
                  accessibilityLabel="Inverter embarque e descida">
                  <Text style={styles.linhaAlterar}>Inverter (volta para casa)</Text>
                </Tappable>
              ) : null}
              {pedeDesembarque(sentido) ? (
                <CaixaPontos
                  titulo={circular ? 'Onde você vai descer?' : comInstituicao ? 'Onde você desce' : ''}
                  pontos={lista}
                  marcado={escolha.desembarqueId}
                  onMarcar={(id) => setEscolha((atual) => ({ ...atual, desembarqueId: id }))}
                />
              ) : null}
            </ScrollView>
          )}

          {confirmandoOutra ? null : (
            <>
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
            </>
          )}
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
  busca: {
    ...textStyles.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  instituicaoBloco: { marginBottom: spacing.sm },
  outraTexto: { ...textStyles.body, color: colors.text.secondary, lineHeight: 24, marginBottom: spacing.base },
  voltarBotao: { alignItems: 'center', justifyContent: 'center', minHeight: 52, marginTop: spacing.sm },
  voltarTexto: { ...textStyles.h5, color: colors.primary.main, fontWeight: '700' as const },
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
