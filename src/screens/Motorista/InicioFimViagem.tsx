/**
 * InicioFimViagem — Driver trip control + live navigation screen.
 *
 * Driver-safety principles:
 *  - During active trip: map fills the screen; controls float at edges
 *  - All action buttons are very large (min-height 72-88 dp)
 *  - Back button is disabled while driving
 *  - "Avisar alunos" opens a modal with pre-defined templates (one tap = done)
 *  - "Reportar problema" uses ReportSheet with category chips (no mandatory typing)
 *  - Finalizar requires confirmation dialog to prevent accidental taps
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
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
import TelaSegura from '../../components/TelaSegura';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  shadows,
  spacing,
  textStyles,
} from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import { ReportSheet } from '../../components';
import { CHIPS } from '../../components/ReportSheet';
import { LocationMap, StaticRouteMap, useArrivalDetection, useRotaPlanejada, normalizeRoutePoints } from '../../features/map/index';
import SubHeader from '../../components/SubHeader';
import ConfirmacaoTelaCheia from '../../components/ConfirmacaoTelaCheia';
import { useFeedbackPadrao } from '../../components/FeedbackPadraoContext';
import DialogoConfirmacao from '../../components/DialogoConfirmacao';
import { agruparConfirmadosPorInstituicao, montarParadas } from '../../utils/paradasViagem';
import { proximoIntervaloMs } from '../../utils/intervaloEnvio';
import { horaCurta } from '../../utils/viagemPainel';
import { mesclarOrdem, montarListaPut, ordemMudou, reordenarPontosPorInstituicao } from '../../utils/ordemInstituicoes';
import ListaReordenavel from '../../components/ListaReordenavel';
import { motoristaService } from '../../services/motoristaService';
import { createNotificacao } from '../../services/notificacaoService';
import { useToast } from '../../components/Toast';
import { unwrapItems } from '../../types';
import type { OrdemInstituicao } from '../../services/motoristaService';
import type { InstituicaoResponse, PontoFlatResponse, TipoOcorrencia } from '../../types';
import { withFabSpace } from '../../config/feedback';
import ModalApp from '../../components/ModalApp';
import { formatarSentido } from '../../utils/formatarSentido';

type GrupoConfirmado = { id: string | null; nome: string; tipo: string | null; quantidade: number; semInstituicao: boolean };

type RootParamList = Record<string, object | undefined>;
type Props = {
  navigation: NativeStackNavigationProp<RootParamList>;
  route: RouteProp<{ InicioFimViagem: { viagem: Record<string, unknown> } }, 'InicioFimViagem'>;
};

let Geolocation: typeof navigator.geolocation | null = null;
try {
  Geolocation = require('@react-native-community/geolocation').default;
} catch {
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    Geolocation = navigator.geolocation;
  }
}

const GPS_SEND_INTERVAL_MS = 20_000;
const AVISO_MIN = 3;
const AVISO_MAX = 300;

const BROADCAST_TEMPLATES = [
  { id: 'saindo', label: 'Saindo agora', icon: IconNames.play, msg: 'O ônibus está saindo agora. Dirija-se ao ponto!' },
  { id: 'atrasado', label: 'Estou atrasado', icon: IconNames.schedule, msg: 'O ônibus está atrasado. Aguarde no ponto.' },
  { id: 'chegando', label: 'Chegando ao ponto', icon: IconNames.bus, msg: 'O ônibus está chegando ao seu ponto.' },
  { id: 'cancelado', label: 'Viagem cancelada', icon: IconNames.close, msg: 'Atenção: a viagem de hoje foi cancelada. Procure outra forma de transporte.' },
];

const InicioFimViagem: React.FC<Props> = ({ navigation, route }) => {
  const viagemParam = route?.params?.viagem as Record<string, unknown> | undefined;
  const toast = useToast();

  const [viagem, setViagem] = useState(viagemParam);
  const [viagemIniciada, setViagemIniciada] = useState(viagemParam?.status === 'EM_ANDAMENTO');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [pontosRota, setPontosRota] = useState<PontoFlatResponse[]>([]);
  const [reportVisible, setReportVisible] = useState(false);
  const [broadcastVisible, setBroadcastVisible] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [instituicoes, setInstituicoes] = useState<InstituicaoResponse[]>([]);
  const [concluidas, setConcluidas] = useState(0);
  const [listaAberta, setListaAberta] = useState(false);
  // Durante a viagem o botão de feedback fica no alto, fora do painel de baixo.
  useFeedbackPadrao(viagemIniciada ? 'topo' : null);
  const [finalizarVisivel, setFinalizarVisivel] = useState(false);
  const [iniciarVisivel, setIniciarVisivel] = useState(false);
  const [ordemSalva, setOrdemSalva] = useState<OrdemInstituicao[]>([]);
  const [gruposOrdenados, setGruposOrdenados] = useState<GrupoConfirmado[]>([]);
  const [gruposIniciais, setGruposIniciais] = useState<GrupoConfirmado[]>([]);
  const [arrastando, setArrastando] = useState(false);
  const [avisoTexto, setAvisoTexto] = useState('');
  const [tipoProblema, setTipoProblema] = useState<TipoOcorrencia | null>(null);
  const [posMotorista, setPosMotorista] = useState<{ latitude: number; longitude: number } | null>(null);
  const [alturaTopo, setAlturaTopo] = useState(0);
  const [centralizarTick, setCentralizarTick] = useState(0);
  const [alturaPainel, setAlturaPainel] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentViagem = (viagem ?? viagemParam) as Record<string, unknown>;
  const viagemId = (currentViagem?.id ?? viagemParam?.id) as string | undefined;
  const rotaId = currentViagem?.rota_id as string | undefined;

  // Load fresh trip status and route points
  useEffect(() => {
    const init = async () => {
      if (!viagemParam?.id) {
        setLoadingStatus(false);
        return;
      }
      try {
        setLoadingStatus(true);

        // Fetch fresh trip state
        const viagens = await motoristaService.listarViagens().then(unwrapItems);
        const viagemAtual = (viagens as Record<string, unknown>[]).find(
          (v) => v.id === viagemParam.id,
        );
        if (viagemAtual) {
          setViagem(viagemAtual);
          const emAndamento = viagemAtual.status === 'EM_ANDAMENTO';
          setViagemIniciada(emAndamento);
          if (emAndamento && viagemAtual.inicio_real) {
            const inicioDate = new Date(viagemAtual.inicio_real as string);
            setTempoDecorrido(Math.max(0, Math.floor((Date.now() - inicioDate.getTime()) / 1000)));
          }
        }

        // Fetch route points for map
        const rid = (viagemAtual?.rota_id ?? viagemParam?.rota_id) as string | undefined;
        if (rid) {
          const pontosResp = await motoristaService.listarPontosRota(rid);
          const items = unwrapItems(pontosResp) as PontoFlatResponse[];
          setPontosRota(items);
        }

        // Ordem salva das instituições da rota. Opcional: sem ela vale a ordem do dia.
        if (rid) {
          try {
            const ordem = await motoristaService.obterOrdemInstituicoes(rid);
            setOrdemSalva(ordem.items ?? []);
          } catch {
            setOrdemSalva([]);
          }
        }

        // Instituições de ensino, para marcar as paradas que são escolas. Opcional.
        try {
          const lista = await motoristaService.listarInstituicoes();
          setInstituicoes((lista.items ?? []) as InstituicaoResponse[]);
        } catch {
          setInstituicoes([]);
        }
      } catch {
        setViagemIniciada(viagemParam?.status === 'EM_ANDAMENTO');
      } finally {
        setLoadingStatus(false);
      }
    };
    init();
  }, [viagemParam?.id]);

  // Elapsed timer
  useEffect(() => {
    if (viagemIniciada) {
      intervalRef.current = setInterval(() => setTempoDecorrido((p) => p + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [viagemIniciada]);

  // GPS broadcast to backend
  const viagemIdRef = useRef<string | undefined>(viagemId);
  viagemIdRef.current = viagemId;

  useEffect(() => {
    if (!viagemIniciada || !viagemIdRef.current || !Geolocation) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let parado = false;

    // Um único setTimeout encadeado: só agenda o próximo depois de terminar o atual.
    const agendar = (ms: number) => {
      if (parado) return;
      timer = setTimeout(sendPos, ms);
    };

    const sendPos = () => {
      Geolocation!.getCurrentPosition(
        (pos) => {
          setPosMotorista({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          motoristaService
            .enviarLocalizacao(viagemIdRef.current!, {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            })
            .then((resp) => agendar(proximoIntervaloMs(resp, GPS_SEND_INTERVAL_MS)))
            .catch(() => agendar(GPS_SEND_INTERVAL_MS));
        },
        () => agendar(GPS_SEND_INTERVAL_MS),
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5_000 },
      );
    };

    sendPos();
    return () => {
      parado = true;
      if (timer) clearTimeout(timer);
    };
  }, [viagemIniciada]);

  // Paradas válidas (com coordenadas), com estado e instituição de ensino.
  const pontosOrdenados = reordenarPontosPorInstituicao(pontosRota, instituicoes, ordemSalva);
  const pontosValidos = normalizeRoutePoints(pontosOrdenados);
  const paradas = montarParadas(pontosValidos, concluidas, instituicoes);
  const proxima = paradas.find((p) => p.estado === 'proxima') ?? null;
  const gruposConfirmados = agruparConfirmadosPorInstituicao(
    (currentViagem?.alunos as Record<string, unknown>[] | undefined) ?? [],
  );
  const todasFeitas = pontosValidos.length > 0 && concluidas >= pontosValidos.length;

  const marcarChegada = () => {
    setConcluidas((n) => (n < pontosValidos.length ? n + 1 : n));
  };

  // Chegada automática a menos de 50 m da próxima parada; o botão "Cheguei" cobre o resto.
  useArrivalDetection({
    userLocation: posMotorista,
    destination: proxima ? proxima.ponto : null,
    thresholdMeters: 50,
    onArrive: marcarChegada,
  });

  // Rota planejada pelas ruas ate o fim da lista; recalcula ao visitar parada e ao sair do traçado.
  const paradasRestantes: { latitude: number; longitude: number }[] = [];
  for (const ponto of pontosValidos.slice(concluidas)) {
    paradasRestantes.push({ latitude: ponto.latitude, longitude: ponto.longitude });
  }
  const trajeto = useRotaPlanejada(posMotorista, paradasRestantes, viagemIniciada);

  // Escape (web) e voltar do sistema (Android) fecham a lista de paradas.
  useEffect(() => {
    if (!listaAberta) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setListaAberta(false);
    };
    if (Platform.OS === 'web') {
      window.addEventListener('keydown', aoTeclar);
      return () => window.removeEventListener('keydown', aoTeclar);
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setListaAberta(false);
      return true;
    });
    return () => sub.remove();
  }, [listaAberta]);

  const formatarTempo = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
  };

  // Só o botão da tela de instituições chama o endpoint de iniciar.
  const abrirIniciar = () => {
    const ordenados = mesclarOrdem(gruposConfirmados, ordemSalva) as GrupoConfirmado[];
    setGruposOrdenados(ordenados);
    setGruposIniciais(ordenados);
    setIniciarVisivel(true);
  };

  // A falha ao salvar a ordem não impede o início da viagem.
  const salvarOrdemSeMudou = async () => {
    if (!rotaId || !ordemMudou(gruposIniciais, gruposOrdenados)) return;
    try {
      const resposta = await motoristaService.salvarOrdemInstituicoes(
        rotaId,
        montarListaPut(gruposOrdenados, ordemSalva),
      );
      setOrdemSalva(resposta.items ?? []);
    } catch {
      toast.warning('Não foi possível salvar a ordem das instituições. A viagem inicia mesmo assim.');
    }
  };

  const handleIniciarViagem = async () => {
    if (!viagemId) return;
    setIniciarVisivel(false);
    try {
      setLoading(true);
      await salvarOrdemSeMudou();
      await motoristaService.iniciarViagem(viagemId);
      setViagemIniciada(true);
      setTempoDecorrido(0);

      // Fetch points if not loaded yet
      if (pontosRota.length === 0 && rotaId) {
        const pontosResp = await motoristaService.listarPontosRota(rotaId);
        setPontosRota(unwrapItems(pontosResp) as PontoFlatResponse[]);
      }

      AccessibilityInfo.announceForAccessibility('Viagem iniciada com sucesso');
      toast.success('Viagem iniciada!');
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Erro ao iniciar viagem');
    } finally {
      setLoading(false);
    }
  };

  // Só o "Sim, finalizar" da tela de confirmação chama o endpoint.
  const confirmarFinalizar = async () => {
    try {
      setLoading(true);
      await motoristaService.finalizarViagem(viagemId!);
      setFinalizarVisivel(false);
      AccessibilityInfo.announceForAccessibility('Viagem finalizada');
      toast.success('Viagem finalizada!');
      navigation.goBack();
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Erro ao finalizar viagem');
      setLoading(false);
    }
  };

  const enviarAviso = async (titulo: string, mensagem: string) => {
    if (!viagemId) return;
    setSendingBroadcast(true);
    try {
      await createNotificacao({
        titulo,
        mensagem,
        viagem_id: viagemId,
      } as Parameters<typeof createNotificacao>[0]);
      toast.success('Aviso enviado aos alunos!');
      AccessibilityInfo.announceForAccessibility('Aviso enviado com sucesso');
      setAvisoTexto('');
    } catch {
      toast.error('Não foi possível enviar o aviso.');
    } finally {
      setSendingBroadcast(false);
      setBroadcastVisible(false);
    }
  };

  const handleBroadcast = (template: (typeof BROADCAST_TEMPLATES)[number]) =>
    enviarAviso(template.label, template.msg);

  const avisoValido = avisoTexto.trim().length >= AVISO_MIN;

  // ── Empty / loading guards ─────────────────────────────────────────────────

  if (!viagemParam) {
    return (
      <TelaSegura style={styles.container}>
        <SubHeader titulo="Iniciar Viagem" onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Icon name={IconNames.warning} size="xxl" color={colors.warning.main} />
          <Text style={styles.emptyText}>Dados da viagem não disponíveis</Text>
        </View>
      </TelaSegura>
    );
  }

  if (loadingStatus) {
    return (
      <TelaSegura style={styles.container}>
        <SubHeader titulo="Carregando…" onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary.dark} />
        </View>
      </TelaSegura>
    );
  }

  // ── Active trip — map fills the screen with floating panels ──────────────

  if (viagemIniciada) {
    return (
      <View style={styles.mapScreen}>
        {/* Mesmo mapa da tela do aluno: paradas numeradas, próxima destacada, ônibus */}
        <View style={StyleSheet.absoluteFillObject}>
          <LocationMap
            pontosRota={pontosOrdenados}
            posicaoOnibus={posMotorista}
            proximaParadaId={proxima ? (proxima.ponto.id as string) : null}
            rotaCoordenadas={trajeto}
            seguirOnibus={false}
            centralizarTick={centralizarTick}
            margemSuperior={alturaTopo}
            margemInferior={alturaPainel}
          />
        </View>

        {/* Minha posição: leva o mapa ao ônibus (apagado enquanto não há GPS) */}
        <View style={[styles.minhaPosicaoWrap, { bottom: alturaPainel + spacing.base }]}>
          <TouchableOpacity
            style={[styles.minhaPosicao, !posMotorista && styles.acaoDesabilitada]}
            onPress={() => setCentralizarTick((n) => n + 1)}
            disabled={!posMotorista}
            accessibilityRole="button"
            accessibilityState={{ disabled: !posMotorista }}
            accessibilityLabel="Centralizar na minha posição">
            <Icon name={IconNames.myLocation} size="lg" color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Cabeçalho no padrão do app: voltar desabilitado, rota e cronômetro */}
        <View style={styles.floatingTop} onLayout={(e) => setAlturaTopo(e.nativeEvent.layout.height)}>
          <SubHeader
            titulo="Em andamento"
            subtitulo={`${formatarSentido(currentViagem.tipo as string)} · ${horaCurta(currentViagem.horario_inicio as string)}`}
            voltarDesabilitado
            direita={
              <View style={styles.timerChip}>
                <Icon name={IconNames.schedule} size="sm" color={colors.success.contrast} />
                <Text
                  style={styles.timerText}
                  accessibilityLabel={`Tempo decorrido: ${formatarTempo(tempoDecorrido)}`}>
                  {formatarTempo(tempoDecorrido)}
                </Text>
              </View>
            }
          />
        </View>

        {/* Floating bottom: secondary actions + finalizar */}
        {/* Folha de paradas: fundo escurecido fecha, X fecha, Paradas alterna, Escape/voltar fecham */}
        {listaAberta ? (
          <View style={[styles.listaCamada, { bottom: alturaPainel }]}>
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={() => setListaAberta(false)}
              accessibilityRole="button"
              accessibilityLabel="Fechar lista de paradas"
            />
            <View style={styles.listaFolha}>
              <View style={styles.listaCabecalho}>
                <Text style={styles.listaTitulo} accessibilityRole="header">
                  Paradas ({Math.min(concluidas, paradas.length)} de {paradas.length})
                </Text>
                <TouchableOpacity
                  style={styles.listaFechar}
                  onPress={() => setListaAberta(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar">
                  <Icon name={IconNames.close} size="md" color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.listaRolagem} contentContainerStyle={styles.listaConteudo}>
                {paradas.map((p) => (
                  <View key={p.ponto.id ?? p.numero} style={styles.paradaLinha}>
                    <View
                      style={[
                        styles.paradaNumero,
                        p.estado === 'feita' && { backgroundColor: colors.success.main },
                        p.estado === 'proxima' && { backgroundColor: '#1565C0' },
                      ]}>
                      {p.estado === 'feita' ? (
                        <Icon name={IconNames.check} size="xs" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.paradaNumeroTexto}>{p.numero}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.paradaNome, p.estado === 'feita' && styles.paradaFeita]}
                        numberOfLines={2}>
                        {p.ponto.apelido}
                      </Text>
                      {p.instituicao ? (
                        <View style={styles.instituicaoLinha}>
                          <Icon name={IconNames.school} size="xs" color={colors.primary.main} />
                          <Text style={styles.instituicaoTexto} numberOfLines={2}>
                            {p.instituicao.nome}
                            {p.instituicao.tipo ? ` · ${p.instituicao.tipo}` : ''}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        ) : null}

        <View style={styles.floatingBottom} onLayout={(e) => setAlturaPainel(e.nativeEvent.layout.height)}>
          {/* Só a informação da próxima parada */}
          <View style={styles.proximaCard}>
            <View style={styles.proximaIcone}>
              <Icon name={IconNames.location} size="md" color={colors.primary.main} />
            </View>
            <View style={styles.proximaTextos}>
              <Text style={styles.proximaRotulo}>{todasFeitas ? 'ROTA CONCLUÍDA' : 'PRÓXIMA PARADA'}</Text>
              <Text style={styles.proximaNome} numberOfLines={2}>
                {proxima ? (proxima.ponto.apelido as string) : 'Todas as paradas feitas'}
              </Text>
              {proxima && proxima.instituicao ? (
                <Text style={styles.proximaInstituicao} numberOfLines={1}>
                  {proxima.instituicao.nome}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Ações só com ícone: Paradas, No ponto, Avisar, Alunos */}
          <View style={styles.acoesRow} accessibilityRole="toolbar">
            <View style={styles.acaoItem}>
              <TouchableOpacity
                style={[styles.acaoIcone, { backgroundColor: colors.solid.teal }]}
                onPress={() => setListaAberta(!listaAberta)}
                accessibilityRole="button"
                accessibilityState={{ expanded: listaAberta }}
                accessibilityLabel="Paradas">
                <Icon name={IconNames.route} size="xl" color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.acaoLegenda} numberOfLines={1}>Ver paradas</Text>
            </View>
            <View style={styles.acaoItem}>
              <TouchableOpacity
                style={[styles.acaoIcone, { backgroundColor: colors.solid.green }, !proxima && styles.acaoDesabilitada]}
                onPress={marcarChegada}
                disabled={!proxima}
                accessibilityRole="button"
                accessibilityState={{ disabled: !proxima }}
                accessibilityLabel="No ponto">
                <Icon name={IconNames.noPonto} size="xl" color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.acaoLegenda} numberOfLines={1}>Cheguei</Text>
            </View>
            <View style={styles.acaoItem}>
              <TouchableOpacity
                style={[styles.acaoIcone, { backgroundColor: colors.solid.amber }]}
                onPress={() => setBroadcastVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Avisar"
                accessibilityHint="Avisar os alunos ou registrar um problema para a gestão">
                <Icon name={IconNames.campaign} size="xl" color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.acaoLegenda} numberOfLines={1}>Avisar</Text>
            </View>
            <View style={styles.acaoItem}>
              <TouchableOpacity
                style={[styles.acaoIcone, { backgroundColor: colors.solid.blue }]}
                onPress={() => navigation.navigate('ListaAlunosConfirmados', { viagem: currentViagem })}
                accessibilityRole="button"
                accessibilityLabel="Alunos">
                <Icon name={IconNames.group} size="xl" color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.acaoLegenda} numberOfLines={1}>Confirmados</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.finalizarButton, loading && styles.buttonDisabled]}
            onPress={() => setFinalizarVisivel(true)}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Finalizar viagem"
            accessibilityState={{ disabled: loading }}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.text.inverse} />
            ) : (
              <>
                <Icon name={IconNames.stop} size="xl" color={colors.text.inverse} />
                <Text style={styles.finalizarButtonText}>Finalizar Viagem</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <DialogoConfirmacao
          visible={finalizarVisivel}
          titulo="Finalizar a viagem?"
          resumo="Tem certeza que deseja finalizar?"
          onCancelar={() => setFinalizarVisivel(false)}
          principal={{ texto: 'Continuar viagem', cor: colors.success.main, onPress: () => setFinalizarVisivel(false) }}
          secundario={{ texto: 'Sim, finalizar', cor: colors.error.main, carregando: loading, onPress: confirmarFinalizar }}
        />

        {/* Broadcast Modal */}
        <ModalApp
          visible={broadcastVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setBroadcastVisible(false)}
          accessibilityViewIsModal>
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              onPress={() => setBroadcastVisible(false)}
              activeOpacity={1}
              accessibilityLabel="Fechar"
              accessibilityRole="button"
            />
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} accessibilityElementsHidden />
              <ScrollView style={styles.modalScroll} contentContainerStyle={{ gap: spacing.md }}>
              <Text style={styles.modalTitle} accessibilityRole="header">Avisar alunos</Text>
              <Text style={styles.modalSubtitle}>
                Escolha uma mensagem rápida para enviar a todos os alunos desta viagem.
              </Text>
              {BROADCAST_TEMPLATES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.templateBtn}
                  onPress={() => handleBroadcast(t)}
                  disabled={sendingBroadcast}
                  accessibilityRole="button"
                  accessibilityLabel={t.label}
                  accessibilityHint={t.msg}>
                  {sendingBroadcast ? (
                    <ActivityIndicator color={colors.primary.main} />
                  ) : (
                    <>
                      <Icon name={t.icon} size="lg" color={colors.primary.main} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.templateBtnLabel}>{t.label}</Text>
                        <Text style={styles.templateBtnMsg} numberOfLines={1}>{t.msg}</Text>
                      </View>
                      <Icon name={IconNames.send} size="md" color={colors.primary.main} />
                    </>
                  )}
                </TouchableOpacity>
              ))}
              <Text style={styles.modalSecao}>Escrever outro aviso</Text>
              <TextInput
                style={styles.avisoCampo}
                value={avisoTexto}
                onChangeText={setAvisoTexto}
                maxLength={AVISO_MAX}
                multiline
                textAlignVertical="top"
                placeholder="Digite a mensagem para os alunos"
                placeholderTextColor={colors.text.hint}
                accessibilityLabel="Escrever outro aviso"
              />
              <Text style={styles.avisoContador}>
                {avisoTexto.length} / {AVISO_MAX}
              </Text>
              <TouchableOpacity
                style={[styles.avisoEnviar, (!avisoValido || sendingBroadcast) && styles.acaoDesabilitada]}
                onPress={() => enviarAviso('Aviso do motorista', avisoTexto.trim())}
                disabled={!avisoValido || sendingBroadcast}
                accessibilityRole="button"
                accessibilityState={{ disabled: !avisoValido || sendingBroadcast }}
                accessibilityLabel="Enviar aviso">
                <Text style={styles.avisoEnviarTexto}>Enviar</Text>
              </TouchableOpacity>
              <Text style={styles.modalSecao}>Registrar problema para a gestão</Text>
              <View style={styles.problemaChips}>
                {CHIPS.map((chip) => (
                  <TouchableOpacity
                    key={chip.tipo}
                    style={styles.problemaChip}
                    onPress={() => {
                      setTipoProblema(chip.tipo);
                      setBroadcastVisible(false);
                      setReportVisible(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Registrar problema: ${chip.label}`}>
                    <Icon name={chip.icon} size="md" color={chip.color} />
                    <Text style={styles.problemaChipTexto}>{chip.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </ModalApp>

        <ReportSheet
          visible={reportVisible}
          onClose={() => setReportVisible(false)}
          viagemId={viagemId}
          tipoInicial={tipoProblema}
        />
      </View>
    );
  }

  // ── Pre-trip — summary + static map preview + iniciar ────────────────────

  return (
    <TelaSegura style={styles.container}>
      <SubHeader
        titulo="Iniciar Viagem"
        subtitulo={`${formatarSentido(currentViagem.tipo as string)} · ${horaCurta(currentViagem.horario_inicio as string)}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={withFabSpace(styles.preContent)} showsVerticalScrollIndicator={false}>
        {/* Route summary card */}
        <View style={styles.card}>
          <View style={styles.routeRow}>
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: colors.success.main }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>Origem</Text>
                <Text style={styles.routeName}>{(currentViagem.origem as string) || '—'}</Text>
              </View>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, { backgroundColor: colors.error.main }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>Destino</Text>
                <Text style={styles.routeName}>{(currentViagem.destino as string) || '—'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name={IconNames.group} size="sm" color={colors.primary.dark} />
              <Text style={styles.infoValue}>
                {(currentViagem.alunos_confirmados_count as number) ?? 0}
                {' / '}
                {(currentViagem.total_alunos as number) ?? 0}
              </Text>
              <Text style={styles.infoLabel}>alunos</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name={IconNames.location} size="sm" color={colors.primary.dark} />
              <Text style={styles.infoValue}>{pontosRota.length}</Text>
              <Text style={styles.infoLabel}>paradas</Text>
            </View>
          </View>
        </View>

        {/* Static map preview */}
        {pontosRota.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rota</Text>
            <StaticRouteMap pontosRota={pontosOrdenados} />
          </View>
        )}

        {/* Stops list */}
        {pontosRota.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Paradas ({pontosRota.length})</Text>
            {pontosOrdenados.map((ponto, index) => (
              <View key={ponto.id ?? index} style={styles.stopItem}>
                <View
                  style={[
                    styles.stopDot,
                    index === 0 && { backgroundColor: colors.success.main },
                    index === pontosRota.length - 1 && { backgroundColor: colors.error.main },
                  ]}
                >
                  <Text style={styles.stopDotText}>{index + 1}</Text>
                </View>
                {index < pontosRota.length - 1 && <View style={styles.stopLine} />}
                <View style={styles.stopInfo}>
                  <Text style={styles.stopName}>{ponto.apelido ?? `Ponto ${index + 1}`}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Barra fixa embaixo: Iniciar Viagem sempre visível, perto da seta de voltar */}
      <View style={styles.barraIniciar}>
          {/* Iniciar button */}
          <TouchableOpacity
            style={[styles.iniciarButton, loading && styles.buttonDisabled]}
            onPress={abrirIniciar}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Iniciar viagem"
            accessibilityState={{ disabled: loading }}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.text.inverse} />
            ) : (
              <>
                <Icon name={IconNames.play} size="xl" color={colors.text.inverse} />
                <Text style={styles.iniciarButtonText}>Iniciar Viagem</Text>
              </>
            )}
          </TouchableOpacity>
      </View>

      <ConfirmacaoTelaCheia
        visible={iniciarVisivel}
        titulo="Instituições de ensino com alunos confirmados"
        onCancelar={() => setIniciarVisivel(false)}
        rolagem={!arrastando}
        principal={{ texto: 'Iniciar viagem', cor: colors.success.main, onPress: handleIniciarViagem }}
        secundario={{
          texto: 'Voltar',
          cor: colors.neutral[200],
          corTexto: colors.text.primary,
          onPress: () => setIniciarVisivel(false),
        }}>
        {gruposOrdenados.length === 0 ? (
          <Text style={styles.semInstituicao}>Nenhum aluno confirmou ainda</Text>
        ) : (
          <>
            {gruposOrdenados.length > 1 ? (
              <Text style={styles.dicaOrdem}>Segure e arraste para mudar a ordem</Text>
            ) : null}
            <ListaReordenavel
              itens={gruposOrdenados}
              chaveDe={(g: GrupoConfirmado) => g.nome}
              onMudar={(lista: GrupoConfirmado[]) => setGruposOrdenados(lista)}
              onArrastando={setArrastando}
              renderItem={(g: GrupoConfirmado) => (
                <View style={styles.instituicaoCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.instituicaoNome} numberOfLines={2}>
                      {g.nome}
                    </Text>
                    {g.tipo ? <Text style={styles.instituicaoDetalhe}>{g.tipo}</Text> : null}
                  </View>
                  <Text style={styles.instituicaoQtd}>
                    {g.quantidade} {g.quantidade === 1 ? 'aluno' : 'alunos'}
                  </Text>
                </View>
              )}
            />
          </>
        )}
      </ConfirmacaoTelaCheia>

      {/* Broadcast Modal */}
      <ModalApp
        visible={broadcastVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBroadcastVisible(false)}
        accessibilityViewIsModal>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={() => setBroadcastVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} accessibilityElementsHidden />
            <Text style={styles.modalTitle} accessibilityRole="header">Avisar Alunos</Text>
            <Text style={styles.modalSubtitle}>
              Escolha uma mensagem rápida para enviar a todos os alunos desta viagem.
            </Text>
            {BROADCAST_TEMPLATES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={styles.templateBtn}
                onPress={() => handleBroadcast(t)}
                disabled={sendingBroadcast}
                accessibilityRole="button"
                accessibilityLabel={t.label}>
                {sendingBroadcast ? (
                  <ActivityIndicator color={colors.primary.main} />
                ) : (
                  <>
                    <Icon name={t.icon} size="lg" color={colors.primary.main} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.templateBtnLabel}>{t.label}</Text>
                      <Text style={styles.templateBtnMsg} numberOfLines={1}>{t.msg}</Text>
                    </View>
                    <Icon name={IconNames.send} size="md" color={colors.primary.main} />
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ModalApp>

      <ReportSheet
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        viagemId={viagemId}
      />
    </TelaSegura>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },

  // ── Map (active trip) layout ───────────────────────────────────────────
  mapScreen: { flex: 1, backgroundColor: '#000' },

  floatingTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(3, 71, 208, 0.92)',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    ...shadows.lg,
  },
  topBarLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  backButtonDisabled: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: { ...textStyles.body, color: '#fff', fontWeight: '700' as const },
  topBarSub: { ...textStyles.caption, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  timerText: { ...textStyles.body, color: '#fff', fontWeight: '700' as const, fontFamily: 'monospace' },

  floatingBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.base,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    ...shadows.xl,
  },
  proximaCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  proximaIcone: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary.lighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proximaTextos: { flex: 1 },
  proximaRotulo: { ...textStyles.caption, color: colors.text.secondary, letterSpacing: 1 },
  proximaNome: { ...textStyles.h5, color: colors.text.primary },
  proximaInstituicao: { ...textStyles.caption, color: colors.primary.main, fontWeight: '700' as const },
  chegueiBtn: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    backgroundColor: colors.success.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chegueiTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' as const },
  semInstituicao: { ...textStyles.body, color: colors.text.secondary },
  instituicaoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.base,
    paddingLeft: spacing.base,
  },
  dicaOrdem: { ...textStyles.bodySmall, color: colors.text.secondary },
  instituicaoNome: { ...textStyles.h5, color: colors.text.primary },
  instituicaoDetalhe: { ...textStyles.bodySmall, color: colors.text.secondary },
  instituicaoQtd: { ...textStyles.h5, color: colors.primary.main },
  minhaPosicaoWrap: { position: 'absolute', right: spacing.base, alignItems: 'center', gap: 4, zIndex: 15 },
  minhaPosicao: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.solid.blue,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  // Quatro botões com flex igual e vão de 8 px: ocupam a largura do Finalizar Viagem, sem sobras.
  acoesRow: { flexDirection: 'row', gap: spacing.sm },
  acaoItem: { flex: 1, alignItems: 'center', gap: 4 },
  // 12 px Inter, uma linha; "Confirmados" cabe em ~75 px (celular de 360 px dá ~78 px por botão)
  acaoLegenda: { ...textStyles.caption, color: colors.text.secondary, textAlign: 'center' },
  acaoIcone: {
    alignSelf: 'stretch',
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acaoDesabilitada: { opacity: 0.4 },
  listaCamada: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  listaFolha: {
    maxHeight: '65%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.base,
  },
  listaCabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listaTitulo: { ...textStyles.h4, color: colors.text.primary },
  listaFechar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  listaRolagem: { flexShrink: 1 },
  listaConteudo: { paddingBottom: spacing.base },
  modalSecao: { ...textStyles.h5, color: colors.text.primary, marginTop: spacing.base, marginBottom: spacing.sm },
  problemaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  problemaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.base,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    backgroundColor: colors.neutral[50],
  },
  problemaChipTexto: { ...textStyles.body, color: colors.text.primary, fontWeight: '600' as const },
  listaToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  listaToggleTexto: { ...textStyles.body, color: colors.text.primary, fontWeight: '700' as const },
  listaParadas: { maxHeight: 200 },
  paradaLinha: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  paradaNumero: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.neutral[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  paradaNumeroTexto: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' as const },
  paradaNome: { ...textStyles.body, color: colors.text.primary },
  paradaFeita: { color: colors.text.secondary },
  instituicaoLinha: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  instituicaoTexto: { ...textStyles.caption, color: colors.primary.main, fontWeight: '700' as const },
  secondaryRow: { flexDirection: 'row', gap: spacing.md },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    minHeight: 60,
  },
  secondaryBtnReport: { borderColor: colors.warning.main },
  secondaryBtnText: {
    ...textStyles.caption,
    color: colors.primary.dark,
    fontWeight: '600' as const,
  },

  // ── Pre-trip header ───────────────────────────────────────────────────
  header: {
    backgroundColor: colors.primary.dark,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerPre: { flexDirection: 'row', alignItems: 'center' },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { ...textStyles.h3, color: colors.primary.contrast },
  headerSubtitle: { ...textStyles.bodySmall, color: 'rgba(255,255,255,0.75)', marginTop: spacing.xs },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  emptyText: { ...textStyles.h4, color: colors.text.secondary },

  preContent: { padding: spacing.base, paddingBottom: spacing.xxxl },

  card: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  cardTitle: { ...textStyles.h4, color: colors.text.primary, marginBottom: spacing.md },

  // Route summary
  routeRow: { gap: spacing.sm },
  routePoint: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  routeDot: { width: 14, height: 14, borderRadius: 7, marginTop: 4 },
  routeLine: { width: 2, height: 20, backgroundColor: colors.border.light, marginLeft: 6 },
  routeLabel: { ...textStyles.caption, color: colors.text.secondary },
  routeName: { ...textStyles.body, color: colors.text.primary, fontWeight: '600' as const },

  divider: { height: 1, backgroundColor: colors.border.light, marginVertical: spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-around' },
  infoItem: { alignItems: 'center', gap: spacing.xs },
  infoValue: { ...textStyles.h4, color: colors.primary.dark },
  infoLabel: { ...textStyles.caption, color: colors.text.secondary },

  // Stops list
  stopItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  stopDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stopDotText: { ...textStyles.caption, color: '#fff', fontWeight: '700' as const },
  stopLine: {
    position: 'absolute',
    left: 13,
    top: 28,
    width: 2,
    height: spacing.xxl,
    backgroundColor: colors.border.light,
  },
  stopInfo: { flex: 1, marginLeft: spacing.md, paddingBottom: spacing.xl },
  stopName: { ...textStyles.body, color: colors.text.primary, paddingTop: spacing.xs },

  // Action buttons
  barraIniciar: {
    padding: spacing.base,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background.paper,
    ...shadows.xl,
  },
  iniciarButton: {
    backgroundColor: colors.success.main,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 88,
    marginTop: spacing.sm,
    ...shadows.xl,
  },
  iniciarButtonText: {
    ...textStyles.button,
    color: colors.text.inverse,
    fontSize: fontSize.h3,
    fontWeight: '700' as const,
  },
  finalizarButton: {
    backgroundColor: colors.error.main,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 88,
    ...shadows.xl,
  },
  finalizarButtonText: {
    ...textStyles.button,
    color: colors.text.inverse,
    fontSize: fontSize.h3,
    fontWeight: '700' as const,
  },
  buttonDisabled: { opacity: 0.6 },

  // Broadcast modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  avisoCampo: {
    minHeight: 96,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    borderRadius: 14,
    backgroundColor: colors.neutral[50],
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
  },
  avisoContador: { ...textStyles.caption, color: colors.text.hint, textAlign: 'right' },
  avisoEnviar: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avisoEnviarTexto: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' as const },
  modalScroll: { flexGrow: 0 },
  modalSheet: {
    maxHeight: '92%',
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: { ...textStyles.h3, color: colors.text.primary },
  modalSubtitle: { ...textStyles.bodySmall, color: colors.text.secondary },
  templateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    backgroundColor: colors.primary.lighter,
    borderRadius: borderRadius.lg,
    minHeight: 64,
  },
  templateBtnLabel: { ...textStyles.h5, color: colors.primary.dark, fontWeight: '700' as const },
  templateBtnMsg: { ...textStyles.bodySmall, color: colors.text.secondary },
});

export default InicioFimViagem;
