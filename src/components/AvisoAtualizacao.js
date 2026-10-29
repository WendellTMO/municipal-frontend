/**
 * Aviso de nova versão do APK. Fica na raiz do app e vale para qualquer tela.
 * Consulta ao abrir o app e quando ele volta do segundo plano. Falha na consulta nunca aparece.
 */
import React from 'react';
import { AppState, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import ModalApp from './ModalApp';
import { verificarAtualizacao } from '../services/atualizacaoApp';
import { ATUALIZACAO_VIA_APK_ATIVA } from '../config/atualizacao';

const AvisoAtualizacao = () => {
  const [pendente, setPendente] = React.useState(null);
  const [erroAbrir, setErroAbrir] = React.useState(false);
  // "Depois" vale até fechar o app; a obrigatória ignora isso.
  const dispensou = React.useRef(false);

  React.useEffect(() => {
    if (!ATUALIZACAO_VIA_APK_ATIVA) return undefined;
    let vivo = true;
    const consultar = async () => {
      const resultado = await verificarAtualizacao();
      if (!vivo || !resultado) return;
      if (resultado.decisao === 'opcional' && dispensou.current) return;
      setErroAbrir(false);
      setPendente(resultado);
    };
    consultar();
    const assinatura = AppState.addEventListener('change', estado => {
      if (estado === 'active') consultar();
    });
    return () => {
      vivo = false;
      assinatura.remove();
    };
  }, []);

  if (!pendente) return null;
  const obrigatoria = pendente.decisao === 'obrigatoria';

  const atualizar = async () => {
    try {
      await Linking.openURL(pendente.apkUrl);
      setErroAbrir(false);
    } catch (e) {
      setErroAbrir(true);
    }
  };
  const depois = () => {
    dispensou.current = true;
    setPendente(null);
  };

  return (
    <ModalApp
      visible
      transparent
      animationType="fade"
      onRequestClose={obrigatoria ? () => {} : depois}
      accessibilityViewIsModal>
      <View style={styles.fundo}>
        <View style={styles.cartao}>
          <Text style={styles.titulo} accessibilityRole="header">
            Nova versão disponível
          </Text>
          {pendente.versionName ? <Text style={styles.versao}>Versão {pendente.versionName}</Text> : null}
          {obrigatoria ? <Text style={styles.obrigatoria}>Esta versão é necessária para continuar</Text> : null}
          {pendente.notas.map((nota, i) => (
            <Text key={i} style={styles.nota}>
              {'•'} {nota}
            </Text>
          ))}
          {erroAbrir ? (
            <Text style={styles.erro} selectable accessibilityRole="alert">
              Não foi possível abrir o download. Abra este endereço no navegador: {pendente.apkUrl}
            </Text>
          ) : null}
          <TouchableOpacity
            style={[styles.botao, { backgroundColor: colors.primary.main }]}
            onPress={atualizar}
            accessibilityRole="button"
            accessibilityLabel="Atualizar agora">
            <Text style={styles.botaoTexto}>Atualizar agora</Text>
          </TouchableOpacity>
          {obrigatoria ? null : (
            <TouchableOpacity
              style={[styles.botao, styles.botaoSecundario]}
              onPress={depois}
              accessibilityRole="button"
              accessibilityLabel="Depois">
              <Text style={styles.botaoTextoSecundario}>Depois</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ModalApp>
  );
};

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  cartao: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.background.paper,
    borderRadius: 24,
    padding: spacing.lg,
  },
  titulo: { ...textStyles.h3, color: colors.text.primary, textAlign: 'center' },
  versao: { ...textStyles.body, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xs },
  obrigatoria: { ...textStyles.body, color: colors.text.primary, fontWeight: '700', textAlign: 'center', marginTop: spacing.sm },
  nota: { ...textStyles.body, color: colors.text.secondary, marginTop: spacing.xs },
  erro: { ...textStyles.body, color: colors.text.primary, marginTop: spacing.sm },
  botao: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  botaoSecundario: { minHeight: 48, marginTop: spacing.xs },
  botaoTexto: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  botaoTextoSecundario: { color: colors.primary.main, fontSize: 16, fontWeight: '700' },
});

export default AvisoAtualizacao;
