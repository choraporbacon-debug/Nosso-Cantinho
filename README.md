# Nosso Cantinho V6 💖
Versão nova, criada do zero, com visual romântico premium e integração Supabase.

## Música
A área de música tem três modos: YouTube (player oficial incorporado), MP3 enviado pelo criador e URL direta de áudio. O layout é inspirado em experiências modernas de streaming, mas não copia marcas ou interface proprietária.

## Supabase
1. Authentication > Providers > habilite Anonymous Sign-Ins.
2. SQL Editor > execute `supabase.sql`.
3. Storage > New bucket > `surpresas` > Public ON.
4. Copie `config.example.js` para `config.js`.
5. Em Project Settings > API, coloque a URL e a chave Publishable/anon no `config.js`.
6. Nunca coloque service_role no frontend.

## GitHub Pages
Envie index.html, style.css, app.js, config.js e .nojekyll. O `supabase.sql` pode ficar no repositório, mas não é executado pelo GitHub.

## Fluxo
Criador abre o site > cria a história > Publicar surpresa > arquivos são enviados ao Supabase > é gerado `?surpresa=UUID` > esse link funciona em outro dispositivo.
