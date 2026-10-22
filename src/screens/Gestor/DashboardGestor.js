import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { gestorService } from '../../services/gestorService';
import { listarOcorrencias } from '../../services/ocorrenciaService';
import { getNotificacoes } from '../../services/notificacaoService';
import { unwrapItems } from '../../types';
import { borderRadius, colors, shadows, spacing, textStyles } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import ActionTile from '../../components/ActionTile';
import PainelHeader from '../../components/PainelHeader';
import EnviarAvisoSheet from '../../components/EnviarAvisoSheet';
import { useToast } from '../../components/Toast';
import { withFabSpace } from '../../config/feedback';
import { webTitleProps } from '../../utils/webTitle';
import { isoLocal } from '../../utils/saudacao';
import { ehDeHoje, horaCurta, ordenarPorHorario, situacaoViagem } from '../../utils/viagemPainel';

const TONS = {
  verde: { fundo: colors.success.light, texto: colors.success.dark },
  azul: { fundo: colors.primary.lighter, texto: colors.primary.dark },
  cinza: { fundo: colors.neutral[100], texto: colors.text.secondary },
  vermelho: { fundo: colors.error.light, texto: colors.error.dark },
};

// Cada bloco carrega sozinho: um erro não derruba o painel.
const blocoInicial = { carregando: true, erro: false, dados: null };

