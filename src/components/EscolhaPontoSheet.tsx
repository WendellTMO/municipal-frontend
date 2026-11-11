/**
 * Tela de pontos da presença: o aluno escolhe embarque e desembarque no mapa (ou pela busca) e
 * confirma. Os dois pontos valem para qualquer tipo de viagem. Também exporta o bloco pequeno
 * "Embarque / Desembarque / Alterar pontos" que os cards mostram depois de confirmar.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { borderRadius, colors, shadows, spacing, textStyles } from '../theme';
import Button from './Button';
import Icon, { IconNames } from './Icon';
import ModalApp from './ModalApp';
import Tappable from './Tappable';
import { MapaEscolhaPontos } from '../features/map/index';
import { requestLocationPermission } from '../features/map/hooks/useLocationPermission';
import { lerPosicao, PERMISSAO_NEGADA } from '../utils/lerPosicao';
import { formatarDistancia, pontoMaisProximo } from '../utils/pontoProximo';
import {
  aposTocarNoPonto,
  escolhaCompleta,
  filtrarPontos,
  inverterEscolha,
  linhaAtivaInicial,
} from '../utils/presenca';

export type PontoEscolha = {
  id: string;
  apelido: string;
  endereco?: string | null;
  latitude?: number;
  longitude?: number;
  ordem?: number;
  instituicao?: unknown;
};
export type Escolha = { embarqueId: string | null; desembarqueId: string | null };

export type EscolhaPontoSheetProps = {
  visible: boolean;
  pontos: PontoEscolha[] | null;
  inicial: Escolha;
  erro: string;
  salvando: boolean;
  onClose: () => void;
  onConfirmar: (escolha: Escolha) => void;
};

// O módulo nativo no celular e o do navegador na web, como no iniciar viagem.
let Geolocation: typeof navigator.geolocation | null = null;
try {
  Geolocation = require('@react-native-community/geolocation').default;
} catch {
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    Geolocation = navigator.geolocation;
  }
}

type Linha = 'emb' | 'des';

/** Selo colorido ao lado do nome: verde para Embarque, vermelho para Desembarque. */
const Selo = ({ tipo }: { tipo: Linha }) => (
  <View style={[styles.selo, tipo === 'des' ? styles.seloDesembarque : styles.seloEmbarque]}>
    <Text style={styles.seloTexto}>{tipo === 'des' ? 'Desembarque' : 'Embarque'}</Text>
  </View>
);

const LinhaDoPonto = ({
  titulo,
  ponto,
  tipo,
  ativa,
  onPress,
}: {
  titulo: string;
  ponto: PontoEscolha | null;
  tipo: Linha;
  ativa: boolean;
  onPress: () => void;
}) => (
  <Tappable
    style={[styles.linha, ativa && styles.linhaAtiva]}
    onPress={onPress}
    sombra={false}
    accessibilityRole="button"
    accessibilityState={{ selected: ativa }}
    accessibilityLabel={`${titulo}: ${ponto ? ponto.apelido : 'nenhum ponto escolhido'}. Toque para escolher no mapa`}>
    <View style={styles.linhaTexto}>
      <View style={styles.linhaTopo}>
        <Selo tipo={tipo} />
        {ponto ? (
          <Text style={[styles.linhaNome, styles.linhaNomeAoLado]} numberOfLines={2}>
            {ponto.apelido}
          </Text>
        ) : (
          <Text style={[styles.linhaVazia, styles.linhaNomeAoLado]}>Toque em um ponto do mapa</Text>
        )}
      </View>
      {ponto && ponto.endereco ? (
        <Text style={styles.linhaEndereco} numberOfLines={1}>
          {ponto.endereco}
        </Text>
      ) : null}
    </View>
  </Tappable>
);

