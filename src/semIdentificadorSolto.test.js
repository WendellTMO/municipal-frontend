// Um nome usado sem existir (como uma função de estado apagada) só quebra quando a linha roda no
// aparelho: o resto do botão para no meio e o motorista vê um erro. O ESLint acha isso lendo o código.
// Os nomes de tipo e de navegador abaixo existem em tempo de execução ou só em TypeScript.
const { ESLint } = require('eslint');

const NOMES_PERMITIDOS = {
  JSX: 'readonly',
  AuthUser: 'readonly',
  HTMLDivElement: 'readonly',
  HTMLElement: 'readonly',
  KeyboardEvent: 'readonly',
  PositionOptions: 'readonly',
  AbortSignal: 'readonly',
  React: 'readonly',
  __DEV__: 'readonly',
};

test('nenhum identificador usado sem estar definido', async () => {
  const eslint = new ESLint({
    useEslintrc: false,
    allowInlineConfig: false,
    overrideConfig: {
      root: true,
      parser: '@typescript-eslint/parser',
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      env: { es2022: true, node: true, browser: true, jest: true },
      globals: NOMES_PERMITIDOS,
      rules: { 'no-undef': 'error' },
    },
  });
  const resultados = await eslint.lintFiles(['src/**/*.{js,jsx,ts,tsx}']);
  const problemas = [];
  for (const resultado of resultados) {
    for (const mensagem of resultado.messages) {
      problemas.push(`${resultado.filePath}:${mensagem.line} ${mensagem.message}`);
    }
  }
  expect(problemas).toEqual([]);
}, 120000);
