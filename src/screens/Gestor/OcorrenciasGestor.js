import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import TelaSegura from '../../components/TelaSegura';
import { listarOcorrencias, resolverOcorrencia } from '../../services/ocorrenciaService';
import { colors, spacing, textStyles, borderRadius } from '../../theme';
import Icon, { IconNames } from '../../components/Icon';
import SubHeader from '../../components/SubHeader';
import { useToast } from '../../components/Toast';
import { confirmAction } from '../../utils/confirm';
import { getErrorMessageFromError } from '../../utils/errors';
import { withFabSpace } from '../../config/feedback';
import SairDaConta from '../../components/SairDaConta';
import ModalApp from '../../components/ModalApp';
import Tappable from '../../components/Tappable';

const TIPOS = {
  ATRASO: 'Atraso',
  SUPERLOTACAO: 'Superlotação',
  COMPORTAMENTO: 'Comportamento',
  CANCELAMENTO: 'Cancelamento',
  OUTRO: 'Outro',
};

const FILTROS = [
  { chave: 'ABERTA', rotulo: 'Abertas' },
  { chave: 'TODAS', rotulo: 'Todas' },
];

// "2026-10-22 08:15:00.123" -> "22/10 08:15"
const quando = texto => {
  const [data, hora] = String(texto || '').replace('T', ' ').split(' ');
  if (!data) return '';
  const [, mes, dia] = data.split('-');
  return `${dia}/${mes} ${(hora || '').substring(0, 5)}`.trim();
};

