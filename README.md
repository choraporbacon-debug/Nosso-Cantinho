# Nosso Cantinho V4 💗

V4 — revisão de estabilidade e experiência.

## O que foi corrigido
- JavaScript refeito para inicialização mais segura.
- Fluxo de 6 etapas.
- Até 9 fotos com preview e remoção.
- Puzzle 3×3 funcional.
- Contador atualizado a cada segundo.
- YouTube aceita youtu.be, youtube.com/watch, shorts, embed e live.
- YouTube usa iframe privacy-enhanced dentro da página, em vez de tentar tocar URL do YouTube no elemento audio.
- MP3 local e URL direta de áudio.
- Player visual próprio.
- Temas.
- Galeria com visualização ampliada.
- Página pública separada do editor na interface.

## Limitação importante
Esta V4 ainda é um protótipo estático. O link gerado usa localStorage, então uma surpresa não é realmente publicada na internet para outro aparelho.

Para o produto final funcionar como um site de compartilhamento real, o próximo passo é integrar Supabase:
- banco para os dados da surpresa;
- Storage para fotos e MP3;
- UUID público para cada surpresa;
- leitura pública somente da surpresa;
- editor separado e protegido;
- RLS e proteção contra spam.

Não coloque uma service_role key no frontend.
