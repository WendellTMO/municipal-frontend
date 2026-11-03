/**
 * Campo "Instituição": mostra a instituição atual e abre uma lista das instituições já
 * cadastradas. Não há campo de texto livre: só dá para escolher uma que existe.
 */
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { borderRadius, colors, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';
import ModalApp from './ModalApp';
import { filtrarInstituicoes } from '../utils/buscaInstituicao';

const SeletorInstituicao = ({ instituicoes, valorId, onEscolher, desabilitado }) => {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const atual = instituicoes.find(i => i.id === valorId);
  const rotulo = atual ? atual.nome : 'Escolha sua instituição';

  const abrir = () => {
    setBusca('');
    setAberto(true);
  };

  const escolher = id => {
    setAberto(false);
    onEscolher(id);
  };

  const achadas = filtrarInstituicoes(instituicoes, busca);

  return (
    <>
      <TouchableOpacity
        style={styles.campo}
        onPress={abrir}
        disabled={desabilitado || instituicoes.length === 0}
        accessibilityRole="button"
        accessibilityLabel={`Instituição: ${rotulo}. Toque para trocar`}>
        <Text style={[styles.texto, !atual && styles.placeholder]} numberOfLines={2}>
          {rotulo}
        </Text>
        <Icon name={IconNames.expandMore} size="md" color={colors.text.secondary} />
      </TouchableOpacity>

      <ModalApp visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <View style={styles.fundo}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setAberto(false)} accessibilityLabel="Fechar" />
          <View style={styles.folha}>
            <Text style={styles.titulo} accessibilityRole="header">
              Escolha sua instituição
            </Text>
            <View style={styles.busca}>
              <Icon name={IconNames.search} size="md" color={colors.text.secondary} />
              <TextInput
                style={styles.buscaTexto}
                value={busca}
                onChangeText={setBusca}
                placeholder="Digite o nome ou a sigla"
                placeholderTextColor={colors.text.hint}
                autoFocus
                autoCorrect={false}
                accessibilityLabel="Buscar instituição"
              />
            </View>
            <FlatList
              data={achadas}
              keyExtractor={inst => inst.id}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.vazio}>Nenhuma instituição encontrada.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.linha}
                  onPress={() => escolher(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: item.id === valorId }}>
                  <Text style={styles.linhaTexto}>{item.nome}</Text>
                  {item.id === valorId ? <Icon name={IconNames.check} size="md" color={colors.primary.main} /> : null}
                </TouchableOpacity>
              )}
            />
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
  // Folha no topo: o teclado abre embaixo e não cobre a busca nem os primeiros resultados.
  fundo: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-start' },
  folha: {
    maxHeight: '60%',
    marginTop: 48,
    marginHorizontal: spacing.base,
    backgroundColor: colors.background.paper,
    borderRadius: 24,
    padding: spacing.lg,
  },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    minHeight: 48,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.neutral[50],
  },
  buscaTexto: { ...textStyles.body, flex: 1, color: colors.text.primary, paddingVertical: 0 },
  vazio: { ...textStyles.body, color: colors.text.secondary, textAlign: 'center', paddingVertical: spacing.lg },
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
