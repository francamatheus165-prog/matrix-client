# Matrix Client — MathPRIME

Repositório oficial do Matrix Client para MineFun.io.

## Fonte única

Tudo do cliente fica neste repositório: código, mods, texturas, badges, assets e configurações.

**Repositório oficial:** https://github.com/francamatheus165-prog/matrix-client

## Atualização automática pelo GitHub

O arquivo `.github/workflows/build.yml` é acionado a cada `push` na branch `main` ou `master`.

A Action:

1. instala as dependências;
2. compila o Matrix Client para Windows x64;
3. cria o único pacote oficial:
   `Matrix-Client-MathPRIME-v1.3.4-ADVANCED-MODS-TEXTURES-BADGES.zip`;
4. cria `matrix-manifest.json` com o commit e SHA-256;
5. atualiza a Release `matrix-auto`.

O cliente consulta essa Release diretamente no GitHub. Quando o `buildId` muda, ele baixa o ZIP, verifica o SHA-256, aplica a atualização e reinicia.

Não é necessário gerar o cliente manualmente no computador.

## Como publicar uma alteração

Edite um arquivo pelo GitHub e faça **Commit changes** na `main`.

Depois disso, o GitHub Actions gera a nova build automaticamente.
