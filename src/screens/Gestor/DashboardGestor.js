import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import TelaSegura from '../../components/TelaSegura';
import { gestorService } from '../../services/gestorService';
import { listarOcorrencias } from '../../services/ocorrenciaService';
import { getNotificacoes } from '../../services/notificacaoService';
import { unwrapItems } from '../../types';
import { borderRadius, colors, shadows, spacing, textStyles } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import ActionTile from '../../components/ActionTile';
import PainelHeader from '../../components/PainelHeader';
import EnviarAvisoSheet from '../../components/EnviarAvisoSheet';
import MaisSheet from '../../components/MaisSheet';
import { useToast } from '../../components/Toast';
import { withFabSpace } from '../../config/feedback';
import { webTitleProps } from '../../utils/webTitle';
import { isoLocal } from '../../utils/saudacao';
import { ehDeHoje, horaCurta, ordenarPorHorario, situacaoViagem } from '../../utils/viagemPainel';
import SairDaConta from '../../components/SairDaConta';
import Tappable from '../../components/Tappable';

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
  const [maisVisivel, setMaisVisivel] = useState(false);

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
    // initial: false mantém a lista da aba embaixo, então voltar da criação cai nela.
    else navigation.navigate(aba, { screen: tela, params, initial: false });
  };

  const itensMais = [
    { icone: IconNames.editCalendar, nome: 'Gerar lote', cor: colors.solid.teal, ir: () => irParaAba('ViagensTab') },
    { icone: IconNames.person, nome: 'Equipe', cor: colors.solid.blue, ir: () => irParaAba('EquipeTab') },
    { icone: IconNames.bus, nome: 'Frota', cor: colors.solid.green, ir: () => irParaAba('FrotaTab') },
    { icone: IconNames.chart, nome: 'Resumo da semana', cor: colors.solid.amber, ir: () => abrir('PerfilTab', 'ResumoSemana') },
  ];

  const totalCadastros = cadastros.dados ? cadastros.dados.length : null;
  const totalOcorrencias = ocorrencias.dados ? ocorrencias.dados.length : null;
  const viagensHoje = hoje.dados || [];

  return (
    <TelaSegura style={styles.container}>
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
          {/* Ações rápidas */}
          {/* Precisa de atenção: pílulas que somem quando o número é zero */}
          {totalCadastros > 0 || totalOcorrencias > 0 ? (
            <View style={styles.pilulas}>
              {totalCadastros > 0 ? (
                <Tappable navega
                  style={[styles.pilula, { backgroundColor: colors.warning.light }]}
                  onPress={() => abrir('EquipeTab', 'CadastrosPendentes')}
                  accessibilityRole="button"
                  accessibilityLabel={`Cadastros aguardando aprovação: ${totalCadastros}`}
                  {...webTitleProps('Cadastros aguardando aprovação')}>
                  <Text style={[styles.pilulaTexto, { color: '#92400E' }]}>
                    {totalCadastros} {totalCadastros === 1 ? 'cadastro' : 'cadastros'}
                  </Text>
                </Tappable>
              ) : null}
              {totalOcorrencias > 0 ? (
                <Tappable navega
                  style={[styles.pilula, { backgroundColor: colors.error.light }]}
                  onPress={() => abrir('PerfilTab', 'OcorrenciasGestor')}
                  accessibilityRole="button"
                  accessibilityLabel={`Ocorrências abertas: ${totalOcorrencias}`}
                  {...webTitleProps('Ocorrências abertas')}>
                  <Text style={[styles.pilulaTexto, { color: '#B91C1C' }]}>
                    {totalOcorrencias} {totalOcorrencias === 1 ? 'ocorrência' : 'ocorrências'}
                  </Text>
                </Tappable>
              ) : null}
            </View>
          ) : null}

          <View style={styles.qaGrid} accessibilityRole="toolbar">
            <View style={styles.qaCell}>
              <ActionTile icon={IconNames.add} label="Viagem" accessibilityLabel="Nova viagem" color={colors.solid.blue} onPress={() => abrir('ViagensTab', 'CriarViagem')} />
            </View>
            <View style={styles.qaCell}>
              <ActionTile icon={IconNames.campaign} label="Aviso" accessibilityLabel="Enviar aviso" color={colors.solid.amber} onPress={() => setAvisoVisivel(true)} />
            </View>
            <View style={styles.qaCell}>
              <ActionTile icon={IconNames.route} label="Rota" accessibilityLabel="Nova rota" color={colors.solid.green} onPress={() => abrir('RotasTab', 'CriarRota')} />
            </View>
            <View style={styles.qaCell}>
              <ActionTile icon={IconNames.moreHoriz} label="Mais" accessibilityLabel="Mais ações" color={colors.neutral[600]} onPress={() => setMaisVisivel(true)} />
            </View>
          </View>

          {/* Hoje */}
          <View style={styles.hojeHeader}>
            <Text style={styles.sectionTitle}>Hoje</Text>
            <Tappable navega
              onPress={() => irParaAba('ViagensTab')}
              accessibilityRole="button"
              accessibilityLabel="Ver todas as viagens">
              <Text style={styles.verTodas}>Ver todas</Text>
            </Tappable>
          </View>
          {hoje.carregando ? (
            <ActivityIndicator color={colors.primary.main} style={{ marginVertical: spacing.base }} />
          ) : hoje.erro ? (
            <View style={styles.vazio}>
              <Text style={styles.vazioTexto}>Não foi possível carregar as viagens.</Text>
              <Tappable onPress={carregar} accessibilityRole="button" accessibilityLabel="Tentar de novo">
                <Icon name={IconNames.refresh} size="md" color={colors.primary.main} />
              </Tappable>
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
                <Tappable navega
                  key={v.id}
                  style={styles.viagem}
                  onPress={() => abrir('ViagensTab', 'DetalheViagemMotorista', { viagem: v })}
                  accessibilityRole="button"
                  accessibilityLabel={`Viagem às ${horaCurta(v.horario_inicio)}, ${trajeto}, ${situacao.aviso || situacao.selo}`}>
                  <Text style={styles.viagemHora}>{horaCurta(v.horario_inicio)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.viagemTrajeto} numberOfLines={2}>
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
                </Tappable>
              );
            })
          )}

          <SairDaConta />
        </View>
      </ScrollView>

      <MaisSheet
        visible={maisVisivel}
        onClose={() => setMaisVisivel(false)}
        itens={itensMais}
      />
      <EnviarAvisoSheet
        visible={avisoVisivel}
        onClose={() => setAvisoVisivel(false)}
        onSent={mensagem => {
          setAvisoVisivel(false);
          toast.success(mensagem);
        }}
      />
    </TelaSegura>
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
  pilulas: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pilula: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 999 },
  pilulaTexto: { ...textStyles.bodySmall, fontWeight: '800' },
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
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  qaCell: { width: '25%', alignItems: 'center' },
});

export default DashboardGestor;
