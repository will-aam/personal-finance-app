// components/despesas-fixas.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Calendar,
  Loader2,
  ArrowLeft,
  DollarSign,
  TrendingDown,
} from "lucide-react";

interface DespesasFixasProps {
  onBack: () => void; // Função para voltar
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

      toast({ title: "Despesa fixa adicionada!" });
      setNovoNome("");
      setNovoValor("");
      setNovoDia("");
      fetchDespesas(); // Recarrega a lista
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
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-right-8">
      {/* Header com Voltar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Despesas Fixas</h1>
          <p className="text-muted-foreground">
            Gerencie seus gastos recorrentes mensais
          </p>
        </div>
      </div>

      {/* Card de Resumo */}
      <Card className="bg-red-950/20 border-red-900/50">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Comprometido Mensal
              </p>
              <h2 className="text-3xl font-bold">
                {totalComprometido.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </h2>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Adição */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova Despesa Fixa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <Label>Nome (ex: Aluguel, Internet)</Label>
              <Input
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Digite o nome..."
              />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={novoValor}
                onChange={(e) => setNovoValor(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Dia Vencimento</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={novoDia}
                  onChange={(e) => setNovoDia(e.target.value)}
                  placeholder="Dia"
                />
                <Button onClick={handleAdicionar}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Despesas */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Lista de Despesas</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 border rounded-lg border-dashed text-muted-foreground">
            Nenhuma despesa fixa cadastrada ainda.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className="hover:bg-accent/50 transition-colors"
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center h-10 w-10 rounded-lg bg-muted border font-bold text-sm">
                      <span className="text-[10px] uppercase text-muted-foreground">
                        Dia
                      </span>
                      {item.dia_vencimento}
                    </div>
                    <div>
                      <p className="font-medium">{item.nome}</p>
                      <p className="text-xs text-muted-foreground">Mensal</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {item.valor.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive mt-1"
                      onClick={() => handleExcluir(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
