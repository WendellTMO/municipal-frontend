/**
 * Teste de navegador do site web, com asserções. Sai com erro se qualquer uma falhar.
 * Não faz parte do npm test: precisa de um site no ar, do Chrome e do puppeteer-core.
 *
 *   npm i --no-save puppeteer-core
 *   CHROME_PATH=/caminho/do/chrome node e2e/smoke-web.js
 *
 * Variáveis: URL (padrão https://buska.lsd.ufcg.edu.br), E2E_EMAIL, E2E_SENHA.
 */
const assert = require('assert');
const puppeteer = require('puppeteer-core');

const URL = process.env.URL || 'https://buska.lsd.ufcg.edu.br';
const EMAIL = process.env.E2E_EMAIL || 'aluno@buska.app';
const SENHA = process.env.E2E_SENHA || 'buska123';
const espera = ms => new Promise(r => setTimeout(r, ms));

const clicarTexto = (page, texto) =>
  page.evaluate(t => {
    const nos = Array.from(document.querySelectorAll('div,span')).filter(
      e => e.children.length === 0 && (e.innerText || '').trim() === t,
    );
    if (!nos.length) return false;
    nos[0].scrollIntoView();
    nos[0].click();
    return true;
  }, texto);

const texto = page => page.evaluate(() => document.body.innerText);

const abrirLogin = async (browser, largura) => {
  const page = await browser.newPage();
  await page.setViewport({ width: largura, height: 800 });
  const localhost = [];
  let popups = 0;
  page.on('request', r => {
    if (r.url().includes('localhost')) localhost.push(r.url());
  });
  page.on('dialog', async d => {
    popups += 1;
    await d.dismiss();
  });
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });
  await espera(1500);
  return { page, localhost, popups: () => popups };
};

const entrar = async (page, email, senha) => {
  const campos = await page.$$('input');
  await campos[0].type(email);
  await campos[1].type(senha);
  await clicarTexto(page, 'Entrar');
  await espera(3500);
};

const testes = [
  ['login com a conta certa abre o painel, sem chamar localhost', async browser => {
    const { page, localhost } = await abrirLogin(browser, 390);
    await entrar(page, EMAIL, SENHA);
    assert((await texto(page)).includes('Perfil'), 'não abriu o painel');
    assert.deepStrictEqual(localhost, [], `requisições para localhost: ${localhost}`);
  }],
  ['e-mail inexistente e senha errada mostram e-mail ou senha incorretos', async browser => {
    for (const [email, senha] of [['naoexiste@buska.app', SENHA], [EMAIL, 'senha-errada-123']]) {
      const { page } = await abrirLogin(browser, 390);
      await entrar(page, email, senha);
      const t = await texto(page);
      assert(t.includes('E-mail ou senha incorretos.'), `mensagem errada para ${email}: ${t.slice(0, 120)}`);
      assert(!/internet/i.test(t), 'falou de internet num login recusado');
    }
  }],
  ['sair abre o diálogo do app, sem popup do navegador, e volta ao login', async browser => {
    const { page, popups } = await abrirLogin(browser, 390);
    await entrar(page, EMAIL, SENHA);
    if (!(await clicarTexto(page, 'Sair da conta'))) {
      await clicarTexto(page, 'Perfil');
      await espera(1500);
      assert(await clicarTexto(page, 'Sair da conta'), 'botão Sair da conta não encontrado');
    }
    await espera(800);
    assert((await texto(page)).includes('Deseja encerrar sua sessão?'), 'diálogo do app não abriu');
    assert.strictEqual(popups(), 0, 'apareceu popup nativo do navegador');
    assert(await clicarTexto(page, 'Sair'), 'botão Sair do diálogo não encontrado');
    await espera(2000);
    assert((await texto(page)).includes('Entrar'), 'não voltou ao login');
  }],
  ['sem rolagem horizontal a 320 px no login e no painel', async browser => {
    const { page } = await abrirLogin(browser, 320);
    const sobra = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert((await sobra()) <= 0, 'login com rolagem horizontal');
    await entrar(page, EMAIL, SENHA);
    assert((await sobra()) <= 0, 'painel com rolagem horizontal');
  }],
];

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] });
  let falhas = 0;
  for (const [nome, fn] of testes) {
    try {
      await fn(browser);
      console.log(`  ok    ${nome}`);
    } catch (e) {
      falhas += 1;
      console.log(`  FALHA ${nome}: ${e.message}`);
    }
  }
  await browser.close();
  if (falhas > 0) process.exit(1);
  console.log('Tudo certo.');
})();