const EscolhaPontoSheet = ({
  visible,
  pontos,
  inicial,
  erro,
  salvando,
  onClose,
  onConfirmar,
}: EscolhaPontoSheetProps) => {
  const { height } = useWindowDimensions();
  const [escolha, setEscolha] = useState<Escolha>(inicial);
  const [ativo, setAtivo] = useState<Linha>(linhaAtivaInicial(inicial));
  const [textoBusca, setTextoBusca] = useState('');
  const [usuario, setUsuario] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destaque, setDestaque] = useState<{ id: string; rotulo: string } | null>(null);
  const [lendo, setLendo] = useState(false);
  const [aviso, setAviso] = useState('');
  const giro = useRef(new Animated.Value(0)).current;
  const voltas = useRef(0);

  useEffect(() => {
    if (!visible) return;
    setEscolha(inicial);
    setAtivo(linhaAtivaInicial(inicial));
    setTextoBusca('');
    setUsuario(null);
    setDestaque(null);
    setAviso('');
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const todos = pontos ?? [];
  const noMapa: { id: string; apelido: string; latitude: number; longitude: number }[] = [];
  for (const ponto of todos) {
    if (typeof ponto.latitude === 'number' && typeof ponto.longitude === 'number') {
      noMapa.push({ id: ponto.id, apelido: ponto.apelido, latitude: ponto.latitude, longitude: ponto.longitude });
    }
  }
  const porId = (id: string | null): PontoEscolha | null => {
    for (const ponto of todos) {
      if (ponto.id === id) return ponto;
    }
    return null;
  };

  const tocar = (id: string) => {
    const proximo = aposTocarNoPonto(escolha, ativo, id);
    setEscolha(proximo.escolha);
    setAtivo(proximo.ativo);
  };

  const inverter = () => {
    setEscolha((atual) => inverterEscolha(atual));
    voltas.current += 1;
    Animated.timing(giro, { toValue: voltas.current, duration: 250, useNativeDriver: true }).start();
  };

  const localizar = async () => {
    setAviso('');
    if (!Geolocation) {
      setAviso('Este aparelho não informa a localização.');
      return;
    }
    setLendo(true);
    const permitido = await requestLocationPermission();
    if (!permitido) {
      setLendo(false);
      setAviso('Permita a localização para ver o ponto mais próximo.');
      return;
    }
    lerPosicao(
      Geolocation,
      (pos: { coords: { latitude: number; longitude: number } }) => {
        setLendo(false);
        const aqui = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setUsuario(aqui);
        const perto = pontoMaisProximo(noMapa, aqui.latitude, aqui.longitude);
        setDestaque(perto ? { id: (perto.ponto as { id: string }).id, rotulo: formatarDistancia(perto.metros) } : null);
        if (!perto) setAviso('Nenhum ponto da rota tem localização para comparar.');
      },
      (falha: { code?: number }) => {
        setLendo(false);
        setAviso(
          falha?.code === PERMISSAO_NEGADA
            ? 'Permita a localização para ver o ponto mais próximo.'
            : 'Não foi possível ler sua localização agora.',
        );
      },
    );
  };

  const resultados = textoBusca.trim() ? filtrarPontos(todos, textoBusca, 5).itens : [];
  const escolherDaBusca = (id: string) => {
    tocar(id);
    setTextoBusca('');
  };

  const rotacao = giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const completa = escolhaCompleta(escolha);
  const semPontos = pontos !== null && noMapa.length === 0;

  return (
    <ModalApp visible={visible} animationType="slide" onRequestClose={onClose} accessibilityViewIsModal>
      <SafeAreaView style={styles.tela} edges={['top', 'bottom']}>
        <View style={styles.cabecalho}>
          <Text style={styles.titulo} accessibilityRole="header">
            Seus pontos
          </Text>
          <Tappable onPress={onClose} sombra={false} accessibilityLabel="Fechar" style={styles.fechar}>
            <Icon name={IconNames.close} size="md" color={colors.text.secondary} />
          </Tappable>
        </View>

        {pontos === null ? (
          <ActivityIndicator color={colors.primary.main} style={styles.carregando} />
        ) : (
          <View style={styles.conteudo}>
            <View>
              <MapaEscolhaPontos
                pontos={noMapa}
                embarqueId={escolha.embarqueId}
                desembarqueId={escolha.desembarqueId}
                destaque={destaque}
                usuario={usuario}
                aoTocarPonto={tocar}
                altura={Math.max(240, Math.round(height * 0.4))}
              />
              <View style={styles.busca}>
                <View style={styles.buscaCampo}>
                  <Icon name={IconNames.search} size="md" color={colors.text.secondary} />
                  <TextInput
                    style={styles.buscaTexto}
                    value={textoBusca}
                    onChangeText={setTextoBusca}
                    placeholder="Buscar ponto pelo nome"
                    placeholderTextColor={colors.text.hint}
                    autoCorrect={false}
                    accessibilityLabel="Buscar ponto pelo nome"
                  />
                </View>
                {textoBusca.trim() ? (
                  <View style={styles.resultados}>
                    {resultados.map((ponto) => (
                      <Tappable
                        key={ponto.id}
                        style={styles.resultado}
                        onPress={() => escolherDaBusca(ponto.id)}
                        sombra={false}
                        accessibilityRole="button"
                        accessibilityLabel={ponto.apelido}>
                        <Text style={styles.linhaNome}>{ponto.apelido}</Text>
                        {ponto.endereco ? <Text style={styles.linhaEndereco}>{ponto.endereco}</Text> : null}
                      </Tappable>
                    ))}
                    {resultados.length === 0 ? <Text style={styles.semResultado}>Nenhum ponto encontrado.</Text> : null}
                  </View>
                ) : null}
              </View>
              <Tappable
                style={styles.localizar}
                onPress={localizar}
                disabled={lendo}
                accessibilityRole="button"
                accessibilityLabel="Mostrar minha localização e o ponto mais próximo">
                {lendo ? (
                  <ActivityIndicator color={colors.primary.main} />
                ) : (
                  <Icon name={IconNames.myLocation} size="lg" color={colors.primary.main} />
                )}
              </Tappable>
            </View>

            <View style={styles.painel}>
              <View>
                <LinhaDoPonto
                  titulo="Embarque"
                  tipo="emb"
                  ponto={porId(escolha.embarqueId)}
                  ativa={ativo === 'emb'}
                  onPress={() => setAtivo('emb')}
                />
                <View style={styles.espaco} />
                <LinhaDoPonto
                  titulo="Desembarque"
                  tipo="des"
                  ponto={porId(escolha.desembarqueId)}
                  ativa={ativo === 'des'}
                  onPress={() => setAtivo('des')}
                />
                <Tappable
                  style={[styles.inverter, !escolha.embarqueId && !escolha.desembarqueId && styles.inverterDesabilitado]}
                  onPress={inverter}
                  disabled={!escolha.embarqueId && !escolha.desembarqueId}
                  sombra={false}
                  accessibilityRole="button"
                  accessibilityLabel="Inverter embarque e desembarque">
                  <Animated.View style={{ transform: [{ rotate: rotacao }] }}>
                    <Icon name="swap-vert" size="lg" color={colors.primary.main} />
                  </Animated.View>
                </Tappable>
              </View>

              {semPontos ? <Text style={styles.aviso}>Esta rota ainda não tem pontos com localização.</Text> : null}
              {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}
              {erro ? (
                <View style={styles.erro} accessibilityRole="alert">
                  <Icon name={IconNames.warning} size="sm" color={colors.error.main} />
                  <Text style={styles.erroTexto}>{erro}</Text>
                </View>
              ) : null}

              <Button
                title="Confirmar presença"
                fullWidth
                onPress={() => onConfirmar(escolha)}
                disabled={!completa}
                loading={salvando}
                style={styles.confirmar}
              />
            </View>
          </View>
        )}
      </SafeAreaView>
    </ModalApp>
  );
};

/** Bloco do card depois de confirmar: embarque e desembarque em linhas separadas e Alterar pontos. */
export const LinhaDosPontos = ({
  embarque,
  desembarque,
  onAlterar,
  claro = false,
}: {
  embarque: string;
  desembarque: string;
  onAlterar: () => void;
  claro?: boolean;
}) => {
  if (!embarque && !desembarque) return null;
  const cor = claro ? '#FFFFFF' : colors.text.primary;
  return (
    <View style={styles.cartao}>
      {embarque ? (
        <View style={styles.cartaoLinha}>
          <Selo tipo="emb" />
          <Text style={[styles.cartaoNome, { color: cor }]}>{embarque}</Text>
        </View>
      ) : null}
      {desembarque ? (
        <View style={styles.cartaoLinha}>
          <Selo tipo="des" />
          <Text style={[styles.cartaoNome, { color: cor }]}>{desembarque}</Text>
        </View>
      ) : null}
      <Tappable
        onPress={onAlterar}
        sombra={false}
        style={[styles.alterar, { borderColor: cor }]}
        accessibilityRole="button"
        accessibilityLabel="Alterar pontos">
        <Text style={[styles.alterarTexto, { color: cor }]}>Alterar pontos</Text>
      </Tappable>
    </View>
  );
};

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.background.paper },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  titulo: { ...textStyles.h3, color: colors.text.primary },
  fechar: { padding: spacing.sm },
  carregando: { marginVertical: spacing.xxl },
  conteudo: { flex: 1, paddingBottom: spacing.base },
  // zIndex alto: no navegador as camadas do Leaflet ficam por cima de tudo que não declara camada.
  busca: { position: 'absolute', top: spacing.md, left: spacing.md, right: spacing.md, zIndex: 1000 },
  buscaCampo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.base,
    borderRadius: 23,
    backgroundColor: colors.background.paper,
    ...shadows.md,
  },
  buscaTexto: { ...textStyles.body, flex: 1, color: colors.text.primary, paddingVertical: 0 },
  resultados: { marginTop: spacing.xs, borderRadius: borderRadius.md, backgroundColor: colors.background.paper, overflow: 'hidden', ...shadows.md },
  resultado: { minHeight: 52, justifyContent: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.light },
  semResultado: { ...textStyles.body, color: colors.text.secondary, padding: spacing.base },
  localizar: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    zIndex: 1000,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.paper,
    ...shadows.md,
  },
  painel: { paddingHorizontal: spacing.lg, paddingTop: spacing.base },
  espaco: { height: spacing.sm },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingLeft: spacing.base,
    paddingRight: 72,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.light,
    backgroundColor: colors.background.paper,
  },
  linhaAtiva: { borderColor: colors.primary.main, backgroundColor: colors.primary.lighter },
  linhaTexto: { flex: 1 },
  linhaTopo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  linhaNomeAoLado: { flex: 1 },
  // Fundos escuros o bastante para o texto branco passar no contraste (mínimo 4,5:1).
  // Mesma largura nos dois selos: os nomes começam alinhados.
  selo: { minWidth: 104, alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.md },
  seloEmbarque: { backgroundColor: '#15803D' },
  seloDesembarque: { backgroundColor: '#B91C1C' },
  seloTexto: { ...textStyles.caption, color: '#FFFFFF', fontWeight: '700' as const },
  linhaNome: { ...textStyles.body, fontWeight: '700' as const, color: colors.text.primary },
  linhaEndereco: { ...textStyles.caption, color: colors.text.secondary },
  linhaVazia: { ...textStyles.body, color: colors.text.secondary },
  inverter: {
    position: 'absolute',
    right: spacing.sm,
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.paper,
  },
  inverterDesabilitado: { backgroundColor: colors.neutral[100], opacity: 0.6 },
  aviso: { ...textStyles.body, color: colors.text.secondary, marginTop: spacing.sm },
  erro: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  erroTexto: { ...textStyles.caption, flex: 1, color: colors.error.main },
  confirmar: { minHeight: 54, marginTop: spacing.base },
  cartao: { marginTop: spacing.md, gap: spacing.sm },
  cartaoLinha: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cartaoNome: { ...textStyles.body, flex: 1, fontWeight: '700' as const },
  alterar: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: borderRadius.lg, marginTop: spacing.xs },
  alterarTexto: { ...textStyles.button, fontWeight: '700' as const },
});

export default EscolhaPontoSheet;
