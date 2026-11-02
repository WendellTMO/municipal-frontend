/**
 * Linha discreta com a versão instalada, ex.: "Versão 1.0.4-beta (29888779)". Serve para o testador
 * dizer qual APK está usando.
 */
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import { APP_VERSION, textoDaVersao } from '../utils/feedback';
import { lerVersaoInstalada } from '../services/versaoApp';

const VersaoDoApp = () => {
  const instalada = lerVersaoInstalada();
  const nome = instalada ? instalada.versionName : APP_VERSION;
  const texto = textoDaVersao(nome, instalada ? instalada.versionCode : null);
  if (!texto) return null;
  return <Text style={styles.texto}>Versão {texto}</Text>;
};

const styles = StyleSheet.create({
  texto: { ...textStyles.caption, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm },
});

export default VersaoDoApp;
