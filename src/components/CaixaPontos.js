/**
 * Caixa de seleção de ponto: mostra o ponto escolhido, abre uma busca com a lista em ordem
 * alfabética e fecha ao escolher. Fica dentro da folha (sem outra janela por cima).
 * Mostra só os primeiros resultados; para achar outro é só continuar digitando.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { borderRadius, colors, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';
import Tappable from './Tappable';
import { filtrarPontos } from '../utils/presenca';

const LIMITE = 50;

// pontos: [{ id, apelido }]; marcado: id escolhido ou null; onMarcar(id).
const CaixaPontos = ({ titulo, pontos, marcado, onMarcar, vazio = 'Escolha o ponto' }) => {
  const [aberta, setAberta] = useState(false);
  const [texto, setTexto] = useState('');

  const escolhido = (pontos || []).find(p => p.id === marcado) || null;
  const { itens, total } = filtrarPontos(pontos, texto, LIMITE);

  const abrirOuFechar = () => {
    setTexto('');
    setAberta(atual => !atual);
  };

  const escolher = id => {
    onMarcar(id);
    setAberta(false);
    setTexto('');
  };

  return (
    <View style={styles.bloco}>
      {titulo ? <Text style={styles.titulo}>{titulo}</Text> : null}
      <Tappable
        style={styles.campo}
        onPress={abrirOuFechar}
        sombra={false}
        accessibilityRole="button"
        accessibilityLabel={`${titulo || 'Ponto'}: ${escolhido ? escolhido.apelido : vazio}. Toque para ${aberta ? 'fechar' : 'abrir a lista'}`}>
        <Text style={[styles.campoTexto, !escolhido && styles.placeholder]} numberOfLines={2}>
          {escolhido ? escolhido.apelido : vazio}
        </Text>
        <Icon name={aberta ? IconNames.expandLess : IconNames.expandMore} size="md" color={colors.text.secondary} />
      </Tappable>

      {aberta ? (
        <View style={styles.painel}>
          <View style={styles.busca}>
            <Icon name={IconNames.search} size="md" color={colors.text.secondary} />
            <TextInput
              style={styles.buscaTexto}
              value={texto}
              onChangeText={setTexto}
              placeholder="Buscar ponto"
              placeholderTextColor={colors.text.hint}
              autoCorrect={false}
              accessibilityLabel="Buscar ponto"
            />
          </View>
          <ScrollView style={styles.lista} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {itens.map(ponto => (
              <Tappable
                key={ponto.id}
                style={styles.linha}
                onPress={() => escolher(ponto.id)}
                sombra={false}
                accessibilityRole="button"
                accessibilityState={{ selected: ponto.id === marcado }}
                accessibilityLabel={ponto.apelido}>
                <Text style={styles.linhaTexto}>{ponto.apelido}</Text>
                {ponto.id === marcado ? <Icon name={IconNames.check} size="md" color={colors.primary.main} /> : null}
              </Tappable>
            ))}
            {itens.length === 0 ? <Text style={styles.vazio}>Nenhum ponto encontrado.</Text> : null}
            {total > LIMITE ? (
              <Text style={styles.dica}>Mostrando {LIMITE} de {total}. Continue digitando para refinar.</Text>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  bloco: { marginBottom: spacing.sm },
  titulo: { ...textStyles.h5, color: colors.text.primary, marginTop: spacing.sm, marginBottom: spacing.sm },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.paper,
  },
  campoTexto: { ...textStyles.body, flex: 1, color: colors.text.primary },
  placeholder: { color: colors.text.hint },
  painel: {
    marginTop: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.paper,
    padding: spacing.sm,
  },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    minHeight: 44,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.neutral[50],
  },
  buscaTexto: { ...textStyles.body, flex: 1, color: colors.text.primary, paddingVertical: 0 },
  lista: { maxHeight: 240 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  linhaTexto: { ...textStyles.body, flex: 1, color: colors.text.primary },
  vazio: { ...textStyles.body, color: colors.text.secondary, textAlign: 'center', paddingVertical: spacing.lg },
  dica: { ...textStyles.caption, color: colors.text.secondary, textAlign: 'center', paddingVertical: spacing.md },
});

export default CaixaPontos;
