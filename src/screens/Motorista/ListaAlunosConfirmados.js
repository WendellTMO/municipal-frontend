import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { colors, spacing, borderRadius, shadows, textStyles, fontSize, fontWeight } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import { withFabSpace } from '../../config/feedback';
import SubHeader from '../../components/SubHeader';
import { horaCurta } from '../../utils/viagemPainel';
import { agruparAlunos, instituicaoDoAlunoMotorista } from '../../utils/alunosInstituicao';
import { formatarSentido } from '../../utils/formatarSentido';

const ListaAlunosConfirmados = ({navigation, route}) => {
  const viagem = route?.params?.viagem || {};
  
  // Use alunos data from viagem object (from /viagens/minhas response)
  // Filter to show only confirmed students
  const alunosConfirmados = (viagem.alunos || [])
    .filter(a => a.confirmacao)
    .map((a, index) => ({
      id: a.aluno_id || index,
      nome: a.nome || 'Aluno',
      pontoEmbarque: a.ponto_embarque || 'Não informado',
      pontoDestino: a.ponto_destino || 'Não informado',
      instituicao: a.instituicao,
    }));

  // Agrupados pela instituição de ensino (alunos[].instituicao do backend).
  const secoes = agruparAlunos(alunosConfirmados, instituicaoDoAlunoMotorista);
  
  const totalAlunos = viagem.total_alunos || viagem.alunos?.length || 0;

  const renderAluno = (aluno) => (
          <View key={aluno.id} style={styles.alunoCard}>
            <View style={styles.alunoHeader}>
              <View style={styles.alunoAvatar}>
                <Text style={styles.alunoInicial}>
                  {aluno.nome?.charAt(0) || '?'}
                </Text>
              </View>
              <View style={styles.alunoInfo}>
                <Text style={styles.alunoNome}>{aluno.nome}</Text>
                <View style={styles.pontoContainer}>
                  <Icon name={IconNames.location} size="sm" color={colors.text.secondary} />
                  <Text style={styles.pontoEmbarque}>{aluno.pontoEmbarque}</Text>
                </View>
                {aluno.pontoDestino && aluno.pontoDestino !== 'Não informado' && (
                  <View style={styles.pontoContainer}>
                    <Icon name={IconNames.flag} size="sm" color={colors.text.hint} />
                    <Text style={styles.pontoDestino}>{aluno.pontoDestino}</Text>
                  </View>
                )}
              </View>
              <View style={styles.confirmadoIcon}>
                <Icon name={IconNames.checkCircle} size="md" color={colors.text.inverse} />
              </View>
            </View>
          </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SubHeader titulo="Alunos Confirmados" subtitulo={`${formatarSentido(viagem.tipo)} • ${horaCurta(viagem.horario_inicio)}`} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={withFabSpace()} style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.resumo}>
            <Text style={styles.resumoText}>
              {alunosConfirmados.length} de {totalAlunos} alunos confirmados
            </Text>
          </View>

          {secoes.map((sec) => (
            <View key={String(sec.chave)}>
              <View style={styles.secaoCabecalho} accessibilityRole="header">
                <Icon name={IconNames.school} size="md" color={colors.primary.main} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.secaoNome}>{sec.nome}</Text>
                  {sec.tipo ? <Text style={styles.secaoTipo}>{sec.tipo}</Text> : null}
                </View>
                <Text style={styles.secaoQtd}>
                  {sec.alunos.length} {sec.alunos.length === 1 ? 'aluno' : 'alunos'}
                </Text>
              </View>
              {sec.alunos.map(renderAluno)}
            </View>
          ))}

          {alunosConfirmados.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Nenhum aluno confirmado ainda
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  secaoCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  secaoNome: { ...textStyles.h5, color: colors.text.primary },
  secaoTipo: { ...textStyles.caption, color: colors.text.secondary },
  secaoQtd: { ...textStyles.h5, color: colors.primary.main },
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    backgroundColor: colors.primary.dark,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    ...textStyles.h3,
    color: colors.primary.contrast,
  },
  headerSubtitle: {
    ...textStyles.bodySmall,
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing.xs,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
  },
  resumo: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  resumoText: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  resumoSubtext: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  alunoCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  alunoCardNovo: {
    borderColor: colors.primary.dark,
    borderWidth: 2,
    backgroundColor: colors.info.light,
  },
  alunoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alunoAvatar: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.dark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  alunoFoto: {
    fontSize: fontSize.h3,
  },
  alunoInicial: {
    ...textStyles.h3,
    fontWeight: fontWeight.bold,
    color: colors.text.inverse,
  },
  alunoInfo: {
    flex: 1,
  },
  alunoNomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  alunoNome: {
    ...textStyles.body,
    fontWeight: fontWeight.semiBold,
    color: colors.text.primary,
  },
  novoBadge: {
    backgroundColor: colors.primary.dark,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
  },
  novoBadgeText: {
    ...textStyles.caption,
    color: colors.text.inverse,
    fontWeight: fontWeight.bold,
  },
  pontoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pontoEmbarque: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  pontoDestino: {
    ...textStyles.caption,
    color: colors.text.hint,
  },
  confirmadoIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  emptyStateText: {
    ...textStyles.body,
    color: colors.text.secondary,
  },
});

export default ListaAlunosConfirmados;


