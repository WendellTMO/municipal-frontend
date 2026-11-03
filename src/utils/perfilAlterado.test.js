import { assinaturaDoPerfil, perfilAlterado } from "./perfilAlterado";

const form = { nome: "Ana", telefone: "", cep: "" };

test("enquanto o perfil não carregou não há alteração", () => {
  expect(perfilAlterado(null, form, "")).toBe(false);
});

test("igual ao carregado não é alteração", () => {
  const salva = assinaturaDoPerfil(form, "i1");
  expect(perfilAlterado(salva, { ...form }, "i1")).toBe(false);
});

test("mudar um campo ou a instituição é alteração, e voltar ao valor de antes deixa de ser", () => {
  const salva = assinaturaDoPerfil(form, "i1");
  expect(perfilAlterado(salva, { ...form, nome: "Ana Maria" }, "i1")).toBe(
    true
  );
  expect(perfilAlterado(salva, form, "i2")).toBe(true);
  expect(perfilAlterado(salva, { ...form, nome: "Ana" }, "i1")).toBe(false);
});
