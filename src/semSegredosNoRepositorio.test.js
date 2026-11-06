// Barra segredo no CI: o repositório é público. Confere os arquivos que o git rastreia.
// As regras estão em scripts/segredos.js, as mesmas do hook de commit e de push.
const { execSync } = require('child_process');
const fs = require('fs');
const { nomeProibido, padroesNoTexto } = require('../scripts/segredos');

const rastreados = () => execSync('git ls-files', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\n').filter(Boolean);

describe('segredos', () => {
  it('nenhum arquivo de segredo é rastreado pelo git', () => {
    const achados = rastreados().filter(nomeProibido);
    expect(achados).toEqual([]);
  });

  it('nenhuma credencial colada em arquivo de texto rastreado', () => {
    const achados = [];
    for (const caminho of rastreados()) {
      if (!fs.existsSync(caminho) || fs.statSync(caminho).size > 2 * 1024 * 1024) continue;
      if (/\.(png|jpg|jpeg|gif|ico|ttf|otf|woff2?|zip|jar|so|apk|keystore|bin|webp|mp4)$/i.test(caminho)) continue;
      const texto = fs.readFileSync(caminho, 'utf8');
      for (const nome of padroesNoTexto(caminho, texto)) achados.push(`${caminho}: ${nome}`);
    }
    expect(achados).toEqual([]);
  });

  it('as regras reconhecem o que devem e liberam os modelos', () => {
    expect(nomeProibido('android/app/release.keystore')).toBe(true);
    expect(nomeProibido('backup/banco.dump')).toBe(true);
    expect(nomeProibido('.env.prod')).toBe(true);
    expect(nomeProibido('.env.example')).toBe(false);
    expect(nomeProibido('android/app/debug.keystore')).toBe(false);
    expect(padroesNoTexto('x.txt', '-----BEGIN RSA PRIVATE KEY-----')).toContain('chave privada');
    expect(padroesNoTexto('x.txt', 'application_credential_secret: 0wAbCdEfGhIjKlMnOpQrStUv')).toContain('credencial do OpenStack');
    expect(padroesNoTexto('x.txt', 'texto comum')).toEqual([]);
  });
});
