/**
 * Prévia do mapa dentro do card AGORA: posição do ônibus e paradas, sem
 * interação. Busca a posição a cada 15 s no mesmo endpoint da tela
 * LocalizacaoOnibus. Tocar no mapa chama onPress.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, textStyles } from '../theme';
import Icon, { IconNames } from './Icon';
import { LocationMap } from '../features/map/index';
import { motoristaService } from '../services/motoristaService';
import { alunoService } from '../services';
import { unwrapItems } from '../types';
import type { PontoFlatResponse } from '../types';

const INTERVALO_MS = 15_000;

type Props = {
  rotaId?: string;
  viagemId?: string;
  embarqueId?: string;
  altura?: number;
  onPress: () => void;
};

type LatLng = { latitude: number; longitude: number };

const MiniMapaOnibus = ({ rotaId, viagemId, embarqueId, altura = 220, onPress }: Props) => {
  const [pontos, setPontos] = useState<PontoFlatResponse[]>([]);
  const [posicao, setPosicao] = useState<LatLng | null>(null);

  useEffect(() => {
    if (!rotaId) return;
    let ativo = true;
    alunoService
      .listarPontosRota(rotaId)
      .then(unwrapItems)
      .then((lista) => {
        if (ativo) setPontos(lista as PontoFlatResponse[]);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [rotaId]);

  useEffect(() => {
    if (!viagemId) return;
    let ativo = true;
    const buscar = async () => {
      try {
        const dados = (await motoristaService.obterLocalizacao(viagemId)) as unknown as Record<string, number>;
        const valida = typeof dados.latitude === 'number' && typeof dados.longitude === 'number';
        if (ativo && valida) setPosicao({ latitude: dados.latitude, longitude: dados.longitude });
      } catch {
        // Sem posição nova, o mapa fica com a última leitura (ou com o aviso de espera).
      }
    };
    buscar();
    const intervalo = setInterval(buscar, INTERVALO_MS);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [viagemId]);

  if (!posicao) {
    return (
      <TouchableOpacity
        style={[styles.caixa, styles.espera, { height: altura }]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Aguardando sinal do ônibus, toque para abrir o mapa">
        <Icon name={IconNames.bus} size="lg" color={colors.neutral[400]} style={undefined} />
        <Text style={styles.esperaTexto}>Aguardando sinal do ônibus</Text>
      </TouchableOpacity>
    );
  }

  // O toque simples vem do próprio mapa (previa + onToque), porque no nativo o
  // WebView consome os toques e um botão por cima bloquearia a pinça.
  return (
    <View
      style={[styles.caixa, { height: altura }]}
      accessibilityLabel="Mapa do ônibus, toque para abrir, pinça para dar zoom">
      <LocationMap
        pontosRota={pontos}
        posicaoOnibus={posicao}
        proximaParadaId={embarqueId ?? null}
        previa
        onToque={onPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  caixa: {
    marginTop: spacing.base,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#EAF1FD',
  },
  espera: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  esperaTexto: { ...textStyles.bodySmall, color: colors.text.secondary, fontWeight: '600' },
});

export default MiniMapaOnibus;
