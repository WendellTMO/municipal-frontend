import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Icon from './Icon';
import {colors, spacing} from '../theme';

// Passo de uma lista numerada: círculo azul com o número (ou check se feito), título, texto e ação.
const PassoNumerado = ({numero, titulo, texto, feito, children}) => (
  <View style={styles.linha} accessible accessibilityLabel={`Passo ${numero}${feito ? ', feito' : ''}. ${titulo}`}>
    <View style={styles.circulo}>
      {feito ? <Icon name="check" size="sm" color="#FFFFFF" /> : <Text style={styles.numero}>{numero}</Text>}
    </View>
    <View style={styles.corpo}>
      <Text style={styles.titulo}>{titulo}</Text>
      {texto ? <Text style={styles.texto}>{texto}</Text> : null}
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  linha: {flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg},
  circulo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numero: {fontFamily: 'Inter-Bold', fontSize: 15, color: '#FFFFFF'},
  corpo: {flex: 1, paddingTop: 4},
  titulo: {fontFamily: 'Inter-SemiBold', fontSize: 16, color: colors.text.primary},
  texto: {fontFamily: 'Inter-Regular', fontSize: 14, color: colors.text.secondary, marginTop: 4, lineHeight: 20},
});

export default PassoNumerado;
