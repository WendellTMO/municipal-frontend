import { instituicaoDaParada, montarParadas } from './paradasViagem';

const ufcg = { nome: 'UFCG', tipo: 'Universidade Pública', latitude: -7.21676, longitude: -35.9082 };
const uepb = { nome: 'UEPB', tipo: 'Universidade Pública', latitude: -7.2326, longitude: -35.8943 };

test('parada na coordenada da instituição vira instituição', () => {
  const ponto = { latitude: -7.21676, longitude: -35.9082 };
  expect(instituicaoDaParada(ponto, [uepb, ufcg])).toEqual({ nome: 'UFCG', tipo: 'Universidade Pública', endereco: null });
});

test('parada longe de qualquer instituição não é instituição', () => {
  expect(instituicaoDaParada({ latitude: -7.2895, longitude: -35.952 }, [ufcg, uepb])).toBeNull();
});

test('campo instituicao do ponto tem prioridade', () => {
  expect(instituicaoDaParada({ latitude: 0, longitude: 0, instituicao: 'Escola X' }, [])).toEqual({
    nome: 'Escola X',
    tipo: null,
    endereco: null,
  });
});

test('estados das paradas seguem o número de concluídas', () => {
  const pontos = [{ latitude: 1, longitude: 1 }, { latitude: 2, longitude: 2 }, { latitude: 3, longitude: 3 }];
  const estados = montarParadas(pontos, 1, []).map(p => p.estado);
  expect(estados).toEqual(['feita', 'proxima', 'pendente']);
  expect(montarParadas(pontos, 3, []).map(p => p.estado)).toEqual(['feita', 'feita', 'feita']);
});
