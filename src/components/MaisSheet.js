/**
 * Folha "Mais" do painel do gestor: lista de ações secundárias, cada uma com
 * quadrado colorido, ícone branco e nome.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import Icon from './Icon';
import ModalApp from './ModalApp';

const MaisSheet = ({ visible, onClose, itens }) => {
  const escolher = item => {
    onClose();
    item.ir();
  };

  return (
    <ModalApp visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Fechar"
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Mais ações</Text>
          {itens.map(item => (
            <TouchableOpacity
              key={item.nome}
              style={styles.item}
              onPress={() => escolher(item)}
              accessibilityRole="button"
              accessibilityLabel={item.nome}>
              <View style={[styles.quadrado, { backgroundColor: item.cor }]}>
                <Icon name={item.icone} size="lg" color="#FFFFFF" />
              </View>
              <Text style={styles.nome}>{item.nome}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ModalApp>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.5)' },
  sheet: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...textStyles.h3, color: colors.text.primary, marginBottom: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.base, paddingVertical: spacing.md },
  quadrado: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  nome: { ...textStyles.h5, color: colors.text.primary },
});

export default MaisSheet;
