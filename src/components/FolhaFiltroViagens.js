/**
 * Folha de baixo do funil em "Minhas Viagens". Em cima, o que se usa mais: busca, situação, sentido,
 * período e ordem. Rota, motorista, veículo e alunos ficam em "Mais filtros", que abre sozinho quando
 * algum deles está valendo. Cada toque já filtra a lista por trás: o botão do fim mostra quantas
 * viagens ficaram e fecha. Na web as datas usam o seletor do navegador. No celular digita DD/MM/AAAA.
 */
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { borderRadius, colors, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';
import ModalApp from './ModalApp';
import ChipsFiltro from './ChipsFiltro';
import ChipsEscolha from './ChipsEscolha';
import Tappable from './Tappable';
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

// Bolinha de cada situação nos botões desligados, as mesmas cores dos selos da lista.
const COR_DA_SITUACAO = {
  aIniciar: colors.warning.main,
  emAndamento: colors.primary.dark,
  naoRealizadas: colors.text.secondary,
  canceladas: colors.error.main,
  finalizadas: colors.success.main,
};
const CHIPS_COM_COR = CHIPS_VIAGENS.map(chip => ({ ...chip, cor: COR_DA_SITUACAO[chip.id] }));

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

const Secao = ({ titulo, children }) => (
  <View style={styles.secao}>
    <Text style={styles.secaoTitulo}>{titulo}</Text>
    {children}
  </View>
);

const FolhaFiltroViagens = ({ visible, filtro, contagem, quantas, total, opcoes, onMudar, onFechar }) => {
  const mudar = parcial => onMudar({ ...filtro, ...parcial });
  const padrao = filtroViagensPadrao();

  let atalhoLigado = '';
  for (const atalho of PERIODOS_RAPIDOS) {
    const periodo = periodoRapido(atalho.id);
    if (filtro.de === periodo.de && filtro.ate === periodo.ate) atalhoLigado = atalho.id;
  }

  // "Mais filtros": quantos estão valendo e se a seção abre sozinha.
  let avancadosAtivos = 0;
  for (const chave of ['rota', 'motorista', 'veiculo', 'alunos']) {
    if (filtro[chave] !== padrao[chave]) avancadosAtivos += 1;
  }
  const [maisAberto, setMaisAberto] = useState(false);
  useEffect(() => {
    if (visible) setMaisAberto(avancadosAtivos > 0);
    // só ao abrir a folha: mexer num filtro lá dentro não pode fechar a seção
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

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
          <View style={styles.cabecalho}>
            <Text style={styles.titulo} accessibilityRole="header">
              Filtrar viagens
            </Text>
            {filtroAtivo(filtro) ? (
              <TouchableOpacity
                style={styles.limpar}
                onPress={() => onMudar(filtroViagensPadrao())}
                accessibilityRole="button"
                accessibilityLabel="Limpar filtros">
                <Text style={styles.limparTexto}>Limpar</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.fechar} onPress={onFechar} accessibilityRole="button" accessibilityLabel="Fechar">
              <Icon name={IconNames.close} size="md" color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
            <View style={styles.buscaCaixa}>
              <Icon name={IconNames.search} size="md" color={colors.text.hint} />
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
              {filtro.busca ? (
                <TouchableOpacity onPress={() => mudar({ busca: '' })} accessibilityRole="button" accessibilityLabel="Apagar busca">
                  <Icon name={IconNames.close} size="md" color={colors.text.secondary} />
                </TouchableOpacity>
              ) : null}
            </View>

            <Secao titulo="Situação">
              <ChipsFiltro
                chips={CHIPS_COM_COR}
                filtro={filtro}
                contagem={contagem}
                onAlternar={id => mudar({ [id]: !filtro[id] })}
              />
            </Secao>

            <Secao titulo="Sentido">
              <ChipsEscolha opcoes={TIPOS_VIAGEM} valor={filtro.tipo} onEscolher={tipo => mudar({ tipo })} />
            </Secao>

            <Secao titulo="Período">
              <ChipsEscolha
                opcoes={PERIODOS_RAPIDOS}
                valor={atalhoLigado}
                onEscolher={id => mudar(id === atalhoLigado ? { de: '', ate: '' } : periodoRapido(id))}
              />
              <View style={styles.datas}>
                <CampoData rotulo="De" valor={filtro.de} onMudar={de => mudar({ de })} />
                <CampoData rotulo="Até" valor={filtro.ate} onMudar={ate => mudar({ ate })} />
              </View>
            </Secao>

            <Secao titulo="Ordenar por">
              <ChipsEscolha opcoes={ORDENS_VIAGEM} valor={filtro.ordem} onEscolher={ordem => mudar({ ordem })} />
              <Text style={styles.dica}>Mais longas e mais curtas usam o tempo real da viagem. Viagem sem tempo medido vai para o fim.</Text>
            </Secao>

            <View style={styles.mais}>
              <Tappable
                sombra={false}
                style={styles.maisCabecalho}
                onPress={() => setMaisAberto(aberto => !aberto)}
                accessibilityRole="button"
                accessibilityState={{ expanded: maisAberto }}
                accessibilityLabel="Mais filtros">
                <Text style={styles.maisTitulo}>Mais filtros</Text>
                {avancadosAtivos > 0 ? (
                  <View style={styles.maisContagem}>
                    <Text style={styles.maisContagemTexto}>{avancadosAtivos}</Text>
                  </View>
                ) : null}
                <View style={styles.maisEspaco} />
                <Icon name={maisAberto ? IconNames.expandLess : IconNames.expandMore} size="lg" color={colors.primary.dark} />
              </Tappable>
              {maisAberto ? (
                <View style={styles.maisCorpo}>
                  {opcoes.rotas.length > 1 ? (
                    <Secao titulo="Rota">
                      <ChipsEscolha
                        opcoes={[{ id: '', texto: 'Todas' }, ...opcoes.rotas]}
                        valor={filtro.rota}
                        onEscolher={rota => mudar({ rota })}
                      />
                    </Secao>
                  ) : null}
                  {opcoes.motoristas.length > 1 ? (
                    <Secao titulo="Motorista">
                      <ChipsEscolha
                        opcoes={[{ id: '', texto: 'Todos' }, ...opcoes.motoristas]}
                        valor={filtro.motorista}
                        onEscolher={motorista => mudar({ motorista })}
                      />
                    </Secao>
                  ) : null}
                  {opcoes.veiculos.length > 1 ? (
                    <Secao titulo="Veículo">
                      <ChipsEscolha
                        opcoes={[{ id: '', texto: 'Todos' }, ...opcoes.veiculos]}
                        valor={filtro.veiculo}
                        onEscolher={veiculo => mudar({ veiculo })}
                      />
                    </Secao>
                  ) : null}
                  <Secao titulo="Alunos confirmados">
                    <ChipsEscolha opcoes={ALUNOS_VIAGEM} valor={filtro.alunos} onEscolher={alunos => mudar({ alunos })} />
                  </Secao>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.rodape}>
            <TouchableOpacity
              style={[styles.ver, quantas === 0 && styles.verVazio]}
              onPress={onFechar}
              accessibilityRole="button"
              accessibilityLabel={`Ver ${quantas} viagens`}>
              <Text style={styles.verTexto}>{quantas === 1 ? 'Ver 1 viagem' : `Ver ${quantas} viagens`}</Text>
              <Text style={styles.verSub}>de {total} no total</Text>
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
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  titulo: { ...textStyles.h3, fontSize: 24, lineHeight: 30, color: colors.text.primary, flex: 1 },
  limpar: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md },
  limparTexto: { ...textStyles.button, fontSize: 18, color: colors.primary.dark },
  fechar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center' },
  conteudo: { padding: spacing.lg, paddingBottom: spacing.base },
  buscaCaixa: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    borderRadius: 26,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  busca: { flex: 1, minWidth: 0, fontSize: 18, color: colors.text.primary, paddingVertical: spacing.sm },
  secao: { marginBottom: spacing.xs },
  secaoTitulo: { ...textStyles.h5, color: colors.text.primary, marginBottom: spacing.sm },
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
  dica: { ...textStyles.caption, color: colors.text.secondary, marginTop: -spacing.sm, marginBottom: spacing.base },
  mais: { borderRadius: borderRadius.lg, backgroundColor: colors.primary.lighter, overflow: 'hidden' },
  maisCabecalho: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  maisTitulo: { ...textStyles.h4, color: colors.primary.dark },
  maisContagem: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  maisContagemTexto: { ...textStyles.caption, color: '#FFFFFF', fontWeight: '700' },
  maisEspaco: { flex: 1 },
  maisCorpo: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, backgroundColor: colors.background.paper },
  rodape: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  ver: {
    minHeight: 60,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary.dark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  verVazio: { backgroundColor: colors.neutral[600] },
  verTexto: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  verSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
});

export default FolhaFiltroViagens;
