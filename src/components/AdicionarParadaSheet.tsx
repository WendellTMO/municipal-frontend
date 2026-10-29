/**
 * Folha "Nova parada" da viagem em andamento. Campo único (endereço ou "lat, lng"),
 * busca entre os pontos já cadastrados e escolha de posição. Faz o POST e devolve as paradas.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ModalApp from './ModalApp';
import Icon, { IconNames } from './Icon';
import { colors, spacing, textStyles, fontWeight, borderRadius } from '../theme';
import { motoristaService, CorpoNovaParada } from '../services/motoristaService';
import { unwrapItems } from '../types';
import {
  filtrarPontos,
  interpretarEntrada,
  nomeDoPonto,
  detalheDoPonto,
  nomeSugeridoCoordenadas,
  textoContagem,
} from '../utils/pontosRota';
import {
  buscarEnderecos,
  nomeSugeridoEndereco,
  ESPERA_BUSCA_MS,
  MIN_LETRAS_ENDERECO,
} from '../utils/enderecoNominatim';
import {
  montarCorpoParada,
  mensagemErroParada,
  paradasDaResposta,
  POSICAO_PROXIMA,
  POSICAO_FIM,
} from '../utils/novaParada';

type Props = {
  visible: boolean;
  viagemId?: string;
  idsNaViagem: string[];
  onClose: () => void;
  onAdicionada: (paradas: ReturnType<typeof paradasDaResposta>) => void;
};

const POSICOES = [
  { id: POSICAO_PROXIMA, texto: 'Depois da última parada visitada' },
  { id: POSICAO_FIM, texto: 'No fim da viagem' },
];

const AdicionarParadaSheet = ({ visible, viagemId, idsNaViagem, onClose, onAdicionada }: Props) => {
  const insets = useSafeAreaInsets();
  const [modo, setModo] = useState<'novo' | 'existente'>('novo');
  const [entrada, setEntrada] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [escolhido, setEscolhido] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);
  const [pino, setPino] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nome, setNome] = useState('');
  const [nomeEditado, setNomeEditado] = useState(false);
  const [termo, setTermo] = useState('');
  const [pontos, setPontos] = useState<any[]>([]);
  const [pontoExistente, setPontoExistente] = useState<any>(null);
  const [posicao, setPosicao] = useState(POSICAO_PROXIMA);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const buscaAtual = useRef(0);

  // Abre sempre limpa e carrega os pontos da prefeitura para a busca.
  useEffect(() => {
    if (!visible) return;
    buscaAtual.current += 1;
    setModo('novo');
    setEntrada('');
    setResultados([]);
    setEscolhido(null);
    setBuscando(false);
    setPino(null);
    setNome('');
    setNomeEditado(false);
    setTermo('');
    setPontoExistente(null);
    setPosicao(POSICAO_PROXIMA);
    setErro('');
    motoristaService
      .listarPontos()
      .then((resp) => setPontos((unwrapItems(resp) as any[]) || []))
      .catch(() => setPontos([]));
  }, [visible]);

  const sugerirNome = (sugestao: string) => {
    if (!nomeEditado) setNome(sugestao);
  };

  const escolherResultado = (r: any) => {
    setEscolhido(r);
    setPino({ latitude: parseFloat(r.lat), longitude: parseFloat(r.lon) });
    sugerirNome(nomeSugeridoEndereco(r));
  };

  const interpretacao: any = interpretarEntrada(entrada);

  // Par de coordenadas vira pino direto; texto vira busca de endereço depois de uma pausa.
  useEffect(() => {
    if (!visible || modo !== 'novo') return undefined;
    if (interpretacao.tipo === 'coordenadas') {
      buscaAtual.current += 1;
      setResultados([]);
      setEscolhido(null);
      setBuscando(false);
      const local = { latitude: interpretacao.latitude, longitude: interpretacao.longitude };
      setPino(local);
      sugerirNome(nomeSugeridoCoordenadas(local));
      return undefined;
    }
    setPino(null);
    setResultados([]);
    setEscolhido(null);
    if (interpretacao.tipo !== 'endereco' || interpretacao.texto.length < MIN_LETRAS_ENDERECO) {
      return undefined;
    }
    const espera = setTimeout(async () => {
      const minha = ++buscaAtual.current;
      setBuscando(true);
      try {
        const data = await buscarEnderecos(interpretacao.texto);
        if (minha !== buscaAtual.current) return;
        if (data && data.length > 0) {
          setResultados(data);
          escolherResultado(data[0]);
        } else {
          setErro('Nenhum resultado. Tente um endereço mais específico.');
        }
      } catch {
        if (minha === buscaAtual.current) setErro('Não foi possível buscar o endereço agora. Tente novamente.');
      } finally {
        if (minha === buscaAtual.current) setBuscando(false);
      }
    }, ESPERA_BUSCA_MS);
    return () => clearTimeout(espera);
  }, [entrada, modo, visible]);

  const busca = useMemo(() => filtrarPontos(pontos, termo), [pontos, termo]);
  const corpo: CorpoNovaParada | null = montarCorpoParada({
    pontoExistente: modo === 'existente' ? pontoExistente : null,
    pino: modo === 'novo' ? pino : null,
    nome,
    posicao,
  }) as CorpoNovaParada | null;

  const adicionar = async () => {
    if (!corpo || !viagemId) return;
    setSalvando(true);
    setErro('');
    try {
      const resposta = await motoristaService.adicionarPontoNaViagem(viagemId, corpo);
      onAdicionada(paradasDaResposta(resposta.pontos));
    } catch (e) {
      setErro(mensagemErroParada(e));
    } finally {
      setSalvando(false);
    }
  };

  const mudarModo = (novo: 'novo' | 'existente') => {
    setModo(novo);
    setErro('');
  };

  const campo = (valor: string, aoMudar: (t: string) => void, placeholder: string, rotulo: string) => (
    <View style={styles.campoBusca}>
      <Icon name={IconNames.search} size="md" color={colors.primary.main} />
      <TextInput
        style={styles.campoBuscaTexto}
        value={valor}
        onChangeText={(t) => {
          setErro('');
          aoMudar(t);
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.text.disabled}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={rotulo}
      />
      {valor !== '' ? (
        <TouchableOpacity
          style={styles.limpar}
          onPress={() => aoMudar('')}
          accessibilityRole="button"
          accessibilityLabel="Limpar">
          <Icon name={IconNames.close} size="md" color={colors.text.secondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const linhaStatus = (texto: string, ok: boolean) => (
    <View style={styles.status}>
      {ok ? <Icon name={IconNames.check} size="sm" color={colors.success.dark} /> : null}
      <Text style={[styles.statusTexto, ok && { color: colors.success.dark }]} numberOfLines={2}>
        {texto}
      </Text>
    </View>
  );

  let status: React.ReactNode = null;
  if (interpretacao.tipo === 'coordenadas') {
    status = linhaStatus('Coordenadas reconhecidas', true);
  } else if (buscando) {
    status = linhaStatus('Buscando endereço...', false);
  } else if (escolhido) {
    status = linhaStatus(escolhido.display_name, true);
  } else if (interpretacao.tipo === 'endereco' && interpretacao.texto.length < MIN_LETRAS_ENDERECO) {
    status = linhaStatus('Continue digitando o endereço.', false);
  }

  const outros: any[] = [];
  for (const r of resultados) {
    if (r !== escolhido) outros.push(r);
  }

  return (
    <ModalApp visible={visible} transparent animationType="slide" onRequestClose={onClose} accessibilityViewIsModal>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        />
        <View style={[styles.folha, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.handle} />
          <View style={styles.cabecalho}>
            <Text style={styles.titulo} accessibilityRole="header">Nova parada</Text>
            <TouchableOpacity
              style={styles.fechar}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar">
              <Icon name={IconNames.close} size="md" color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.abas}>
            {[
              { id: 'novo', texto: 'Novo ponto' },
              { id: 'existente', texto: 'Ponto existente' },
            ].map((aba) => (
              <TouchableOpacity
                key={aba.id}
                style={[styles.aba, modo === aba.id && styles.abaAtiva]}
                onPress={() => mudarModo(aba.id as 'novo' | 'existente')}
                accessibilityRole="tab"
                accessibilityState={{ selected: modo === aba.id }}>
                <Text style={[styles.abaTexto, modo === aba.id && styles.abaTextoAtivo]} numberOfLines={1}>
                  {aba.texto}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <ScrollView style={styles.rolagem} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.conteudo}>
            {modo === 'novo' ? (
              <>
                {campo(entrada, setEntrada, 'Endereço ou latitude, longitude', 'Endereço ou coordenadas')}
                {status}
                <Text style={styles.rotulo}>Nome do ponto</Text>
                <TextInput
                  style={styles.campoNome}
                  value={nome}
                  maxLength={100}
                  onChangeText={(t) => {
                    setNome(t);
                    setNomeEditado(true);
                  }}
                  placeholder="Ex: Terminal Central"
                  placeholderTextColor={colors.text.disabled}
                  accessibilityLabel="Nome do ponto"
                />
                {outros.length > 0 ? <Text style={styles.rotulo}>Outros resultados</Text> : null}
                {outros.slice(0, 3).map((r) => (
                  <TouchableOpacity
                    key={String(r.place_id)}
                    style={styles.resultado}
                    onPress={() => escolherResultado(r)}
                    accessibilityRole="button">
                    <Icon name={IconNames.location} size="md" color={colors.text.secondary} />
                    <Text style={[styles.detalhe, { flex: 1 }]} numberOfLines={2}>
                      {r.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <>
                {campo(termo, setTermo, 'Buscar ponto pelo nome', 'Buscar ponto pelo nome')}
                {termo.trim() === '' ? (
                  <Text style={styles.rotulo}>Digite para buscar entre os {pontos.length} pontos do município.</Text>
                ) : (
                  <Text style={styles.rotulo}>{textoContagem(busca.total, pontos.length)}</Text>
                )}
                {busca.itens.map((p: any) => {
                  const naViagem = idsNaViagem.includes(String(p.id));
                  const marcado = pontoExistente && String(pontoExistente.id) === String(p.id);
                  return (
                    <TouchableOpacity
                      key={String(p.id)}
                      style={[styles.resultado, marcado && styles.resultadoMarcado]}
                      onPress={() => setPontoExistente(p)}
                      disabled={naViagem}
                      accessibilityRole="button"
                      accessibilityState={{ selected: !!marcado, disabled: naViagem }}
                      accessibilityLabel={`Escolher ${nomeDoPonto(p)}`}>
                      <Icon name={IconNames.location} size="md" color={colors.text.secondary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.nome} numberOfLines={1}>{nomeDoPonto(p)}</Text>
                        <Text style={styles.detalhe} numberOfLines={1}>{detalheDoPonto(p)}</Text>
                      </View>
                      {naViagem ? <Text style={styles.selo}>Na viagem</Text> : null}
                      {marcado ? <Icon name={IconNames.check} size="md" color={colors.primary.main} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

          </ScrollView>
          <View style={styles.rodape}>
            <Text style={[styles.rotulo, { marginTop: 0 }]}>Onde entra na viagem</Text>
            <View style={styles.posicoes}>
              {POSICOES.map((o) => (
                <TouchableOpacity
                  key={o.id}
                  style={[styles.posicao, posicao === o.id && styles.posicaoAtiva]}
                  onPress={() => setPosicao(o.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: posicao === o.id }}>
                  <Text style={[styles.posicaoTexto, posicao === o.id && styles.abaTextoAtivo]}>{o.texto}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {erro ? (
              <Text style={styles.erro} accessibilityLiveRegion="polite">{erro}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.botao, (!corpo || salvando) && styles.botaoDesativado]}
              onPress={adicionar}
              disabled={!corpo || salvando}
              accessibilityRole="button"
              accessibilityState={{ disabled: !corpo || salvando }}
              accessibilityLabel="Adicionar parada">
              {salvando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Icon name={IconNames.add} size="md" color="#FFFFFF" />
                  <Text style={styles.botaoTexto}> Adicionar parada</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ModalApp>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  folha: {
    maxHeight: '92%',
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.base,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { ...textStyles.h3, color: colors.text.primary },
  fechar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  abas: { flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: colors.neutral[100], marginVertical: spacing.sm },
  aba: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 11, paddingHorizontal: 4 },
  abaAtiva: { backgroundColor: colors.background.paper },
  abaTexto: { ...textStyles.bodySmall, fontWeight: fontWeight.semiBold, color: colors.text.secondary },
  abaTextoAtivo: { color: colors.primary.main },
  rolagem: { flexShrink: 1 },
  conteudo: { paddingBottom: spacing.sm },
  rodape: { paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.neutral[100] },
  campoBusca: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 2,
    borderColor: colors.primary.main,
    borderRadius: 14,
    paddingLeft: spacing.sm,
    backgroundColor: colors.background.paper,
  },
  campoBuscaTexto: { flex: 1, ...textStyles.body, color: colors.text.primary, paddingHorizontal: spacing.sm, outlineStyle: 'none' } as any,
  limpar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  status: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginVertical: spacing.sm },
  statusTexto: { ...textStyles.caption, color: colors.text.secondary, flex: 1 },
  rotulo: { ...textStyles.caption, color: colors.text.secondary, marginBottom: spacing.xs, marginTop: spacing.xs },
  campoNome: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    ...textStyles.body,
    color: colors.text.primary,
    outlineStyle: 'none',
  } as any,
  resultado: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  resultadoMarcado: { backgroundColor: colors.primary.lighter },
  nome: { ...textStyles.body, fontWeight: fontWeight.semiBold, color: colors.text.primary },
  detalhe: { ...textStyles.caption, color: colors.text.secondary },
  selo: { ...textStyles.caption, fontWeight: fontWeight.semiBold, color: colors.success.dark },
  posicoes: { gap: spacing.xs },
  posicao: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  posicaoAtiva: { borderColor: colors.primary.main, backgroundColor: colors.primary.lighter },
  posicaoTexto: { ...textStyles.bodySmall, fontWeight: fontWeight.semiBold, color: colors.text.secondary },
  erro: { ...textStyles.bodySmall, color: colors.error.main, marginTop: spacing.sm },
  botao: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  botaoTexto: { ...textStyles.button, fontWeight: fontWeight.bold, color: '#FFFFFF' },
  botaoDesativado: { opacity: 0.5 },
});

export default AdicionarParadaSheet;
