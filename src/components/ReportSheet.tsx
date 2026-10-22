/**
 * Bottom sheet for reporting a problem (aluno + motorista).
 * Driver-safe: large touch targets, no mandatory text input,
 * category chips allow one-tap reporting.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { borderRadius, colors, shadows, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';
import type { TipoOcorrencia } from '../types';
import ocorrenciaService from '../services/ocorrenciaService';

interface ReportSheetProps {
  visible: boolean;
  onClose: () => void;
  viagemId?: string;
  /** Tipo já escolhido ao abrir (a folha de avisos da viagem passa o tipo tocado) */
  tipoInicial?: TipoOcorrencia | null;
  /** Called after a report is successfully submitted */
  onSuccess?: () => void;
}

export interface ChipConfig {
  tipo: TipoOcorrencia;
  label: string;
  icon: string;
  color: string;
}

export const CHIPS: ChipConfig[] = [
  { tipo: 'ATRASO', label: 'Atraso', icon: IconNames.schedule, color: colors.warning.dark },
  { tipo: 'SUPERLOTACAO', label: 'Lotação', icon: IconNames.group, color: colors.error.main },
  { tipo: 'COMPORTAMENTO', label: 'Comportamento', icon: IconNames.person, color: colors.accent.dark },
  { tipo: 'CANCELAMENTO', label: 'Cancelado', icon: IconNames.close, color: colors.error.dark },
  { tipo: 'OUTRO', label: 'Outro', icon: IconNames.info, color: colors.text.secondary },
];

const ReportSheet: React.FC<ReportSheetProps> = ({
  visible,
  onClose,
  viagemId,
  tipoInicial = null,
  onSuccess,
}) => {
  const [selected, setSelected] = useState<TipoOcorrencia | null>(tipoInicial);

  useEffect(() => {
    if (visible) setSelected(tipoInicial);
  }, [visible, tipoInicial]);
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const reset = () => {
    setSelected(null);
    setDescricao('');
    setSent(false);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await ocorrenciaService.criarOcorrencia({
        tipo: selected,
        descricao: descricao.trim() || undefined,
        viagem_id: viagemId,
      });
      setSent(true);
      onSuccess?.();
      setTimeout(handleClose, 1800);
    } catch {
      // non-fatal — keep sheet open so user can retry
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      accessibilityViewIsModal>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={handleClose}
          activeOpacity={1}
          accessibilityLabel="Fechar"
          accessibilityRole="button"
        />
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} accessibilityElementsHidden />

          <View style={styles.header}>
            <Text style={styles.title}>Reportar Problema</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar">
              <Icon name={IconNames.close} size="md" color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {sent ? (
            <View style={styles.sentContainer}>
              <Icon name={IconNames.checkCircle} size="huge" color={colors.success.main} />
              <Text style={styles.sentText}>Ocorrência registrada!</Text>
              <Text style={styles.sentSubtext}>O gestor foi notificado.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Qual o problema?</Text>

              {/* Category chips — large targets, driver-safe */}
              <View style={styles.chips}>
                {CHIPS.map((chip) => {
                  const active = selected === chip.tipo;
                  return (
                    <TouchableOpacity
                      key={chip.tipo}
                      style={[
                        styles.chip,
                        active && { backgroundColor: chip.color, borderColor: chip.color },
                      ]}
                      onPress={() => setSelected(chip.tipo)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={chip.label}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                      <Icon
                        name={chip.icon}
                        size="md"
                        color={active ? colors.text.inverse : chip.color}
                      />
                      <Text
                        style={[
                          styles.chipLabel,
                          { color: active ? colors.text.inverse : chip.color },
                        ]}>
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Optional description — not required so drivers don't have to type */}
              <Text style={styles.sectionLabel}>Detalhes (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Descreva o que aconteceu..."
                placeholderTextColor={colors.text.hint}
                value={descricao}
                onChangeText={setDescricao}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                returnKeyType="done"
                accessibilityLabel="Descrição do problema"
              />

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  !selected && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!selected || loading}
                accessibilityRole="button"
                accessibilityLabel="Enviar ocorrência"
                accessibilityState={{ disabled: !selected || loading }}>
                {loading ? (
                  <ActivityIndicator color={colors.text.inverse} />
                ) : (
                  <>
                    <Icon name={IconNames.send} size="md" color={colors.text.inverse} />
                    <Text style={styles.submitBtnText}>Enviar</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...textStyles.h3,
    color: colors.text.primary,
  },
  closeBtn: {
    padding: spacing.sm,
  },
  sectionLabel: {
    ...textStyles.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    backgroundColor: colors.background.default,
    minHeight: 48,
  },
  chipLabel: {
    ...textStyles.body,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    ...textStyles.body,
    color: colors.text.primary,
    minHeight: 80,
    marginBottom: spacing.lg,
    backgroundColor: colors.background.default,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    ...shadows.sm,
  },
  submitBtnDisabled: {
    backgroundColor: colors.neutral[300],
  },
  submitBtnText: {
    ...textStyles.button,
    color: colors.text.inverse,
    fontSize: 16,
  },
  sentContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  sentText: {
    ...textStyles.h3,
    color: colors.success.dark,
  },
  sentSubtext: {
    ...textStyles.body,
    color: colors.text.secondary,
  },
});

export default ReportSheet;