const OcorrenciasGestor = ({ navigation }) => {
  const toast = useToast();
  const [filtro, setFiltro] = useState('ABERTA');
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizando, setAtualizando] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [resolvendo, setResolvendo] = useState(false);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const dados = await listarOcorrencias(filtro === 'ABERTA' ? 'ABERTA' : undefined);
      setItens(Array.isArray(dados) ? dados : []);
    } catch (e) {
      setErro(getErrorMessageFromError(e));
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [filtro]);

  useEffect(() => {
    setCarregando(true);
    carregar();
  }, [carregar]);

  const resolver = () => {
    if (!detalhe) return;
    confirmAction({
      title: 'Marcar como resolvida',
      message: 'Esta ocorrência sairá da lista de abertas.',
      confirmText: 'Resolver',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        setResolvendo(true);
        try {
          await resolverOcorrencia(detalhe.id);
          toast.success('Ocorrência resolvida!');
          setDetalhe(null);
          carregar();
        } catch (e) {
          toast.error(getErrorMessageFromError(e));
        } finally {
          setResolvendo(false);
        }
      },
    });
  };

  return (
    <TelaSegura style={styles.container}>
      <SubHeader titulo="Ocorrências" onBack={() => navigation.goBack()} />

      <View style={styles.filtros}>
        {FILTROS.map(f => {
          const ativo = filtro === f.chave;
          return (
            <Tappable
              key={f.chave}
              style={[styles.filtro, ativo && styles.filtroAtivo]}
              onPress={() => setFiltro(f.chave)}
              accessibilityRole="radio"
              accessibilityState={{ checked: ativo }}>
              <Text style={[styles.filtroTexto, ativo && styles.filtroTextoAtivo]}>{f.rotulo}</Text>
            </Tappable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={withFabSpace(styles.lista)}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              setAtualizando(true);
              carregar();
            }}
          />
        }>
        {carregando ? (
          <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary.main} />
        ) : erro ? (
          <View style={styles.vazio}>
            <Text style={styles.vazioTexto}>{erro}</Text>
            <Tappable onPress={carregar} accessibilityRole="button" accessibilityLabel="Tentar de novo">
              <Icon name={IconNames.refresh} size="lg" color={colors.primary.main} />
            </Tappable>
          </View>
        ) : itens.length === 0 ? (
          <View style={styles.vazio}>
            <Icon name={IconNames.checkCircle} size="xxl" color={colors.success.main} />
            <Text style={styles.vazioTexto}>
              {filtro === 'ABERTA' ? 'Nenhuma ocorrência aberta' : 'Nenhuma ocorrência registrada'}
            </Text>
          </View>
        ) : (
          itens.map(o => (
            <Tappable
              key={o.id}
              style={styles.item}
              onPress={() => setDetalhe(o)}
              accessibilityRole="button"
              accessibilityLabel={`${TIPOS[o.tipo] || o.tipo}, relatada por ${o.autor_nome}, ${o.status === 'ABERTA' ? 'aberta' : 'resolvida'}`}>
              <View style={styles.itemTopo}>
                <Text style={styles.itemTipo}>{TIPOS[o.tipo] || o.tipo}</Text>
                <Text style={[styles.itemStatus, o.status === 'ABERTA' ? styles.aberta : styles.resolvida]}>
                  {o.status === 'ABERTA' ? 'Aberta' : 'Resolvida'}
                </Text>
              </View>
              {o.descricao ? (
                <Text style={styles.itemDescricao} numberOfLines={2}>
                  {o.descricao}
                </Text>
              ) : null}
              <Text style={styles.itemMeta}>
                {o.autor_nome}
                {o.viagem_id ? ' · viagem vinculada' : ''} · {quando(o.created_at)}
              </Text>
            </Tappable>
          ))
        )}
        <SairDaConta />
      </ScrollView>

      <ModalApp visible={!!detalhe} transparent animationType="slide" onRequestClose={() => setDetalhe(null)}>
        <View style={styles.overlay}>
          <Tappable style={styles.backdrop} activeOpacity={1} onPress={() => setDetalhe(null)} accessibilityLabel="Fechar" />
          {detalhe ? (
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.detalheTitulo}>{TIPOS[detalhe.tipo] || detalhe.tipo}</Text>
              <Text style={styles.itemMeta}>
                {detalhe.autor_nome} · {quando(detalhe.created_at)}
                {detalhe.viagem_id ? ' · viagem vinculada' : ''}
              </Text>
              <ScrollView style={{ maxHeight: 240 }}>
                <Text style={styles.detalheTexto}>{detalhe.descricao || 'Sem descrição.'}</Text>
              </ScrollView>
              {detalhe.status === 'ABERTA' ? (
                <Tappable
                  style={styles.botao}
                  onPress={resolver}
                  disabled={resolvendo}
                  accessibilityRole="button"
                  accessibilityLabel="Marcar como resolvida">
                  {resolvendo ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.botaoTexto}>Marcar como resolvida</Text>
                  )}
                </Tappable>
              ) : (
                <Text style={styles.resolvidaTexto}>Ocorrência resolvida</Text>
              )}
            </View>
          ) : null}
        </View>
      </ModalApp>
    </TelaSegura>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default },
  filtros: { flexDirection: 'row', gap: spacing.sm, padding: spacing.base },
  filtro: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    backgroundColor: colors.background.paper,
  },
  filtroAtivo: { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
  filtroTexto: { ...textStyles.body, fontWeight: '600', color: colors.text.primary },
  filtroTextoAtivo: { color: '#FFFFFF' },
  lista: { paddingHorizontal: spacing.base, gap: spacing.sm },
  item: { backgroundColor: colors.background.paper, borderRadius: borderRadius.lg, padding: spacing.base },
  itemTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTipo: { ...textStyles.h5, color: colors.text.primary },
  itemStatus: { ...textStyles.caption, fontWeight: '700' },
  aberta: { color: colors.error.main },
  resolvida: { color: colors.success.dark },
  itemDescricao: { ...textStyles.body, color: colors.text.secondary, marginTop: spacing.xs },
  itemMeta: { ...textStyles.caption, color: colors.text.secondary, marginTop: spacing.xs },
  vazio: { alignItems: 'center', gap: spacing.md, marginTop: spacing.xxl },
  vazioTexto: { ...textStyles.body, color: colors.text.secondary, textAlign: 'center' },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.5)' },
  sheet: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
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
  detalheTitulo: { ...textStyles.h3, color: colors.text.primary },
  detalheTexto: { ...textStyles.body, color: colors.text.primary, marginTop: spacing.md },
  botao: {
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.solid.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  botaoTexto: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  resolvidaTexto: { ...textStyles.body, color: colors.success.dark, marginTop: spacing.lg, fontWeight: '700' },
});

export default OcorrenciasGestor;
