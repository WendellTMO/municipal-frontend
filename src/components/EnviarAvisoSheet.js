/**
 * Janela "Enviar aviso" do painel do gestor: notificação para os alunos de uma rota
 * ou de uma viagem. Limites: título 120 (coluna do banco), mensagem 300 (contador).
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { borderRadius, colors, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';
import { gestorService } from '../services/gestorService';
import notificacaoService from '../services/notificacaoService';
import { unwrapItems } from '../types';
import { getErrorMessageFromError } from '../utils/errors';
import { isoLocal } from '../utils/saudacao';
import { horaCurta } from '../utils/viagemPainel';
import ModalApp from './ModalApp';

export const TITULO_MAX = 120;
export const MENSAGEM_MAX = 300;

const MODOS = [
  { chave: 'ROTA', rotulo: 'Rota inteira' },
  { chave: 'VIAGEM', rotulo: 'Uma viagem' },
];

const rotuloViagem = v => {
  const [, mes, dia] = String(v.data || '').split('T')[0].split('-');
  return `${dia}/${mes} ${horaCurta(v.horario_inicio)} · ${v.rota_nome || 'Viagem'}`;
};

const EnviarAvisoSheet = ({ visible, onClose, onSent }) => {
  const [modo, setModo] = useState('ROTA');
  const [rotas, setRotas] = useState([]);
  const [viagens, setViagens] = useState([]);
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [listaAberta, setListaAberta] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!visible) return;
    const carregar = async () => {
      const hoje = new Date();
      const limite = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 7);
      try {
        const lista = await gestorService.listarRotas().then(unwrapItems);
        setRotas(lista);
      } catch (e) {
        setRotas([]);
      }
      try {
        const lista = await gestorService
          .listarViagens({ data_inicio: isoLocal(hoje), data_fim: isoLocal(limite) })
          .then(unwrapItems);
        setViagens(lista.filter(v => v.status === 'AGENDADA' || v.status === 'EM_ANDAMENTO'));
      } catch (e) {
        setViagens([]);
      }
    };
    carregar();
  }, [visible]);

  const opcoes = modo === 'ROTA' ? rotas : viagens;
  const selecionado = opcoes.find(o => o.id === selecionadoId) || null;
  const rotuloSelecionado = selecionado
    ? modo === 'ROTA'
      ? selecionado.nome
      : rotuloViagem(selecionado)
    : modo === 'ROTA'
    ? 'Escolha a rota'
    : 'Escolha a viagem';

  const podeEnviar =
    !!selecionado && titulo.trim().length > 0 && mensagem.trim().length > 0 && !enviando;

  const trocarModo = novo => {
    setModo(novo);
    setSelecionadoId(null);
    setListaAberta(false);
  };

  const handleEnviar = async () => {
    setErro('');
    setEnviando(true);
    try {
      const corpo = { titulo: titulo.trim(), mensagem: mensagem.trim() };
      if (modo === 'ROTA') corpo.rota_id = selecionadoId;
      else corpo.viagem_id = selecionadoId;
      const resposta = await notificacaoService.createNotificacao(corpo);
      setTitulo('');
      setMensagem('');
      setSelecionadoId(null);
      onSent(resposta?.message || 'Aviso enviado.');
    } catch (e) {
      // inclui o 404 de "nenhum aluno"; o texto digitado fica
      setErro(getErrorMessageFromError(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ModalApp visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Fechar"
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
            <Text style={styles.title}>Enviar aviso</Text>
            <Text style={styles.subtitle}>O aviso chega como notificação no app dos alunos.</Text>

            <View style={styles.segmento}>
              {MODOS.map(m => {
                const ativo = modo === m.chave;
                return (
                  <TouchableOpacity
                    key={m.chave}
                    style={[styles.segmentoItem, ativo && styles.segmentoItemAtivo]}
                    onPress={() => trocarModo(m.chave)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: ativo }}>
                    <Text style={[styles.segmentoTexto, ativo && styles.segmentoTextoAtivo]}>
                      {m.rotulo}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.seletor}
              onPress={() => setListaAberta(!listaAberta)}
              accessibilityRole="button"
              accessibilityLabel={rotuloSelecionado}>
              <Text
                style={[styles.seletorTexto, !selecionado && { color: colors.text.hint }]}
                numberOfLines={1}>
                {rotuloSelecionado}
              </Text>
              <Icon
                name={listaAberta ? IconNames.expandLess : IconNames.expandMore}
                size="md"
                color={colors.text.secondary}
              />
            </TouchableOpacity>
            {listaAberta ? (
              <View style={styles.lista}>
                {opcoes.length === 0 ? (
                  <Text style={styles.listaVazia}>
                    {modo === 'ROTA' ? 'Nenhuma rota encontrada' : 'Nenhuma viagem hoje ou nos próximos dias'}
                  </Text>
                ) : (
                  <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                    {opcoes.map(o => (
                      <TouchableOpacity
                        key={o.id}
                        style={styles.listaItem}
                        onPress={() => {
                          setSelecionadoId(o.id);
                          setListaAberta(false);
                        }}>
                        <Text style={styles.listaItemTexto} numberOfLines={1}>
                          {modo === 'ROTA' ? o.nome : rotuloViagem(o)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            ) : null}

            <TextInput
              style={styles.campo}
              placeholder="Título"
              placeholderTextColor={colors.text.hint}
              value={titulo}
              onChangeText={setTitulo}
              maxLength={TITULO_MAX}
              accessibilityLabel="Título do aviso"
            />
            <View>
              <TextInput
                style={[styles.campo, styles.campoMensagem]}
                placeholder="Mensagem"
                placeholderTextColor={colors.text.hint}
                value={mensagem}
                onChangeText={setMensagem}
                maxLength={MENSAGEM_MAX}
                multiline
                textAlignVertical="top"
                accessibilityLabel="Mensagem do aviso"
              />
              <Text style={styles.contador}>
                {mensagem.length} / {MENSAGEM_MAX}
              </Text>
            </View>

            {erro ? <Text style={styles.erro}>{erro}</Text> : null}

            <TouchableOpacity
              style={[styles.botao, !podeEnviar && styles.botaoDesabilitado]}
              onPress={handleEnviar}
              disabled={!podeEnviar}
              accessibilityRole="button"
              accessibilityState={{ disabled: !podeEnviar }}>
              {enviando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.botaoTexto}>Enviar</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '92%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...textStyles.h3, color: colors.text.primary },
  subtitle: { ...textStyles.body, color: colors.text.secondary, marginTop: 4, marginBottom: spacing.base },
  segmento: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: 14,
    padding: 4,
    marginBottom: spacing.md,
  },
  segmentoItem: { flex: 1, paddingVertical: spacing.md, borderRadius: 10, alignItems: 'center' },
  segmentoItemAtivo: { backgroundColor: colors.primary.main },
  segmentoTexto: { ...textStyles.body, fontWeight: '700', color: colors.text.primary },
  segmentoTextoAtivo: { color: '#FFFFFF' },
  seletor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing.base,
    minHeight: 52,
    marginBottom: spacing.md,
  },
  seletorTexto: { ...textStyles.body, color: colors.text.primary, flex: 1 },
  lista: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  listaItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border.light },
  listaItemTexto: { ...textStyles.body, color: colors.text.primary },
  listaVazia: { ...textStyles.bodySmall, color: colors.text.secondary, padding: spacing.md },
  campo: {
    borderWidth: 1.5,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  campoMensagem: { minHeight: 110, paddingBottom: spacing.xl },
  contador: {
    position: 'absolute',
    right: spacing.base,
    bottom: spacing.lg,
    ...textStyles.caption,
    color: colors.text.hint,
  },
  erro: { ...textStyles.bodySmall, color: colors.error.main, marginBottom: spacing.sm },
  botao: {
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoDesabilitado: { opacity: 0.45 },
  botaoTexto: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
});

export default EnviarAvisoSheet;
