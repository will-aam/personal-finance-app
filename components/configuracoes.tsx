// app/components/configuracoes.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Tag, CreditCard, Calendar, Target } from "lucide-react";
import { supabase } from "@/lib/supabase";
// import { authClient } from "@/lib/auth-client"; // Removido, pois é global agora
import { QuickActionCard } from "@/components/config/QuickActionCard";
import { ThemeToggleCard } from "@/components/config/ThemeToggleCard";
import { ListManagerCard, ListItem } from "@/components/config/ListManagerCard";
import { useToast } from "@/hooks/use-toast";

interface ConfiguracoesProps {
  onNavigate?: (tab: string) => void;
}

export default function Configuracoes({ onNavigate }: ConfiguracoesProps) {
  const { toast } = useToast();

  // Iniciamos com arrays vazios para evitar undefined
  const [categorias, setCategorias] = useState<ListItem[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<ListItem[]>([]);

  const fetchData = useCallback(async () => {
    // Busca GLOBAL (sem filtro de user_id)
    const { data: catData } = await supabase
      .from("categorias")
      .select("*")
      .order("nome");
    if (catData) setCategorias(catData);

    // Busca GLOBAL (sem filtro de user_id)
    const { data: payData } = await supabase
      .from("formas_pagamento")
      .select("*")
      .order("nome");
    if (payData) setFormasPagamento(payData);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (
    table: "categorias" | "formas_pagamento",
    nome: string,
  ) => {
    // Insert GLOBAL (sem user_id, visível para todos)
    const { error } = await supabase.from(table).insert([{ nome }]); // <--- GLOBAL

    if (error) {
      toast({
        title: "Erro ao adicionar",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
    fetchData();
    toast({ title: "Adicionado (Global)!" });
  };

  const handleRemove = async (
    table: "categorias" | "formas_pagamento",
    id: number,
  ) => {
    // Delete GLOBAL (Cuidado: qualquer um apaga de qualquer um)
    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) {
      toast({ title: "Erro ao remover", variant: "destructive" });
      throw error;
    }
    fetchData();
    toast({ title: "Removido com sucesso!" });
  };

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="pb-2">
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ThemeToggleCard />
        <QuickActionCard
          icon={Target}
          label="Metas"
          onClick={() => onNavigate && onNavigate("metas")}
        />
        <QuickActionCard
          icon={Calendar}
          label="Despesas Fixas"
          onClick={() => onNavigate && onNavigate("despesas_fixas")}
        />
      </div>

      <ListManagerCard
        title="Categorias (Global)"
        icon={Tag}
        items={categorias}
        placeholderInput="Nova categoria global"
        onAdd={(nome) => handleAdd("categorias", nome)}
        onRemove={(id) => handleRemove("categorias", id)}
      />

      <ListManagerCard
        title="Formas de Pagamento (Global)"
        icon={CreditCard}
        items={formasPagamento}
        placeholderInput="Nova forma global"
        onAdd={(nome) => handleAdd("formas_pagamento", nome)}
        onRemove={(id) => handleRemove("formas_pagamento", id)}
      />
    </div>
  );
}
