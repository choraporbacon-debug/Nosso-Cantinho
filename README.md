# Nosso Cantinho V5 — GitHub + Supabase 💖

## Arquivos
- `index.html` — página
- `style.css` — visual
- `script.js` — editor, compartilhamento e página pública
- `config.example.js` — modelo da configuração
- `supabase.sql` — banco + RLS + políticas do Storage

## Configuração no Supabase
1. Authentication → Providers → habilite **Anonymous Sign-Ins**.
2. Storage → crie um bucket chamado `surpresas`.
3. Marque o bucket como **Public**.
4. SQL Editor → cole e execute `supabase.sql`.
5. Faça uma cópia de `config.example.js` chamada `config.js`.
6. Em Project Settings → API, copie a URL do projeto e a chave **Publishable/anon** para `config.js`.
7. NUNCA coloque a `service_role` no site.

## GitHub Pages
Envie TODOS os arquivos para a raiz do repositório:
`index.html`, `style.css`, `script.js`, `config.js`, `supabase.sql`, etc.

Depois:
Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save.

## Como funciona
O criador recebe uma sessão anônima do Supabase. Ao criar a surpresa, os arquivos são enviados para Storage e os dados são gravados na tabela `surpresas`. O site gera:
`?surpresa=UUID`

Esse link pode ser aberto em outro celular. A pessoa que recebe vê somente a página pública da surpresa.

## Importante
O `config.js` usa uma chave publishable/anon, que é apropriada para frontend quando as políticas RLS estão corretas. A segurança real depende das políticas do Supabase.
