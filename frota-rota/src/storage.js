import { supabase } from "./supabaseClient.js";

// Guarda cada "tabela" do sistema (utilizadores, empresas, viaturas, motoristas,
// PO's, combustível) como uma linha JSON numa única tabela genérica app_data.
// Isto mantém o mesmo comportamento que o sistema tinha dentro do Claude,
// mas agora com uma base de dados real e persistente.

export async function loadKey(key, fallback) {
  try {
    const { data, error } = await supabase
      .from("app_data")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return fallback;
    return data.value;
  } catch (e) {
    console.error("erro ao carregar", key, e);
    return fallback;
  }
}

export async function saveKey(key, value) {
  try {
    const { error } = await supabase
      .from("app_data")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) console.error("erro ao gravar", key, error);
  } catch (e) {
    console.error("erro ao gravar", key, e);
  }
}
