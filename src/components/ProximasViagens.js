/**
 * Até três quadradinhos com as viagens que vêm depois da próxima. Viagem cancelada aparece
 * riscada e com selo, para o motorista saber de antemão (feriado, aviso do gestor).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing, textStyles } from '../theme';
import { dayLabel } from '../utils/dayLabel';
import { formatarSentido } from '../utils/formatarSentido';
import { formatarHora } from '../utils/formatarHora';
import Tappable from './Tappable';

const ProximasViagens = ({ viagens, onAbrir, onVerTodas }) => {
  if (!viagens || viagens.length === 0) return null;
  return (
    <View style={styles.bloco}>
      <View style={styles.cabecalho}>
        <Text style={styles.titulo} accessibilityRole="header">
          Próximas viagens
        </Text>
        {onVerTodas ? (
          <Tappable navega style={styles.verTodas} onPress={onVerTodas} accessibilityLabel="Ver todas as próximas viagens">
            <Text style={styles.verTodasTexto}>Ver todas</Text>
          </Tappable>
        ) : null}
      </View>
      <View style={styles.linha}>
        {viagens.map(viagem => {
          const cancelada = viagem.status === 'CANCELADA';
          const dia = dayLabel(viagem.data);
          const hora = formatarHora(viagem.horario_inicio);
          const sentido = formatarSentido(viagem.tipo);
          return (
            <Tappable
              key={viagem.id}
              navega
              style={[styles.quadrado, cancelada && styles.quadradoCancelado]}
              onPress={() => onAbrir(viagem)}
              accessibilityLabel={`Viagem ${dia} às ${hora}, ${sentido}${cancelada ? ', cancelada' : ''}`}>
              <Text style={styles.dia} numberOfLines={1}>
                {dia}
              </Text>
              <Text style={[styles.hora, cancelada && styles.horaCancelada]}>{hora}</Text>
              <Text style={styles.sentido} numberOfLines={1}>
                {sentido}
              </Text>
              {cancelada ? (
                <View style={styles.selo}>
                  <Text style={styles.seloTexto}>Cancelada</Text>
                </View>
              ) : null}
            </Tappable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bloco: { marginHorizontal: spacing.base, marginBottom: spacing.base },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  titulo: { ...textStyles.h4, color: colors.text.primary },
  verTodas: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.primary.lighter },
  verTodasTexto: { ...textStyles.button, color: colors.primary.dark },
  linha: { flexDirection: 'row', gap: spacing.sm },
  quadrado: {
    flex: 1,
    minHeight: 104,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.paper,
    justifyContent: 'space-between',
  },
  quadradoCancelado: { backgroundColor: colors.error.lighter, borderColor: colors.error.light },
  dia: { ...textStyles.caption, color: colors.text.secondary, fontWeight: '700' },
  hora: { ...textStyles.h3, color: colors.text.primary },
  horaCancelada: { textDecorationLine: 'line-through', color: colors.text.secondary },
  sentido: { ...textStyles.caption, color: colors.text.secondary },
  selo: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.error.main,
  },
  seloTexto: { ...textStyles.caption, color: '#FFFFFF', fontWeight: '700' },
});

export default ProximasViagens;
