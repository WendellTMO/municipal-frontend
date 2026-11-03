/**
 * Campo "Instituição": mostra a instituição atual e abre uma lista das instituições já
 * cadastradas. Não há campo de texto livre: só dá para escolher uma que existe.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { borderRadius, colors, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';
import ModalApp from './ModalApp';

const SeletorInstituicao = ({ instituicoes, valorId, onEscolher, desabilitado }) => {
  const [aberto, setAberto] = useState(false);
  const atual = instituicoes.find(i => i.id === valorId);
  const rotulo = atual ? atual.nome : 'Escolha sua instituição';

  const escolher = id => {
    setAberto(false);
    onEscolher(id);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.campo}
        onPress={() => setAberto(true)}
        disabled={desabilitado || instituicoes.length === 0}
        accessibilityRole="button"
        accessibilityLabel={`Instituição: ${rotulo}. Toque para trocar`}>
        <Text style={[styles.texto, !atual && styles.placeholder]} numberOfLines={2}>
          {rotulo}
        </Text>
        <Icon name={IconNames.expandMore} size="md" color={colors.text.secondary} />
      </TouchableOpacity>

      <ModalApp visible={aberto} transparent animationType="slide" onRequestClose={() => setAberto(false)}>
        <View style={styles.fundo}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setAberto(false)} accessibilityLabel="Fechar" />
          <View style={styles.folha}>
            <Text style={styles.titulo} accessibilityRole="header">
              Escolha sua instituição
            </Text>
            <ScrollView>
              {instituicoes.map(inst => (
                <TouchableOpacity
                  key={inst.id}
                  style={styles.linha}
                  onPress={() => escolher(inst.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: inst.id === valorId }}>
                  <Text style={styles.linhaTexto}>{inst.nome}</Text>
                  {inst.id === valorId ? <Icon name={IconNames.check} size="md" color={colors.primary.main} /> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </ModalApp>
    </>
  );
};

const styles = StyleSheet.create({
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.paper,
  },
  texto: { ...textStyles.body, flex: 1, color: colors.text.primary },
  placeholder: { color: colors.text.hint },
  fundo: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  folha: {
    maxHeight: '70%',
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
  },
  titulo: { ...textStyles.h3, color: colors.text.primary, marginBottom: spacing.md },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  linhaTexto: { ...textStyles.body, flex: 1, color: colors.text.primary },
});

export default SeletorInstituicao;
