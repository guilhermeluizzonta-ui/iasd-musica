# IASD Música

App de cifras e partituras do Ministério da Música da IASD Jaraguá do Sul - Central.

- `src/app.html`: o app (o mesmo que roda no Claude).
- `scripts/build-web.mjs`: monta `www/` com fontes e leitor de PDF locais (funciona offline).
- `src/pauta/pauta-mao-livre.html`: editor de partitura à mão (S Pen), vira `www/pauta.html`. Plano em `docs/pauta-mao-livre.md`.
- `android/`: projeto Android (Capacitor).
- Cada envio para `main` gera um APK automaticamente (aba **Actions**) e publica em **Releases**.

## Documentação
- `docs/FUNCIONALIDADES.md`: o que o app faz, por área.
- `docs/ARQUITETURA.md`: como o app é feito (arquivos, telas, dados, temas, testes, como publicar).
- `docs/PERFORMANCE.md`: medições de desempenho e próximas melhorias.
- `docs/pauta-mao-livre.md`: editor de partitura à mão.
