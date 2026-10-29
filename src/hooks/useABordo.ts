import { useCallback, useEffect, useRef, useState } from 'react';
import { colors } from '../theme';
import { motoristaService } from '../services/motoristaService';
import { requestLocationPermission } from '../features/map/hooks/useLocationPermission';
import { posicaoMudou } from '../utils/coordenadas';
import {
  CHECAGEM_INTERVALO_MS,
  LIMITE_A_BORDO_M,
  alunoAindaABordo,
  devePerguntar,
  estaABordo,
  presencaTravada,
  proximoContador,
} from '../utils/aBordo';

type LatLng = { latitude: number; longitude: number };
type Leitura = { coords: { latitude: number; longitude: number } };

let Geolocation: typeof navigator.geolocation | null = null;
try {
  Geolocation = require('@react-native-community/geolocation').default;
} catch {
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    Geolocation = navigator.geolocation;
  }
}

const TOLERANCIA_ALUNO_M = 5;
const GPS_BATIMENTO_MS = 30_000;
const RELOGIO_MS = 10_000;

type Params = {
  viagemId?: string;
  confirmada: boolean;
  statusViagem?: string;
  // Falso quando a tela não está à frente (evita GPS e diálogo duplicados).
  ativo?: boolean;
  // O mapa do aluno mostra o ponto azul mesmo sem confirmação, então liga o GPS sempre.
  gpsSempre?: boolean;
  // Cancela a presença. Devolve true quando deu certo.
  aoDesci: () => Promise<boolean>;
  checagemMs?: number;
  limiteMetros?: number;
};

/**
 * GPS local do aluno e estado "a bordo": presença confirmada, viagem em andamento e leitura
 * recente. A bordo, nada da posição do aluno vai ao backend. A cada checagemMs compara com a
 * posição do motorista e, depois de 2 checagens fora do limite, pergunta ao aluno se desceu.
 */
export function useABordo({
  viagemId,
  confirmada,
  statusViagem,
  ativo = true,
  gpsSempre = false,
  aoDesci,
  checagemMs = CHECAGEM_INTERVALO_MS,
  limiteMetros = LIMITE_A_BORDO_M,
}: Params) {
  const [posicaoAluno, setPosicaoAluno] = useState<LatLng | null>(null);
  const [, setRelogio] = useState(0);
  const [dialogo, setDialogo] = useState(false);
  const leituraEm = useRef<number | null>(null);
  const posicaoRef = useRef<LatLng | null>(null);
  const contador = useRef(0);
  const dialogoRef = useRef(false);

  const travada = presencaTravada(confirmada, statusViagem);
  const usarGps = ativo && (gpsSempre || travada);
  const aBordo =
    ativo &&
    estaABordo({
      confirmada,
      statusViagem,
      posicaoAluno,
      leituraEm: leituraEm.current,
      agora: Date.now(),
    });

  // GPS: leitura única na abertura, batimento de 30 s e, a bordo, watch balanceado com filtro.
  useEffect(() => {
    if (!usarGps || !Geolocation) return;
    const geo = Geolocation;
    let cancelado = false;
    let permitido = false;
    let watchId: number | null = null;
    let batimento: ReturnType<typeof setInterval> | null = null;
    let relogio: ReturnType<typeof setInterval> | null = null;

    const guardar = (pos: Leitura) => {
      if (cancelado) return;
      const nova = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      leituraEm.current = Date.now();
      posicaoRef.current = nova;
      // Mesmo lugar devolve o objeto antigo e o React não renderiza de novo.
      setPosicaoAluno((atual) => (posicaoMudou(atual, nova, TOLERANCIA_ALUNO_M) ? nova : atual));
    };
    const ler = (precisa: boolean) => {
      if (!permitido) return;
      geo.getCurrentPosition(
        guardar,
        // GPS não fixa dentro de prédio: a rede responde com precisão menor.
        () =>
          geo.getCurrentPosition(guardar, () => {}, {
            enableHighAccuracy: false,
            timeout: 15_000,
            maximumAge: 60_000,
          }),
        { enableHighAccuracy: precisa, timeout: 10_000, maximumAge: precisa ? 5_000 : 20_000 },
      );
    };

    requestLocationPermission().then((ok) => {
      if (cancelado || !ok) return;
      permitido = true;
      ler(true);
      batimento = setInterval(() => ler(false), GPS_BATIMENTO_MS);
      if (travada) {
        watchId = geo.watchPosition(guardar, () => {}, {
          enableHighAccuracy: false,
          distanceFilter: 10,
          interval: 10_000,
          fastestInterval: 5_000,
          maximumAge: 20_000,
        } as PositionOptions);
        // Sem relógio o React não reavalia a validade da leitura quando o GPS some.
        relogio = setInterval(() => setRelogio((n) => n + 1), RELOGIO_MS);
      }
    });

    return () => {
      cancelado = true;
      if (batimento) clearInterval(batimento);
      if (relogio) clearInterval(relogio);
      if (watchId != null) geo.clearWatch(watchId);
    };
  }, [usarGps, travada]);

  // Checagem periódica: busca UMA vez a posição do motorista e compara.
  useEffect(() => {
    if (!aBordo || !viagemId) return;
    const intervalo = setInterval(async () => {
      if (dialogoRef.current) return;
      try {
        const dados = (await motoristaService.obterLocalizacao(viagemId)) as unknown as Record<string, number>;
        const valida = typeof dados.latitude === 'number' && typeof dados.longitude === 'number';
        const onibus = valida ? { latitude: dados.latitude, longitude: dados.longitude } : null;
        const ainda = alunoAindaABordo(posicaoRef.current, onibus, limiteMetros);
        contador.current = proximoContador(contador.current, ainda);
        if (devePerguntar(contador.current)) {
          dialogoRef.current = true;
          setDialogo(true);
        }
      } catch {
        // Sem resposta do servidor a checagem não conta.
      }
    }, checagemMs);
    return () => clearInterval(intervalo);
  }, [aBordo, viagemId, checagemMs, limiteMetros]);

  const fechar = useCallback(() => {
    contador.current = 0;
    dialogoRef.current = false;
    setDialogo(false);
  }, []);

  const desci = async () => {
    if (await aoDesci()) fechar();
  };

  return {
    aBordo,
    posicaoAluno,
    dialogoProps: {
      visible: dialogo,
      titulo: 'Você ainda está no ônibus?',
      resumo: 'Sua posição ficou longe do ônibus nas últimas checagens.',
      onCancelar: fechar,
      principal: { texto: 'Sim, estou', cor: colors.success.main, onPress: fechar },
      secundario: { texto: 'Desci', cor: colors.error.main, onPress: desci },
    },
  };
}
