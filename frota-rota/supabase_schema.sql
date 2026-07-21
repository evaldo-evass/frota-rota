-- Execute este script no Supabase: Project → SQL Editor → New query → Run

create table if not exists app_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

alter table app_data enable row level security;

-- Acesso simples: qualquer pessoa com a "anon key" pode ler/escrever.
-- Suficiente para uso interno da empresa; não usar para dados públicos sensíveis
-- sem reforçar a segurança mais tarde.
create policy "permitir tudo" on app_data
  for all
  using (true)
  with check (true);
