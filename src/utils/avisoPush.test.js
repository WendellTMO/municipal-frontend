import { textoDoAviso } from './avisoPush';

describe('textoDoAviso', () => {
  it('push só de dados não vira aviso', () => {
    expect(textoDoAviso({ title: '', body: '' })).toBeNull();
    expect(textoDoAviso({ title: '  ', body: undefined })).toBeNull();
  });

  it('junta título e corpo', () => {
    expect(textoDoAviso({ title: 'Viagem iniciada', body: 'O ônibus saiu' })).toBe('Viagem iniciada\nO ônibus saiu');
  });

  it('aceita só um dos dois', () => {
    expect(textoDoAviso({ title: 'Aviso', body: '' })).toBe('Aviso');
    expect(textoDoAviso({ title: '', body: 'Só o corpo' })).toBe('Só o corpo');
  });
});