const DashboardGestor = ({ navigation }) => {
  const toast = useToast();
  const [cadastros, setCadastros] = useState(blocoInicial);
  const [ocorrencias, setOcorrencias] = useState(blocoInicial);
  const [hoje, setHoje] = useState(blocoInicial);
  const [naoLidas, setNaoLidas] = useState(0);
  const [atualizando, setAtualizando] = useState(false);
  const [avisoVisivel, setAvisoVisivel] = useState(false);

  const carregarBloco = async (setBloco, buscar) => {
    try {
      const dados = await buscar();
      setBloco({ carregando: false, erro: false, dados });
    } catch (e) {
      setBloco({ carregando: false, erro: true, dados: null });
    }
  };

  const carregar = useCallback(async () => {
    const agora = new Date();
    const dia = isoLocal(agora);
    await Promise.all([
      carregarBloco(setCadastros, () =>
        gestorService.listarAlunos('PENDING_APPROVAL').then(unwrapItems),
      ),
      carregarBloco(setOcorrencias, () => listarOcorrencias('ABERTA')),
      carregarBloco(setHoje, async () => {
        const lista = await gestorService
          .listarViagens({ data_inicio: dia, data_fim: dia })
          .then(unwrapItems);
        return ordenarPorHorario(lista.filter(v => ehDeHoje(v, agora)));
      }),
      getNotificacoes()
        .then(lista => setNaoLidas(lista.filter(n => !n.enviada).length))
        .catch(() => {}),
    ]);
  }, []);

  useEffect(() => {
    carregar();
    // No nativo o painel continua montado ao voltar de outra tela; no web ele remonta.
    const parar = navigation?.addListener ? navigation.addListener('focus', carregar) : undefined;
    return parar;
  }, [carregar, navigation]);

  const onRefresh = async () => {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  };

  const irParaAba = nome => {
    try {
      navigation.navigate(nome);
    } catch (e) {
      navigation.getParent?.()?.navigate(nome);
    }
  };

  // Telas internas ficam dentro de uma aba no nativo e soltas no navegador do web.
  const abrir = (aba, tela, params) => {
    if (Platform.OS === 'web') navigation.navigate(tela, params);
    else navigation.navigate(aba, { screen: tela, params });
  };

  const totalCadastros = cadastros.dados ? cadastros.dados.length : null;
  const totalOcorrencias = ocorrencias.dados ? ocorrencias.dados.length : null;
  const tudoEmDia = totalCadastros === 0 && totalOcorrencias === 0;
  const viagensHoje = hoje.dados || [];

  const tituloHoje = () => {
    if (!hoje.dados) return 'Hoje';
    const n = hoje.dados.length;
    return `Hoje · ${n} ${n === 1 ? 'viagem' : 'viagens'}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={withFabSpace()}
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={onRefresh} />}>
        <PainelHeader
          perfil="Gestor"
          unreadCount={naoLidas}
          onBellPress={() => abrir('PerfilTab', 'NotificacoesGestor')}
          onOpenConfig={() => abrir('PerfilTab', 'ConfigNotificacoesGestor')}
        />

        <View style={styles.content}>
          {/* Precisa de atenção */}
          {tudoEmDia ? (
            <View style={styles.emDia} accessible accessibilityLabel="Tudo em dia">
              <Icon name={IconNames.checkCircle} size="md" color={colors.solid.green} />
              <Text style={styles.emDiaTexto}>Tudo em dia</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Precisa de atenção</Text>
              <View style={styles.atencaoRow}>
                <TouchableOpacity
                  style={styles.atencaoCard}
                  onPress={() => abrir('EquipeTab', 'CadastrosPendentes')}
                  accessibilityRole="button"
                  accessibilityLabel={`Cadastros aguardando aprovação: ${totalCadastros ?? 'indisponível'}`}
                  {...webTitleProps('Cadastros aguardando aprovação')}>
                  <View style={[styles.quadrado, { backgroundColor: colors.solid.amber }]}>
                    <Icon name={IconNames.cadastro} size="lg" color="#FFFFFF" />
                  </View>
                  <View>
                    {cadastros.carregando ? (
                      <ActivityIndicator size="small" color={colors.solid.amber} />
                    ) : (
                      <Text style={styles.numero}>{totalCadastros ?? '—'}</Text>
                    )}
                    <Text style={styles.numeroRotulo}>Cadastros</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.atencaoCard}
                  onPress={() => abrir('PerfilTab', 'OcorrenciasGestor')}
                  accessibilityRole="button"
                  accessibilityLabel={`Ocorrências abertas: ${totalOcorrencias ?? 'indisponível'}`}
                  {...webTitleProps('Ocorrências abertas')}>
                  <View style={[styles.quadrado, { backgroundColor: '#DC2626' }]}>
                    <Icon name={IconNames.warning} size="lg" color="#FFFFFF" />
                  </View>
                  <View>
                    {ocorrencias.carregando ? (
                      <ActivityIndicator size="small" color="#DC2626" />
                    ) : (
                      <Text style={styles.numero}>{totalOcorrencias ?? '—'}</Text>
                    )}
                    <Text style={styles.numeroRotulo}>Ocorrências</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Hoje */}
          <View style={styles.hojeHeader}>
            <Text style={styles.sectionTitle}>{tituloHoje()}</Text>
            <TouchableOpacity
              onPress={() => irParaAba('ViagensTab')}
              accessibilityRole="button"
              accessibilityLabel="Ver todas as viagens">
              <Text style={styles.verTodas}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          {hoje.carregando ? (
            <ActivityIndicator color={colors.primary.main} style={{ marginVertical: spacing.base }} />
          ) : hoje.erro ? (
            <View style={styles.vazio}>
              <Text style={styles.vazioTexto}>Não foi possível carregar as viagens.</Text>
              <TouchableOpacity onPress={carregar} accessibilityRole="button" accessibilityLabel="Tentar de novo">
                <Icon name={IconNames.refresh} size="md" color={colors.primary.main} />
              </TouchableOpacity>
            </View>
          ) : viagensHoje.length === 0 ? (
            <View style={styles.vazio}>
              <Text style={styles.vazioTexto}>Nenhuma viagem hoje</Text>
            </View>
          ) : (
            viagensHoje.slice(0, 3).map(v => {
              const situacao = situacaoViagem(v);
              const tom = TONS[situacao.tom];
              const trajeto =
                v.origem && v.destino ? `${v.origem} → ${v.destino}` : v.rota_nome || 'Viagem';
              const motorista = v.motorista_nome && v.motorista_nome !== 'Sem Motorista' ? v.motorista_nome : '';
              const placa = v.veiculo_placa && v.veiculo_placa !== 'Sem Veículo' ? `Ônibus ${v.veiculo_placa}` : '';
              return (
                <TouchableOpacity
                  key={v.id}
                  style={styles.viagem}
                  onPress={() => abrir('ViagensTab', 'DetalheViagemMotorista', { viagem: v })}
                  accessibilityRole="button"
                  accessibilityLabel={`Viagem às ${horaCurta(v.horario_inicio)}, ${trajeto}, ${situacao.aviso || situacao.selo}`}>
                  <Text style={styles.viagemHora}>{horaCurta(v.horario_inicio)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.viagemTrajeto} numberOfLines={1}>
                      {trajeto}
                    </Text>
                    {situacao.aviso ? (
                      <Text style={styles.viagemAviso}>{situacao.aviso}</Text>
                    ) : (
                      <Text style={styles.viagemSub} numberOfLines={1}>
                        {[motorista, placa].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.selo, { backgroundColor: tom.fundo }]}>
                    <Text style={[styles.seloTexto, { color: tom.texto }]}>{situacao.selo}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Ações rápidas */}
          <Text style={styles.sectionTitle}>Ações rápidas</Text>
          <View style={styles.qaGrid}>
            <View style={styles.qaCell}>
              <ActionTile icon={IconNames.campaign} label="Enviar aviso" color={colors.solid.amber} onPress={() => setAvisoVisivel(true)} />
            </View>
            <View style={styles.qaCell}>
              <ActionTile icon={IconNames.add} label="Nova viagem" color={colors.solid.blue} onPress={() => irParaAba('ViagensTab')} />
            </View>
            <View style={styles.qaCell}>
              <ActionTile icon={IconNames.editCalendar} label="Gerar lote" color={colors.solid.teal} onPress={() => irParaAba('ViagensTab')} />
            </View>
            <View style={styles.qaCell}>
              <ActionTile icon={IconNames.route} label="Nova rota" color={colors.solid.green} onPress={() => irParaAba('RotasTab')} />
            </View>
            <View style={styles.qaCell}>
              <ActionTile icon={IconNames.person} label="Equipe" color={colors.solid.teal} onPress={() => irParaAba('EquipeTab')} />
            </View>
            <View style={styles.qaCell}>
              <ActionTile icon={IconNames.bus} label="Frota" color={colors.solid.blue} onPress={() => irParaAba('FrotaTab')} />
            </View>
          </View>

          <TouchableOpacity
            style={styles.resumoLink}
            onPress={() => abrir('PerfilTab', 'ResumoSemana')}
            accessibilityRole="button"
            accessibilityLabel="Ver resumo da semana">
            <Text style={styles.resumoLinkTexto}>Ver resumo da semana</Text>
            <Icon name={IconNames.chevronRight} size="md" color={colors.primary.main} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <EnviarAvisoSheet
        visible={avisoVisivel}
        onClose={() => setAvisoVisivel(false)}
        onSent={mensagem => {
          setAvisoVisivel(false);
          toast.success(mensagem);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  scroll: { flex: 1 },
  content: { padding: spacing.base },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
    marginTop: spacing.base,
  },
  atencaoRow: { flexDirection: 'row', gap: spacing.md },
  atencaoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  quadrado: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  numero: { ...textStyles.h2, color: colors.text.primary },
  numeroRotulo: { ...textStyles.caption, color: colors.text.secondary },
  emDia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  emDiaTexto: { ...textStyles.body, color: colors.text.secondary, fontWeight: '600' },
  hojeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verTodas: { ...textStyles.body, color: colors.primary.main, fontWeight: '700' },
  viagem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  viagemHora: { ...textStyles.h4, color: colors.primary.main, fontWeight: '800' },
  viagemTrajeto: { ...textStyles.body, color: colors.text.primary, fontWeight: '700' },
  viagemSub: { ...textStyles.caption, color: colors.text.secondary },
  viagemAviso: { ...textStyles.caption, color: '#B91C1C', fontWeight: '700' },
  selo: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 999 },
  seloTexto: { ...textStyles.caption, fontWeight: '700' },
  vazio: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.base },
  vazioTexto: { ...textStyles.body, color: colors.text.secondary },
  qaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.lg,
  },
  qaCell: { width: '33.33%', alignItems: 'center' },
  resumoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  resumoLinkTexto: { ...textStyles.body, color: colors.primary.main, fontWeight: '700' },
});

export default DashboardGestor;
