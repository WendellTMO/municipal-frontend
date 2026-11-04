/**
 * Folha de baixo do funil em "Minhas Viagens": situação (botões que ligam e desligam) e período
 * (atalhos ou datas De / Até). Cada toque já vale: o botão do fim só mostra quantas viagens ficaram e fecha.
 * Na web as datas usam o seletor do navegador. No celular o motorista digita DD/MM/AAAA.
 */
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { borderRadius, colors, spacing, textStyles } from '../theme';
import ModalApp from './ModalApp';
import ChipsFiltro from './ChipsFiltro';
import Tappable from './Tappable';
import {
  CHIPS_VIAGENS,
  PERIODOS_RAPIDOS,
  filtroAtivo,
  filtroViagensPadrao,
  periodoRapido,
} from '../utils/filtroViagens';

const CampoData = ({ rotulo, valor, onMudar }) => (
  <View style={styles.campoData}>
    <Text style={styles.campoRotulo}>{rotulo}</Text>
    {Platform.OS === 'web' ? (
      <input
        type="date"
        value={valor}
        aria-label={rotulo}
        onChange={e => onMudar(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box', padding: 12, fontSize: 18, minHeight: 52,
          borderRadius: 12, border: `1.5px solid ${colors.border.light}`,
          backgroundColor: colors.neutral[50], color: colors.text.primary, fontFamily: 'inherit',
        }}
      />
    ) : (
      <TextInput
        style={styles.campo}
        value={valor}
        onChangeText={onMudar}
        placeholder="DD/MM/AAAA"
        placeholderTextColor={colors.text.hint}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        accessibilityLabel={rotulo}
      />
    )}
  </View>
);

const FolhaFiltroViagens = ({ visible, filtro, contagem, quantas, onMudar, onFechar }) => {
  const mudar = parcial => onMudar({ ...filtro, ...parcial });
  return (
    <ModalApp visible={visible} transparent animationType="slide" onRequestClose={onFechar} accessibilityViewIsModal>
      <View style={styles.fundo}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onFechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar filtros"
        />
        <View style={styles.folha}>
          <View style={styles.alca} accessibilityElementsHidden />
          <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
            <Text style={styles.titulo} accessibilityRole="header">
              Filtrar viagens
            </Text>

            <Text style={styles.secao}>Situação</Text>
            <ChipsFiltro
              chips={CHIPS_VIAGENS}
              filtro={filtro}
              contagem={contagem}
              onAlternar={id => mudar({ [id]: !filtro[id] })}
            />

            <Text style={styles.secao}>Período</Text>
            <View style={styles.atalhos}>
              {PERIODOS_RAPIDOS.map(atalho => {
                const periodo = periodoRapido(atalho.id);
                const ligado = filtro.de === periodo.de && filtro.ate === periodo.ate;
                return (
                  <Tappable
                    key={atalho.id}
                    sombra={false}
                    style={[styles.atalho, ligado && styles.atalhoLigado]}
                    onPress={() => mudar(ligado ? { de: '', ate: '' } : periodo)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: ligado }}
                    accessibilityLabel={atalho.texto}>
                    <Text style={[styles.atalhoTexto, ligado && styles.atalhoTextoLigado]}>{atalho.texto}</Text>
                  </Tappable>
                );
              })}
            </View>
            <View style={styles.datas}>
              <CampoData rotulo="De" valor={filtro.de} onMudar={de => mudar({ de })} />
              <CampoData rotulo="Até" valor={filtro.ate} onMudar={ate => mudar({ ate })} />
            </View>

            {filtroAtivo(filtro) ? (
              <TouchableOpacity
                style={styles.limpar}
                onPress={() => onMudar(filtroViagensPadrao())}
                accessibilityRole="button"
                accessibilityLabel="Limpar filtros">
                <Text style={styles.limparTexto}>Limpar filtros</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.ver}
              onPress={onFechar}
              accessibilityRole="button"
              accessibilityLabel={`Ver ${quantas} viagens`}>
              <Text style={styles.verTexto}>{quantas === 1 ? 'Ver 1 viagem' : `Ver ${quantas} viagens`}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </ModalApp>
  );
};

const styles = StyleSheet.create({
  fundo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.6)' },
  folha: {
    maxHeight: '92%',
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    paddingTop: spacing.sm,
  },
  alca: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.neutral[300], alignSelf: 'center' },
  conteudo: { padding: spacing.lg, paddingBottom: spacing.xxl },
  titulo: { ...textStyles.h3, fontSize: 24, lineHeight: 30, color: colors.text.primary, marginBottom: spacing.base },
  secao: { ...textStyles.h5, color: colors.text.primary, marginBottom: spacing.sm },
  atalhos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  atalho: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.border.main,
    backgroundColor: colors.background.paper,
  },
  atalhoLigado: { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
  atalhoTexto: { ...textStyles.button, color: colors.text.secondary },
  atalhoTextoLigado: { color: '#FFFFFF' },
  datas: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.base },
  campoData: { flex: 1, minWidth: 0, gap: spacing.xs },
  campoRotulo: { ...textStyles.bodySmall, color: colors.text.secondary },
  campo: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing.md,
    fontSize: 18,
    color: colors.text.primary,
  },
  limpar: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  limparTexto: { ...textStyles.button, fontSize: 18, color: colors.primary.dark },
  ver: {
    minHeight: 60,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verTexto: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
});

export default FolhaFiltroViagens;
