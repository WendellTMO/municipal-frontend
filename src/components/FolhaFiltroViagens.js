/**
 * Folha de baixo do funil em "Minhas Viagens": busca, situação (botões que ligam e desligam), sentido, rota,
 * motorista, veículo, período (atalhos ou datas De / Até), alunos confirmados e ordem. Cada toque já vale: o botão do fim só mostra quantas viagens ficaram e fecha.
 * Na web as datas usam o seletor do navegador. No celular o motorista digita DD/MM/AAAA.
 */
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { borderRadius, colors, spacing, textStyles } from '../theme';
import ModalApp from './ModalApp';
import ChipsFiltro from './ChipsFiltro';
import ChipsEscolha from './ChipsEscolha';
import {
  ALUNOS_VIAGEM,
  CHIPS_VIAGENS,
  ORDENS_VIAGEM,
  PERIODOS_RAPIDOS,
  TIPOS_VIAGEM,
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

const FolhaFiltroViagens = ({ visible, filtro, contagem, quantas, opcoes, onMudar, onFechar }) => {
  const mudar = parcial => onMudar({ ...filtro, ...parcial });
  let atalhoLigado = '';
  for (const atalho of PERIODOS_RAPIDOS) {
    const periodo = periodoRapido(atalho.id);
    if (filtro.de === periodo.de && filtro.ate === periodo.ate) atalhoLigado = atalho.id;
  }
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.folha}>
          <View style={styles.alca} accessibilityElementsHidden />
          <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
            <Text style={styles.titulo} accessibilityRole="header">
              Filtrar viagens
            </Text>

            <TextInput
              style={styles.busca}
              value={filtro.busca}
              onChangeText={busca => mudar({ busca })}
              placeholder="Buscar rota, motorista, placa..."
              placeholderTextColor={colors.text.hint}
              returnKeyType="search"
              autoCorrect={false}
              accessibilityLabel="Buscar viagens"
            />

            <Text style={styles.secao}>Situação</Text>
            <ChipsFiltro
              chips={CHIPS_VIAGENS}
              filtro={filtro}
              contagem={contagem}
              onAlternar={id => mudar({ [id]: !filtro[id] })}
            />

            <Text style={styles.secao}>Sentido</Text>
            <ChipsEscolha opcoes={TIPOS_VIAGEM} valor={filtro.tipo} onEscolher={tipo => mudar({ tipo })} />

            {opcoes.rotas.length > 1 ? (
              <>
                <Text style={styles.secao}>Rota</Text>
                <ChipsEscolha
                  opcoes={[{ id: '', texto: 'Todas' }, ...opcoes.rotas]}
                  valor={filtro.rota}
                  onEscolher={rota => mudar({ rota })}
                />
              </>
            ) : null}

            {opcoes.motoristas.length > 1 ? (
              <>
                <Text style={styles.secao}>Motorista</Text>
                <ChipsEscolha
                  opcoes={[{ id: '', texto: 'Todos' }, ...opcoes.motoristas]}
                  valor={filtro.motorista}
                  onEscolher={motorista => mudar({ motorista })}
                />
              </>
            ) : null}

            {opcoes.veiculos.length > 1 ? (
              <>
                <Text style={styles.secao}>Veículo</Text>
                <ChipsEscolha
                  opcoes={[{ id: '', texto: 'Todos' }, ...opcoes.veiculos]}
                  valor={filtro.veiculo}
                  onEscolher={veiculo => mudar({ veiculo })}
                />
              </>
            ) : null}

            <Text style={styles.secao}>Período</Text>
            <ChipsEscolha
              opcoes={PERIODOS_RAPIDOS}
              valor={atalhoLigado}
              onEscolher={id => mudar(id === atalhoLigado ? { de: '', ate: '' } : periodoRapido(id))}
            />
            <View style={styles.datas}>
              <CampoData rotulo="De" valor={filtro.de} onMudar={de => mudar({ de })} />
              <CampoData rotulo="Até" valor={filtro.ate} onMudar={ate => mudar({ ate })} />
            </View>

            <Text style={styles.secao}>Alunos confirmados</Text>
            <ChipsEscolha opcoes={ALUNOS_VIAGEM} valor={filtro.alunos} onEscolher={alunos => mudar({ alunos })} />

            <Text style={styles.secao}>Ordenar por</Text>
            <ChipsEscolha opcoes={ORDENS_VIAGEM} valor={filtro.ordem} onEscolher={ordem => mudar({ ordem })} />
            <Text style={styles.dica}>Mais longas e mais curtas usam o tempo real da viagem. Viagem sem tempo medido vai para o fim.</Text>

            {filtroAtivo(filtro) ? (
              <TouchableOpacity
                style={styles.limpar}
                onPress={() => onMudar(filtroViagensPadrao())}
                accessibilityRole="button"
                accessibilityLabel="Limpar filtros">
                <Text style={styles.limparTexto}>Limpar filtros</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
          <View style={styles.rodape}>
            <TouchableOpacity
              style={styles.ver}
              onPress={onFechar}
              accessibilityRole="button"
              accessibilityLabel={`Ver ${quantas} viagens`}>
              <Text style={styles.verTexto}>{quantas === 1 ? 'Ver 1 viagem' : `Ver ${quantas} viagens`}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  conteudo: { padding: spacing.lg, paddingBottom: spacing.base },
  titulo: { ...textStyles.h3, fontSize: 24, lineHeight: 30, color: colors.text.primary, marginBottom: spacing.base },
  secao: { ...textStyles.h5, color: colors.text.primary, marginBottom: spacing.sm },
  datas: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.base },
  busca: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing.md,
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
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
  dica: { ...textStyles.caption, color: colors.text.secondary, marginTop: -spacing.sm, marginBottom: spacing.base },
  limpar: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  limparTexto: { ...textStyles.button, fontSize: 18, color: colors.primary.dark },
  rodape: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg },
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
