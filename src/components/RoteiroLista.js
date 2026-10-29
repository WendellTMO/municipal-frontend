/**
 * Lista do Roteiro da viagem: um cartão por grupo (embarque, instituição, desembarque).
 * Cada linha mostra número, nome, etiquetas de contagem e, ao tocar, os nomes dos alunos.
 * Os grupos vêm prontos de montarRoteiro (src/utils/roteiroViagem.js).
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { borderRadius, colors, fontFamily, spacing } from '../theme';
import Icon, { IconNames } from './Icon';
import { textoAlunos } from '../utils/roteiroViagem';

const MAX_NOMES = 5;

const iniciais = nome => {
  const partes = String(nome).trim().split(/\s+/);
  let letras = partes[0].charAt(0);
  if (partes.length > 1) letras += partes[partes.length - 1].charAt(0);
  return letras.toUpperCase();
};

const ListaNomes = ({ lista, verTudo, onVerTudo }) => {
  const nomes = lista.nomes;
  let visiveis = nomes;
  if (!verTudo && nomes.length > MAX_NOMES) visiveis = nomes.slice(0, MAX_NOMES);
  const restantes = nomes.length - visiveis.length;
  return (
    <View style={styles.lista}>
      {lista.titulo ? <Text style={styles.listaTitulo}>{lista.titulo}</Text> : null}
      {visiveis.map((nome, i) => (
        <View key={`${nome}-${i}`} style={styles.aluno}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{iniciais(nome)}</Text>
          </View>
          <Text style={styles.alunoNome} numberOfLines={2}>
            {nome}
          </Text>
        </View>
      ))}
      {restantes > 0 ? (
        <TouchableOpacity
          style={styles.verMais}
          onPress={onVerTudo}
          accessibilityRole="button"
          accessibilityLabel={`Ver mais ${textoAlunos(restantes)}`}>
          <Text style={styles.verMaisTexto}>Ver mais {textoAlunos(restantes)}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const Linha = ({ item, aberta, onAlternar, verTudo, onVerTudo, ultima }) => {
  const feita = item.estado === 'feita';
  const proxima = item.estado === 'proxima';
  const circulo = [styles.numero];
  const textoNumero = [styles.numeroTexto];
  if (item.instituicao) {
    circulo.push(styles.numeroInstituicao);
    textoNumero.push(styles.numeroInstituicaoTexto);
  }
  if (feita) {
    circulo.push(styles.numeroFeita);
    textoNumero.push(styles.numeroCheioTexto);
  }
  if (proxima) {
    circulo.push(styles.numeroProxima);
    textoNumero.push(styles.numeroCheioTexto);
  }

  let resumo = item.etiquetas.map(e => e.texto).join(', ');
  if (proxima) resumo = `${resumo}, próximo`;
  const rotulo = `Parada ${item.numero}, ${item.nome}, ${resumo}`;
  const podeAbrir = !item.vazio;

  return (
    <View style={[styles.linhaBloco, !ultima && styles.linhaDivisor]}>
      <TouchableOpacity
        style={[styles.linha, item.vazio && styles.linhaVazia]}
        onPress={podeAbrir ? onAlternar : undefined}
        activeOpacity={podeAbrir ? 0.6 : 1}
        accessibilityRole={podeAbrir ? 'button' : 'text'}
        accessibilityLabel={rotulo}
        accessibilityState={podeAbrir ? { expanded: aberta } : { disabled: true }}>
        <View style={circulo}>
          <Text style={textoNumero}>{item.numero}</Text>
        </View>
        <View style={styles.meio}>
          <View style={styles.textos}>
            <Text style={[styles.nome, feita && styles.nomeFeito]} numberOfLines={4}>
              {item.nome}
            </Text>
            {item.detalhe ? (
              <Text style={styles.detalhe} numberOfLines={2}>
                {item.detalhe}
              </Text>
            ) : null}
            {proxima ? (
              <View style={styles.etiquetaProxima}>
                <Text style={styles.etiquetaProximaTexto}>Próximo</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.etiquetas}>
            {item.etiquetas.map(e => (
              <View key={e.texto} style={[styles.pilula, styles[`pilula_${e.tom}`]]}>
                <Text style={[styles.pilulaTexto, styles[`pilulaTexto_${e.tom}`]]}>{e.texto}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.seta}>
          {podeAbrir ? (
            <Icon name={aberta ? IconNames.expandLess : IconNames.expandMore} size="md" color={colors.neutral[500]} />
          ) : null}
        </View>
      </TouchableOpacity>
      {aberta && podeAbrir ? (
        <View style={styles.corpo}>
          {item.listas.map((lista, i) =>
            lista.nomes.length > 0 ? (
              <ListaNomes key={i} lista={lista} verTudo={!!verTudo[i]} onVerTudo={() => onVerTudo(i)} />
            ) : null,
          )}
        </View>
      ) : null}
    </View>
  );
};

const RoteiroLista = ({ grupos }) => {
  const [abertas, setAbertas] = useState({});
  const [verTudo, setVerTudo] = useState({});

  const alternar = chave => setAbertas({ ...abertas, [chave]: !abertas[chave] });
  const expandir = (chave, indiceLista) => {
    const atual = verTudo[chave] || {};
    setVerTudo({ ...verTudo, [chave]: { ...atual, [indiceLista]: true } });
  };

  return (
    <View>
      {grupos.map(grupo => (
        <View key={grupo.titulo} style={styles.grupo}>
          <View style={styles.grupoCabecalho}>
            <Text style={styles.grupoTitulo} accessibilityRole="header">
              {grupo.titulo.toUpperCase()}
            </Text>
            {grupo.total !== null ? (
              <View style={styles.total} accessibilityLabel={`Total, ${textoAlunos(grupo.total)}`}>
                <Text style={styles.totalTexto}>{textoAlunos(grupo.total)}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.cartao}>
            {grupo.itens.map((item, indice) => {
              const chave = `${grupo.titulo}|${item.chave}`;
              return (
                <Linha
                  key={chave}
                  item={item}
                  aberta={!!abertas[chave]}
                  onAlternar={() => alternar(chave)}
                  verTudo={verTudo[chave] || {}}
                  onVerTudo={i => expandir(chave, i)}
                  ultima={indice === grupo.itens.length - 1}
                />
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grupo: { marginBottom: spacing.lg },
  grupoCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  grupoTitulo: {
    flexShrink: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.neutral[500],
  },
  total: { backgroundColor: colors.neutral[200], borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 3 },
  totalTexto: { fontFamily: fontFamily.semiBold, fontSize: 13, fontWeight: '700', color: colors.neutral[600] },
  cartao: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  linhaBloco: { backgroundColor: colors.background.paper },
  linhaDivisor: { borderBottomWidth: 1, borderBottomColor: colors.border.light },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  linhaVazia: { opacity: 0.6 },
  numero: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.lighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroInstituicao: { backgroundColor: colors.warning.light },
  numeroFeita: { backgroundColor: colors.solid.green },
  numeroProxima: { backgroundColor: colors.primary.main },
  numeroTexto: { fontFamily: fontFamily.bold, fontSize: 14, fontWeight: '700', color: colors.primary.main },
  numeroInstituicaoTexto: { color: '#92400E' },
  numeroCheioTexto: { color: '#FFFFFF' },
  // As etiquetas descem para baixo do nome quando a linha fica estreita (320 px).
  meio: { flex: 1, minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: spacing.sm, rowGap: spacing.xs },
  textos: { flexGrow: 1, flexShrink: 1, flexBasis: 120, minWidth: 0 },
  nome: { fontFamily: fontFamily.semiBold, fontSize: 16, fontWeight: '700', color: colors.text.primary },
  nomeFeito: { color: colors.neutral[500], fontWeight: '600' },
  detalhe: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.neutral[500], marginTop: 2 },
  etiquetaProxima: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  etiquetaProximaTexto: { fontFamily: fontFamily.bold, fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  etiquetas: { alignItems: 'flex-start', gap: spacing.xs, flexShrink: 0 },
  pilula: { borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 3 },
  pilula_azul: { backgroundColor: colors.primary.lighter },
  pilula_ambar: { backgroundColor: colors.warning.light },
  pilula_cinza: { backgroundColor: colors.neutral[100] },
  pilulaTexto: { fontFamily: fontFamily.semiBold, fontSize: 13, fontWeight: '700' },
  pilulaTexto_azul: { color: colors.primary.dark },
  pilulaTexto_ambar: { color: '#92400E' },
  pilulaTexto_cinza: { color: colors.neutral[500] },
  seta: { width: 20, alignItems: 'center' },
  corpo: { paddingHorizontal: spacing.base, paddingBottom: spacing.md },
  lista: { paddingLeft: 32 + spacing.md },
  listaTitulo: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  aluno: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 40 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { fontFamily: fontFamily.bold, fontSize: 13, fontWeight: '700', color: colors.neutral[600] },
  alunoNome: { flex: 1, minWidth: 0, fontFamily: fontFamily.regular, fontSize: 16, color: colors.text.primary },
  verMais: { minHeight: 44, justifyContent: 'center', paddingLeft: 28 + spacing.md },
  verMaisTexto: { fontFamily: fontFamily.semiBold, fontSize: 15, fontWeight: '700', color: colors.primary.main },
});

export default RoteiroLista;
