/**
 * Cartão da tela inicial do motorista: pede para deixar o BusKá sem restrição de bateria, para o ônibus
 * continuar aparecendo aos alunos com a tela bloqueada. Aparece uma vez; "Já fiz" e "Abrir ajustes" o encerram.
 */
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { borderRadius, colors, spacing, textStyles } from '../theme';
import { Storage } from '../utils/storage';
import { CHAVE_AVISO_BATERIA, deveMostrarAvisoDeBateria } from '../utils/avisoBateria';
import { abrirAjustesDeBateria } from '../services/servicoViagem';
import { registrarAcao } from '../utils/telemetriaFila';

const AvisoBateria = () => {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    let vivo = true;
    Storage.getItem(CHAVE_AVISO_BATERIA).then(respondido => {
      if (vivo) setVisivel(deveMostrarAvisoDeBateria(Platform.OS, respondido));
    });
    return () => {
      vivo = false;
    };
  }, []);

  const encerrar = abrir => {
    registrarAcao('aviso_bateria_respondido', { abriu_ajustes: !!abrir });
    Storage.setItem(CHAVE_AVISO_BATERIA, true);
    setVisivel(false);
    if (abrir) abrirAjustesDeBateria();
  };

  if (!visivel) return null;
  return (
    <View style={styles.cartao} accessibilityRole="alert">
      <Text style={styles.titulo}>Para o ônibus aparecer com a tela bloqueada</Text>
      <Text style={styles.texto}>
        Em alguns celulares o Android desliga o BusKá em segundo plano. Nos ajustes, deixe o BusKá sem restrição de bateria.
      </Text>
      <View style={styles.botoes}>
        <TouchableOpacity style={styles.botao} onPress={() => encerrar(true)} accessibilityRole="button" accessibilityLabel="Abrir ajustes de bateria">
          <Text style={styles.botaoTexto}>Abrir ajustes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.botao, styles.botaoSecundario]}
          onPress={() => encerrar(false)}
          accessibilityRole="button"
          accessibilityLabel="Já fiz ou não preciso">
          <Text style={[styles.botaoTexto, { color: colors.warning.dark }]}>Já fiz</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cartao: {
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.warning.light,
    borderWidth: 1,
    borderColor: colors.warning.main,
  },
  titulo: { ...textStyles.h5, color: colors.warning.dark },
  texto: { ...textStyles.bodySmall, color: colors.text.primary },
  botoes: { flexDirection: 'row', gap: spacing.sm },
  botao: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.warning.dark,
  },
  botaoSecundario: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.warning.dark },
  botaoTexto: { ...textStyles.button, color: '#FFFFFF' },
});

export default AvisoBateria;
