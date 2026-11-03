/**
 * Campo "Instituição": mostra a instituição atual e abre uma busca no servidor. Não há texto livre:
 * só dá para escolher uma instituição que existe. A lista traz os melhores resultados primeiro e
 * mostra só os primeiros; para achar outra, é só continuar digitando.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { borderRadius, colors, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';
import ModalApp from './ModalApp';
import { criarBuscaRemota } from '../utils/buscaRemota';

export const LIMITE_RESULTADOS = 20;

// buscar(texto) devolve [{ id, nome, sigla }]; onEscolher(id, nome).
const SeletorInstituicao = ({ nomeAtual, valorId, buscar, onEscolher, desabilitado }) => {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState({ carregando: false, erro: false, itens: [] });
  const busca = useRef(null);

  useEffect(() => {
    busca.current = criarBuscaRemota({
      buscar,
      aoMudar: novo => setEstado(anterior => ({ ...anterior, ...novo })),
    });
    return () => busca.current.cancelar();
  }, [buscar]);

  const abrir = () => {
    setTexto('');
    setEstado({ carregando: true, erro: false, itens: [] });
    setAberto(true);
    busca.current.agora('');
  };

  const fechar = () => {
    busca.current.cancelar();
    setAberto(false);
  };

  const digitar = novo => {
    setTexto(novo);
    busca.current.digitar(novo);
  };

  const escolher = item => {
    fechar();
    onEscolher(item.id, item.nome);
  };

  const rotulo = nomeAtual || 'Escolha sua instituição';
  const cheio = estado.itens.length >= LIMITE_RESULTADOS;

  return (
    <>
      <TouchableOpacity
        style={styles.campo}
        onPress={abrir}
        disabled={desabilitado}
        accessibilityRole="button"
        accessibilityLabel={`Instituição: ${rotulo}. Toque para trocar`}>
        <Text style={[styles.texto, !nomeAtual && styles.placeholder]} numberOfLines={2}>
          {rotulo}
        </Text>
        <Icon name={IconNames.expandMore} size="md" color={colors.text.secondary} />
      </TouchableOpacity>

      <ModalApp visible={aberto} transparent animationType="fade" onRequestClose={fechar}>
        <View style={styles.fundo}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={fechar} accessibilityLabel="Fechar" />
          <View style={styles.folha}>
            <Text style={styles.titulo} accessibilityRole="header">
              Escolha sua instituição
            </Text>
            <View style={styles.busca}>
              <Icon name={IconNames.search} size="md" color={colors.text.secondary} />
              <TextInput
                style={styles.buscaTexto}
                value={texto}
                onChangeText={digitar}
                placeholder="Digite o nome ou a sigla"
                placeholderTextColor={colors.text.hint}
                autoFocus
                autoCorrect={false}
                accessibilityLabel="Buscar instituição"
              />
              {estado.carregando ? <ActivityIndicator size="small" color={colors.primary.main} /> : null}
            </View>

            {estado.erro ? (
              <TouchableOpacity onPress={() => busca.current.agora(texto)} accessibilityRole="button">
                <Text style={styles.erro}>Não foi possível buscar. Toque para tentar de novo.</Text>
              </TouchableOpacity>
            ) : (
              <FlatList
                data={estado.itens}
                keyExtractor={item => item.id}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  estado.carregando ? null : <Text style={styles.vazio}>Nenhuma instituição encontrada.</Text>
                }
                ListFooterComponent={
                  cheio ? <Text style={styles.dica}>Mostrando as {LIMITE_RESULTADOS} melhores. Continue digitando para refinar.</Text> : null
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.linha}
                    onPress={() => escolher(item)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: item.id === valorId }}>
                    <View style={styles.linhaTextos}>
                      <Text style={styles.linhaTexto}>{item.nome}</Text>
                      {item.sigla ? <Text style={styles.linhaSigla}>{item.sigla}</Text> : null}
                    </View>
                    {item.id === valorId ? <Icon name={IconNames.check} size="md" color={colors.primary.main} /> : null}
                  </TouchableOpacity>
                )}
              />
            )}
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
  titulo: { ...textStyles.h3, color: colors.text.primary, marginBottom: spacing.md },
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
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  linhaTextos: { flex: 1 },
  linhaTexto: { ...textStyles.body, color: colors.text.primary },
  linhaSigla: { ...textStyles.caption, color: colors.text.secondary },
  vazio: { ...textStyles.body, color: colors.text.secondary, textAlign: 'center', paddingVertical: spacing.lg },
  dica: { ...textStyles.caption, color: colors.text.secondary, textAlign: 'center', paddingVertical: spacing.md },
  erro: { ...textStyles.body, color: colors.error.main, textAlign: 'center', paddingVertical: spacing.lg },
});

export default SeletorInstituicao;
