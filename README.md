# Nosso Cantinho V5 💖

Versão preparada para **GitHub Pages + Supabase**, com links públicos que funcionam em outros celulares.

## Configuração rápida
1. Crie um projeto no Supabase.
2. Em Authentication > Providers, habilite **Anonymous Sign-Ins**.
3. Em Storage, crie um bucket público chamado `surpresas`.
4. Abra o SQL Editor e execute `supabase.sql`.
5. Copie `config.example.js` para `config.js` e coloque a URL e a chave publishable/anon do projeto.
6. Envie todos os arquivos para um repositório público no GitHub.
7. Ative GitHub Pages usando a branch `main` e a pasta `/root`.

A chave publishable/anon pode ficar no frontend; **nunca coloque uma service_role key no site**.

O editor salva rascunhos localmente e o botão Compartilhar cria um registro remoto com UUID, envia arquivos ao Storage e gera um link público. O destinatário vê somente a surpresa. O botão Editar só aparece para a sessão anônima que criou a surpresa.

## Observação
Este pacote mantém o visual e as funções da V4 como base. O módulo remoto está preparado para ser conectado ao fluxo de compartilhamento do `script.js`; se você quiser usar o backend imediatamente, substitua o `script.js` pela versão integrada fornecida no projeto final.
