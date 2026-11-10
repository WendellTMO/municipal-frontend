/**
 * Cartão do painel do gestor: liga ou desliga a entrada de alunos de outras prefeituras
 * nas rotas desta prefeitura. Desligar só impede novas inscrições.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { borderRadius, colors, spacing, textStyles } from '../theme';
import { gestorService } from '../services/gestorService';
import { useToast } from './Toast';

const AberturaMunicipalCard = () => {
  const toast = useToast();
  const [aceita, setAceita] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    gestorService
      .obterAberturaMunicipal()
      .then(resposta => {
        if (!cancelado) setAceita(resposta.aceita_alunos_de_fora);
      })
      .catch(() => {
        // o cartão fica escondido; não atrapalha o painel
      });
    return () => {
      cancelado = true;
    };
  }, []);

  if (aceita === null) return null;

  const alternar = async novo => {
    setSalvando(true);
    try {
      const resposta = await gestorService.definirAberturaMunicipal(novo);
      setAceita(resposta.aceita_alunos_de_fora);
    } catch (e) {
      toast.error('Não foi possível salvar agora. Tente de novo.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View style={styles.cartao}>
      <View style={styles.textos}>
        <Text style={styles.titulo}>Alunos de outros municípios</Text>
        <Text style={styles.descricao}>
          {aceita
            ? 'Alunos de outras prefeituras podem se inscrever nas suas rotas. Você os vê só como "outro município".'
            : 'Só alunos desta prefeitura podem se inscrever nas suas rotas.'}
        </Text>
      </View>
      {salvando ? (
        <ActivityIndicator color={colors.primary.main} />
      ) : (
        <Switch value={aceita} onValueChange={alternar} accessibilityLabel="Aceitar alunos de outros municípios" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.paper,
  },
  textos: { flex: 1 },
  titulo: { ...textStyles.h5, color: colors.text.primary },
  descricao: { ...textStyles.caption, color: colors.text.secondary, marginTop: spacing.xs },
});

export default AberturaMunicipalCard;
