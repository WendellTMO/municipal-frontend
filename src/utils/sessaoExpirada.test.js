import { registrarAoExpirar, avisarSessaoExpirada } from './sessaoExpirada';

test('sem ninguém registrado, avisar não faz nada', () => {
  expect(() => avisarSessaoExpirada()).not.toThrow();
});

test('401 em várias chamadas seguidas avisa uma vez só', () => {
  const aviso = jest.fn();
  registrarAoExpirar(aviso);
  avisarSessaoExpirada();
  avisarSessaoExpirada();
  avisarSessaoExpirada();
  expect(aviso).toHaveBeenCalledTimes(1);
});

test('registrar de novo (novo login) libera outro aviso', () => {
  const aviso = jest.fn();
  registrarAoExpirar(aviso);
  avisarSessaoExpirada();
  registrarAoExpirar(aviso);
  avisarSessaoExpirada();
  expect(aviso).toHaveBeenCalledTimes(2);
});

test('depois de desfazer o registro, nada é chamado', () => {
  const aviso = jest.fn();
  const desfazer = registrarAoExpirar(aviso);
  desfazer();
  avisarSessaoExpirada();
  expect(aviso).not.toHaveBeenCalled();
});
