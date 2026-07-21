# Frota&Rota — guia de publicação (passo a passo)

Este pacote é o mesmo sistema de gestão de viaturas, agora preparado para
correr fora do Claude, com um link próprio e dados guardados numa base de
dados real (Supabase — grátis).

Não precisa saber programar. São só 3 partes: **Supabase** (base de dados),
**GitHub** (guardar o código) e **Netlify** (publicar o link).

---

## PARTE 1 — Criar a base de dados (Supabase)

1. Vá a **supabase.com** → crie uma conta grátis → **New project**
2. Dê um nome (ex: `frota-rota`) e uma palavra-passe para a base de dados (guarde-a)
3. Espere ~2 minutos até o projeto ficar pronto
4. No menu esquerdo, clique em **SQL Editor** → **New query**
5. Abra o ficheiro `supabase_schema.sql` deste pacote, copie todo o conteúdo,
   cole no editor e clique **Run**
6. Vá a **Project Settings** (ícone de engrenagem) → **API**
7. Copie dois valores:
   - **Project URL**
   - **anon public key**

## PARTE 2 — Ligar o código à base de dados

1. Abra o ficheiro `src/supabaseClient.js` neste pacote
2. Substitua:
   - `COLE_AQUI_O_SEU_PROJECT_URL` pelo **Project URL** copiado
   - `COLE_AQUI_A_SUA_ANON_PUBLIC_KEY` pela **anon public key** copiada
3. Grave o ficheiro

## PARTE 3 — Colocar o código no GitHub

1. Vá a **github.com** → crie uma conta grátis (se não tiver)
2. Clique em **New repository** → dê um nome (ex: `frota-rota`) → **Create repository**
3. Clique em **uploading an existing file** e arraste TODOS os ficheiros e
   pastas deste pacote (incluindo a pasta `src`) → **Commit changes**

## PARTE 4 — Publicar no Netlify

1. Vá a **netlify.com** → crie uma conta grátis → entre com a conta do GitHub
2. Clique em **Add new site → Import an existing project**
3. Escolha o repositório `frota-rota` que criou
4. O Netlify já deteta automaticamente as definições (build command: `npm run build`,
   pasta de publicação: `dist`) — só clique em **Deploy site**
5. Espere 1–2 minutos. No final, o Netlify dá-lhe um link tipo:
   `https://frota-rota-xyz123.netlify.app`

Esse é o **link direto e permanente** da sua plataforma — pode abrir no PC,
no celular, e partilhar com a sua equipa.

*(Opcional: em Site settings → Domain management, pode trocar o nome
`frota-rota-xyz123` por algo à sua escolha, tipo `frotarota-lda.netlify.app`,
de graça.)*

---

## Primeiro acesso

- **Utilizador:** `admin`
- **Palavra-passe:** `admin123`

Troque esta palavra-passe assim que entrar (em **Utilizadores**), e crie os
acessos da sua equipa lá (Leitura / Lançamento / Administrador).

## Notas importantes

- Qualquer alteração futura ao sistema exige editar os ficheiros e repetir
  a Parte 3 (novo upload ao GitHub) — o Netlify republica automaticamente.
- A palavra-passe dos utilizadores fica guardada em texto simples na base
  de dados — aceitável para uso interno, mas não é o nível de segurança
  de um sistema comercial. Posso reforçar isso depois, se quiser.
- Os documentos anexados (viaturas/motoristas) continuam limitados a
  ~1.5MB por ficheiro.
