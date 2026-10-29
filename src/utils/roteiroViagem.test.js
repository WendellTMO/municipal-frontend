import { montarParadas } from './paradasViagem';
import { montarRoteiro } from './roteiroViagem';

const ponto = (id, apelido, instituicao) => ({ id, apelido, latitude: 0, longitude: 0, instituicao });
const escola = { id: 'i1', nome: 'UFCG', tipo: 'Universidade pública' };
const aluno = (nome, embarque, destino, confirmacao = true) => ({
  nome,
  confirmacao,
  ponto_embarque_id: embarque,
  ponto_destino_id: destino,
});

const rota = [ponto('p1', 'Praça'), ponto('p2', 'Rua B'), ponto('p3', 'UFCG, Campus I', escola), ponto('p4', 'Posto')];
const alunos = [
  aluno('Ana', 'p1', 'p3'),
  aluno('Bia', 'p1', 'p3'),
  aluno('Caio', 'p3', 'p4'),
  aluno('Davi', 'p3', 'p2'),
  aluno('Eva', 'p2', 'p3', false),
];

const grupos = (tipo, pontos = rota, lista = alunos, concluidas = 0) =>
  montarRoteiro(tipo, montarParadas(pontos, concluidas, []), lista);
const titulos = lista => lista.map(g => g.titulo);
const nomesDe = item => item.listas.map(l => l.nomes);

test('IDA tem Embarque e Instituição, esta só com Descem', () => {
  const r = grupos('IDA');
  expect(titulos(r)).toEqual(['Pontos de Embarque', 'Instituição de Ensino']);
  expect(r[0].itens.map(i => i.nome)).toEqual(['Praça', 'Rua B', 'Posto']);
  expect(r[0].itens[0].etiquetas[0].texto).toBe('2 alunos');
  expect(r[0].total).toBe(2);
  const inst = r[1].itens[0];
  expect(inst.etiquetas.map(e => e.texto)).toEqual(['Descem 2']);
  expect(inst.detalhe).toBe('Universidade pública');
  expect(r[1].total).toBeNull();
});

test('VOLTA tem Instituição com Sobem e Desembarque', () => {
  const r = grupos('VOLTA');
  expect(titulos(r)).toEqual(['Instituição de Ensino', 'Pontos de Desembarque']);
  expect(r[0].itens[0].etiquetas.map(e => e.texto)).toEqual(['Sobem 2']);
  expect(r[1].itens.map(i => i.nome)).toEqual(['Praça', 'Rua B', 'Posto']);
  expect(r[1].itens[2].etiquetas[0].texto).toBe('1 aluno');
});

test('CIRCULAR separa antes e depois da instituição e mostra Descem e Sobem', () => {
  const r = grupos('CIRCULAR');
  expect(titulos(r)).toEqual(['Pontos de Embarque', 'Instituição de Ensino', 'Pontos de Desembarque']);
  expect(r[0].itens.map(i => i.nome)).toEqual(['Praça', 'Rua B']);
  expect(r[1].itens[0].etiquetas.map(e => e.texto)).toEqual(['Descem 2', 'Sobem 2']);
  expect(r[1].itens[0].listas.map(l => l.titulo)).toEqual(['Descem', 'Sobem']);
  expect(nomesDe(r[1].itens[0])).toEqual([['Ana', 'Bia'], ['Caio', 'Davi']]);
  // Rua B vem antes da escola mas tem aluno que desce nela (Davi): aparece também no Desembarque
  expect(r[2].itens.map(i => i.nome)).toEqual(['Rua B', 'Posto']);
  expect(r[2].itens[0].etiquetas[0].texto).toBe('1 aluno');
});

test('ponto sem confirmados fica vazio com etiqueta 0', () => {
  const r = grupos('IDA', rota, []);
  expect(r[0].itens[0].etiquetas[0]).toEqual({ texto: '0', tom: 'cinza' });
  expect(r[0].itens[0].vazio).toBe(true);
  expect(r[0].total).toBe(0);
});

test('confirmacao false não entra na contagem', () => {
  const r = grupos('IDA');
  expect(r[0].itens[1].vazio).toBe(true);
});

test('rota sem instituição omite o grupo e segue o sentido', () => {
  const semEscola = [ponto('p1', 'A'), ponto('p2', 'B')];
  const lista = [aluno('Ana', 'p1', 'p2')];
  expect(titulos(grupos('IDA', semEscola, lista))).toEqual(['Pontos de Embarque']);
  expect(titulos(grupos('VOLTA', semEscola, lista))).toEqual(['Pontos de Desembarque']);
  expect(titulos(grupos('CIRCULAR', semEscola, lista))).toEqual(['Pontos de Embarque']);
});

test('numeração e estado seguem a rota', () => {
  const r = grupos('CIRCULAR', rota, alunos, 1);
  expect(r[0].itens[0]).toMatchObject({ numero: 1, estado: 'feita' });
  expect(r[0].itens[1]).toMatchObject({ numero: 2, estado: 'proxima' });
  expect(r[1].itens[0]).toMatchObject({ numero: 3, estado: 'pendente' });
});
