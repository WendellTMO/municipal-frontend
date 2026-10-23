// Agrupamento de alunos por instituição de ensino (gestor e motorista).

export const SEM_INSTITUICAO = 'Sem instituição';

// A lista do gestor traz escola (nome) e instituicao_id; a do motorista traz instituicao { id, nome, tipo }.
export const instituicaoDoAlunoGestor = aluno => {
  if (!aluno.escola) return null;
  return { chave: aluno.instituicao_id || aluno.escola, nome: aluno.escola };
};

export const instituicaoDoAlunoMotorista = aluno => {
  const inst = aluno.instituicao;
  if (!inst || !inst.nome) return null;
  return { chave: inst.id || inst.nome, nome: inst.nome, tipo: inst.tipo || null };
};

// Seções ordenadas por nome, com "Sem instituição" por último.
export const agruparAlunos = (alunos, instituicaoDe) => {
  const grupos = new Map();
  for (const aluno of alunos) {
    const inst = instituicaoDe(aluno);
    const chave = inst ? inst.chave : null;
    if (!grupos.has(chave)) {
      grupos.set(chave, {
        chave,
        nome: inst ? inst.nome : SEM_INSTITUICAO,
        tipo: inst ? inst.tipo || null : null,
        alunos: [],
      });
    }
    grupos.get(chave).alunos.push(aluno);
  }
  const secoes = Array.from(grupos.values());
  secoes.sort((a, b) => {
    if (a.chave === null) return 1;
    if (b.chave === null) return -1;
    return a.nome.localeCompare(b.nome);
  });
  return secoes;
};

// Só os alunos da instituição escolhida (chave null = sem filtro).
export const filtrarPorInstituicao = (alunos, chave, instituicaoDe) => {
  if (chave === undefined || chave === null) return alunos;
  const resultado = [];
  for (const aluno of alunos) {
    const inst = instituicaoDe(aluno);
    const daChave = inst ? inst.chave : '__sem__';
    if (daChave === chave) resultado.push(aluno);
  }
  return resultado;
};
