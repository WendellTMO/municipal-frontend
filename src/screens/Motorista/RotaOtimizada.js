import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { colors, spacing, borderRadius, shadows, textStyles, fontSize, fontWeight, lineHeight } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import { withFabSpace } from '../../config/feedback';

const RotaOtimizada = ({navigation, route}) => {
  const {viagem} = route?.params || {};
  const [totalmenteOtimizada, setTotalmenteOtimizada] = useState(false);
  const [pontosOtimizados, setPontosOtimizados] = useState([]);

  const pontosForaDeOrdem = pontosOtimizados.filter(
    (p) => p.confirmadoAposInicio,
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name={IconNames.back} size="md" color={colors.primary.dark} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Rota Otimizada</Text>
      </View>

      <ScrollView contentContainerStyle={withFabSpace()} style={styles.scrollView}>
        <View style={styles.content}>
          {/* Aviso se não estiver totalmente otimizada */}
          {pontosForaDeOrdem.length > 0 && (
            <View style={styles.avisoBox}>
              <Icon name={IconNames.warning} size="md" color={colors.warning.main} />
              <View style={styles.avisoContent}>
                <Text style={styles.avisoTitle}>
                  Rota não totalmente otimizada
                </Text>
                <Text style={styles.avisoText}>
                  {pontosForaDeOrdem.length} ponto(s) com confirmações após o
                  início da viagem estão fora da ordem ideal.
                </Text>
              </View>
            </View>
          )}

          {totalmenteOtimizada && (
            <View style={styles.sucessoBox}>
              <Icon name={IconNames.checkCircle} size="md" color={colors.success.main} />
              <Text style={styles.sucessoText}>
                Rota totalmente otimizada!
              </Text>
            </View>
          )}

          {/* Lista de Pontos Ordenados */}
          <View style={styles.pontosContainer}>
            <Text style={styles.sectionTitle}>Ordem dos Pontos</Text>
            {pontosOtimizados.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum ponto disponível</Text>
            ) : (
              pontosOtimizados.map((ponto, index) => (
              <View
                key={ponto.id}
                style={[
                  styles.pontoCard,
                  ponto.confirmadoAposInicio && styles.pontoCardForaOrdem,
                  ponto.tipo === 'destino' && styles.pontoCardDestino,
                ]}>
                <View style={styles.pontoHeader}>
                  <View style={styles.ordemContainer}>
                    <Text style={styles.ordemNumero}>{ponto.ordem}</Text>
                    {ponto.tipo === 'destino' && (
                      <Text style={styles.destinoLabel}>Destino</Text>
                    )}
                  </View>
                  <View style={styles.pontoInfo}>
                    <Text style={styles.pontoNome}>{ponto.nome}</Text>
                    <View style={styles.alunosInfo}>
                      <Text style={styles.alunosText}>
                        {ponto.alunosConfirmados} aluno(s) confirmado(s)
                      </Text>
                      {ponto.confirmadoAposInicio && (
                        <View style={styles.foraOrdemBadge}>
                          <Text style={styles.foraOrdemText}>
                            Confirmado após início
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                {index < pontosOtimizados.length - 1 && (
                  <View style={styles.linhaConector}>
                    <Icon name={IconNames.expandMore} size="md" color={colors.primary.dark} />
                  </View>
                )}
              </View>
              ))
            )}
          </View>

          {/* Informações Adicionais */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Informações da Rota</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total de pontos:</Text>
              <Text style={styles.infoValue}>{pontosOtimizados.length}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Alunos confirmados:</Text>
              <Text style={styles.infoValue}>
                {pontosOtimizados.reduce(
                  (sum, p) => sum + p.alunosConfirmados,
                  0,
                )}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pontos fora de ordem:</Text>
              <Text style={styles.infoValue}>{pontosForaDeOrdem.length}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.aceitarButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.aceitarButtonText}>Aceitar Rota</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    backgroundColor: colors.background.paper,
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    ...shadows.sm,
  },
  backButton: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backButtonText: {
    ...textStyles.body,
    color: colors.primary.dark,
  },
  title: {
    ...textStyles.h2,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
  },
  avisoBox: {
    backgroundColor: colors.warning.light,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: colors.warning.main,
    gap: spacing.md,
    ...shadows.sm,
  },
  avisoContent: {
    flex: 1,
  },
  avisoTitle: {
    ...textStyles.body,
    fontWeight: fontWeight.bold,
    color: colors.warning.dark,
    marginBottom: spacing.xs,
  },
  avisoText: {
    ...textStyles.bodySmall,
    color: colors.warning.dark,
    lineHeight: fontSize.bodySmall * lineHeight.relaxed,
  },
  sucessoBox: {
    backgroundColor: colors.success.light,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.success.main,
    gap: spacing.md,
    ...shadows.sm,
  },
  sucessoText: {
    ...textStyles.body,
    fontWeight: fontWeight.semiBold,
    color: colors.success.dark,
  },
  pontosContainer: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  pontoCard: {
    marginBottom: spacing.sm,
  },
  pontoCardForaOrdem: {
    backgroundColor: colors.warning.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning.main,
  },
  pontoCardDestino: {
    backgroundColor: colors.success.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.success.main,
  },
  pontoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ordemContainer: {
    width: 50,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  ordemNumero: {
    ...textStyles.h2,
    color: colors.primary.dark,
  },
  destinoLabel: {
    ...textStyles.caption,
    color: colors.success.main,
    fontWeight: fontWeight.semiBold,
    marginTop: spacing.xxs,
  },
  pontoInfo: {
    flex: 1,
  },
  pontoNome: {
    ...textStyles.body,
    fontWeight: fontWeight.semiBold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  alunosInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  alunosText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  foraOrdemBadge: {
    backgroundColor: colors.error.main,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
  },
  foraOrdemText: {
    ...textStyles.caption,
    color: colors.text.inverse,
    fontWeight: fontWeight.semiBold,
  },
  linhaConector: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  infoCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  infoTitle: {
    ...textStyles.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  infoValue: {
    ...textStyles.bodySmall,
    fontWeight: fontWeight.semiBold,
    color: colors.text.primary,
  },
  aceitarButton: {
    backgroundColor: colors.success.main,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    alignItems: 'center',
    ...shadows.sm,
  },
  aceitarButtonText: {
    ...textStyles.button,
    color: colors.text.inverse,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

export default RotaOtimizada;


