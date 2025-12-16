// components/despesas-fixas.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  TrendingDown,
  ChevronDown,
} from "lucide-react";

interface DespesasFixasProps {
  onBack: () => void;
}

interface DespesaFixa {
  id: number;
  nome: string;
  valor: number;
  dia_vencimento: number;
}

export default function DespesasFixas({ onBack }: DespesasFixasProps) {
  const [items, setItems] = useState<DespesaFixa[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novoDia, setNovoDia] = useState("");
  const { toast } = useToast();

  const fetchDespesas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("despesas_fixas")
        .select("*")
        .order("dia_vencimento", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast({ title: "Erro ao carregar", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDespesas();
  }, [fetchDespesas]);

  const handleAdicionar = async () => {
    if (!novoNome || !novoValor || !novoDia) return;

    try {
      const { error } = await supabase.from("despesas_fixas").insert([
        {
          nome: novoNome,
          valor: Number(novoValor),
          dia_vencimento: Number(novoDia),
        },
      ]);

      if (error) throw error;

      toast({ title: "Despesa adicionada!" });
      setNovoNome("");
      setNovoValor("");
      setNovoDia("");
      setIsFormOpen(false); // Fecha o formulário após adicionar
      fetchDespesas();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExcluir = async (id: number) => {
    try {
      const { error } = await supabase
        .from("despesas_fixas")
        .delete()
        .eq("id", id);
      if (error) throw error;

      setItems(items.filter((item) => item.id !== id));
      toast({ title: "Removido com sucesso" });
    } catch (error: any) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const totalComprometido = items.reduce((acc, item) => acc + item.valor, 0);

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-right-8">
      {/* Header Compacto */}
      <div className="flex items-center gap-3 pb-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Despesas Fixas</h1>
      </div>

      {/* Card de Resumo Compacto */}
      <Card className="bg-red-950/20 border-red-900/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <p className="text-sm font-medium text-muted-foreground">
              Total Mensal
            </p>
          </div>
          <h2 className="text-2xl font-bold text-red-500">
            {totalComprometido.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </h2>
        </CardContent>
      </Card>

      {/* Formulário de Adição Colapsável */}
      <Card>
        <CardHeader className="pb-3">
          <Button
            variant="ghost"
            className="w-full justify-between h-auto p-0"
            onClick={() => setIsFormOpen(!isFormOpen)}
          >
            <CardTitle className="text-base">Adicionar Nova Despesa</CardTitle>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isFormOpen ? "rotate-180" : ""
              }`}
            />
          </Button>
        </CardHeader>
        {isFormOpen && (
          <CardContent className="space-y-3">
            <Input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Nome (ex: Aluguel)"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                step="0.01"
                value={novoValor}
                onChange={(e) => setNovoValor(e.target.value)}
                placeholder="Valor (R$)"
              />
              <Input
                type="number"
                min="1"
                max="31"
                value={novoDia}
                onChange={(e) => setNovoDia(e.target.value)}
                placeholder="Dia Venc."
              />
            </div>
            <Button onClick={handleAdicionar} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Despesa
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Lista de Despesas (Formato de Linha) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Suas Despesas ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Nenhuma despesa cadastrada.
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted font-bold text-sm">
                      {item.dia_vencimento}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.nome}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">
                      {item.valor.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleExcluir(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
