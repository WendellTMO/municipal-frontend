// Regras para barrar segredo antes de ir para o GitHub (repositório público).
// Usadas pelo hook de commit e de push (scripts/hook-segredos.js) e pelo teste do CI
// (src/semSegredosNoRepositorio.test.js).

// Arquivo que nunca entra no git, pelo nome.
const NOMES_PROIBIDOS = [
  /(^|\/)\.env(\..*)?$/,
  /\.(keystore|jks|p12|pfx|pem|dump|pass|tfstate|tfvars)$/,
  /(^|\/)clouds\.yaml$/,
  /service-account.*\.json$/,
  /(^|\/)id_(rsa|ed25519).*$/,
];

// Exceções conhecidas: modelos e a chave de debug padrão do React Native.
// google-services.json é a configuração pública do app no Firebase (chaves de cliente, sem segredo).
const NOMES_PERMITIDOS = [
  /(^|\/)\.env\.example$/,
  /(^|\/)debug\.keystore$/,
  /(^|\/)google-services\.json$/,
  /\.fake\.json$/,
];

// Credencial colada no texto de um arquivo.
const PADROES_NO_TEXTO = [
  { nome: 'chave privada', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { nome: 'credencial do OpenStack', regex: /application_credential_secret\s*[:=]\s*\S{16,}/ },
  { nome: 'token do GitHub', regex: /gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}/ },
  { nome: 'chave da AWS', regex: /AKIA[0-9A-Z]{16}/ },
  { nome: 'token do Slack', regex: /xox[baprs]-[A-Za-z0-9-]{20,}/ },
  { nome: 'senha dentro de URL de banco', regex: /(postgres(ql)?|mysql|mongodb):\/\/[^\s:/@]+:[^\s@]{6,}@/ },
  { nome: 'JWT_SECRET_KEY com valor', regex: /JWT_SECRET_KEY\s*=\s*[A-Za-z0-9+/_=-]{24,}/ },
];

// Arquivos que descrevem as próprias regras ou que trazem valores de exemplo.
const IGNORAR_NO_TEXTO = [/^scripts\/segredos\.js$/, /^src\/semSegredosNoRepositorio\.test\.js$/, /package-lock\.json$/, /\.example$/, /README\.md$/];

const casaComAlgum = (caminho, regras) => {
  for (const regra of regras) {
    if (regra.test(caminho)) return true;
  }
  return false;
};

const nomeProibido = caminho => casaComAlgum(caminho, NOMES_PROIBIDOS) && !casaComAlgum(caminho, NOMES_PERMITIDOS);

const padroesNoTexto = (caminho, texto) => {
  if (casaComAlgum(caminho, IGNORAR_NO_TEXTO)) return [];
  const achados = [];
  for (const padrao of PADROES_NO_TEXTO) {
    if (padrao.regex.test(texto)) achados.push(padrao.nome);
  }
  return achados;
};

module.exports = { nomeProibido, padroesNoTexto };
