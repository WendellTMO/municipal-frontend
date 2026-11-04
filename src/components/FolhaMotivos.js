/**
 * Folha que sobe de baixo com uma lista de opções grandes. Mesmo desenho da folha "Avisar alunos"
 * da viagem: fundo claro, ícone azul e texto escuro, sem botões vermelhos. Escolher uma opção já
 * envia; Voltar, Escape, voltar do sistema e toque no fundo só fecham.
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
import ModalApp from './ModalApp';

const TEXTO_MIN = 3;
const TEXTO_MAX = 200;

// opcoes: [{ texto, descricao, icone, onPress, pedirTexto }]. `carregandoIndice` marca a que está
// enviando. Com `pedirTexto` a folha mostra um campo e `onPress` recebe o que o motorista digitou.
const FolhaMotivos = ({ visible, titulo, resumo, opcoes, carregandoIndice = -1, onCancelar }) => {
  const ocupado = carregandoIndice >= 0;
  const [digitando, setDigitando] = useState(-1);
  const [texto, setTexto] = useState('');
  useEffect(() => {
    if (!visible) {
      setDigitando(-1);
      setTexto('');
    }
  }, [visible]);
  const escolhida = digitando >= 0 ? opcoes[digitando] : null;
  const textoValido = texto.trim().length >= TEXTO_MIN;
  const tocar = (opcao, i) => {
    if (opcao.pedirTexto) setDigitando(i);
    else opcao.onPress();
  };
  return (
    <ModalApp visible={visible} transparent animationType="slide" onRequestClose={onCancelar} accessibilityViewIsModal>
      <View style={styles.fundo}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onCancelar}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.folha}>
          <View style={styles.alca} accessibilityElementsHidden />
          <ScrollView contentContainerStyle={styles.conteudo}>
            <Text style={styles.titulo} accessibilityRole="header">
              {titulo}
            </Text>
            {resumo ? <Text style={styles.resumo}>{resumo}</Text> : null}
            {escolhida ? (
              <>
                <Text style={styles.campoRotulo}>Escreva o motivo</Text>
                <TextInput
                  style={styles.campo}
                  value={texto}
                  onChangeText={setTexto}
                  maxLength={TEXTO_MAX}
                  multiline
                  autoFocus
                  textAlignVertical="top"
                  placeholder="Ex.: estrada interditada por obra"
                  placeholderTextColor={colors.text.hint}
                  accessibilityLabel="Motivo da viagem não acontecer"
                />
                <Text style={styles.contador}>
                  {texto.length} / {TEXTO_MAX}
                </Text>
                <TouchableOpacity
                  style={[styles.enviar, (!textoValido || ocupado) && styles.enviarApagado]}
                  onPress={() => escolhida.onPress(texto.trim())}
                  disabled={!textoValido || ocupado}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !textoValido || ocupado }}
                  accessibilityLabel="Enviar aviso aos alunos">
                  {ocupado ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.enviarTexto}>Enviar aviso aos alunos</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.voltar}
                  onPress={() => setDigitando(-1)}
                  disabled={ocupado}
                  accessibilityRole="button"
                  accessibilityLabel="Voltar às opções">
                  <Text style={styles.voltarTexto}>Voltar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {opcoes.map((opcao, i) => (
                  <TouchableOpacity
                    key={opcao.texto}
                    style={[styles.opcao, ocupado && i !== carregandoIndice && styles.opcaoApagada]}
                    onPress={() => tocar(opcao, i)}
                    disabled={ocupado}
                    accessibilityRole="button"
                    accessibilityLabel={opcao.texto}>
                    <View style={styles.opcaoIcone}>
                      {i === carregandoIndice ? (
                        <ActivityIndicator color={colors.primary.dark} />
                      ) : (
                        <Icon name={opcao.icone} size="lg" color={colors.primary.dark} />
                      )}
                    </View>
                    <View style={styles.opcaoTextos}>
                      <Text style={styles.opcaoTitulo}>{opcao.texto}</Text>
                      {opcao.descricao ? <Text style={styles.opcaoDescricao}>{opcao.descricao}</Text> : null}
                    </View>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.voltar}
                  onPress={onCancelar}
                  disabled={ocupado}
                  accessibilityRole="button"
                  accessibilityLabel="Voltar">
                  <Text style={styles.voltarTexto}>Voltar</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
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
  conteudo: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  titulo: { ...textStyles.h3, fontSize: 24, lineHeight: 30, color: colors.text.primary },
  resumo: { ...textStyles.body, color: colors.text.secondary },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary.lighter,
  },
  opcaoApagada: { opacity: 0.4 },
  opcaoIcone: { width: 44, alignItems: 'center' },
  opcaoTextos: { flex: 1 },
  opcaoTitulo: { ...textStyles.h4, color: colors.primary.dark, fontWeight: '700' },
  opcaoDescricao: { ...textStyles.bodySmall, color: colors.text.secondary },
  campoRotulo: { ...textStyles.h5, color: colors.text.primary },
  campo: {
    minHeight: 112,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[50],
    padding: spacing.md,
    fontSize: 18,
    color: colors.text.primary,
  },
  contador: { ...textStyles.caption, color: colors.text.hint, textAlign: 'right' },
  enviar: {
    minHeight: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary.dark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  enviarApagado: { opacity: 0.4 },
  enviarTexto: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  voltar: { minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: borderRadius.lg },
  voltarTexto: { ...textStyles.button, fontSize: 20, color: colors.text.secondary },
});

export default FolhaMotivos;
