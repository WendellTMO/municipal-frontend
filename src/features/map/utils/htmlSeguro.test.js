import { escaparHtml, jsonParaScript } from './htmlSeguro';

test('escaparHtml neutraliza tag e aspas', () => {
  expect(escaparHtml('<img src=x onerror="alert(1)">')).toBe(
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
  );
  expect(escaparHtml("O'Brien & filhos")).toBe('O&#39;Brien &amp; filhos');
});

test('escaparHtml aceita número', () => {
  expect(escaparHtml(3)).toBe('3');
});

test('jsonParaScript não deixa </script> fechar a tag e volta ao mesmo valor', () => {
  const separador = String.fromCharCode(0x2028);
  const valor = { apelido: '</script><script>alert(1)</script>', linha: 'a' + separador + 'b' };
  const texto = jsonParaScript(valor);

  expect(texto).not.toContain('</script>');
  expect(texto).not.toContain('<');
  expect(texto).not.toContain(separador);
  expect(JSON.parse(texto)).toEqual(valor);
});
