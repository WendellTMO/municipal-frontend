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

const MiniMapaOnibus = ({ rotaId, viagemId, embarqueId, altura = 140, onPress }: Props) => {
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

  return (
    <TouchableOpacity
      style={[styles.caixa, { height: altura }]}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel="Mapa do ônibus, toque para abrir">
      {posicao ? (
        <View style={styles.mapa} pointerEvents="none">
          <LocationMap
            pontosRota={pontos}
            posicaoOnibus={posicao}
            proximaParadaId={embarqueId ?? null}
            controles={false}
          />
        </View>
      ) : (
        <View style={styles.espera}>
          <Icon name={IconNames.bus} size="lg" color={colors.neutral[400]} style={undefined} />
          <Text style={styles.esperaTexto}>Aguardando sinal do ônibus</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  caixa: {
    marginTop: spacing.base,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#EAF1FD',
  },
  mapa: { flex: 1 },
  espera: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  esperaTexto: { ...textStyles.bodySmall, color: colors.text.secondary, fontWeight: '600' },
});

export default MiniMapaOnibus;
