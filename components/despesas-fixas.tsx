// components/despesas-fixas.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  TrendingDown,
  Wallet,
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

  // Form states
  const [novoNome, setNovoNome] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novoDia, setNovoDia] = useState("");

  // Estado do Modo Quinzenal (Inicia falso, atualiza no useEffect)
  const [modoQuinzenal, setModoQuinzenal] = useState(false);

  const { toast } = useToast();

  // 1. Efeito para carregar a preferência salva no LocalStorage ao abrir a tela
  useEffect(() => {
    const salvo = localStorage.getItem("modoQuinzenalFinanceApp");
    if (salvo === "true") {
      setModoQuinzenal(true);
    }
  }, []);

  // 2. Função para alternar e SALVAR a preferência
  const toggleModoQuinzenal = (checked: boolean) => {
    setModoQuinzenal(checked);
    localStorage.setItem("modoQuinzenalFinanceApp", String(checked));
  };

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

  // CÁLCULOS
  const totalComprometido = items.reduce((acc, item) => acc + item.valor, 0);

  // Bloco 1: Salário do dia 05 (Paga contas com dia < 15)
  const totalPagamentoDia05 = items
    .filter((item) => item.dia_vencimento < 15)
    .reduce((acc, item) => acc + item.valor, 0);

  // Bloco 2: Salário do dia 15 (Paga contas com dia >= 15)
  const totalPagamentoDia15 = items
    .filter((item) => item.dia_vencimento >= 15)
    .reduce((acc, item) => acc + item.valor, 0);

  const formatMoney = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-right-8">
      {/* Header com Voltar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Despesas Fixas</h1>
            <p className="text-muted-foreground hidden sm:block">
              Gerencie seus gastos recorrentes
            </p>
          </div>
        </div>
      </div>

      {/* Card de Resumo Principal */}
      <Card className="bg-red-950/20 border-red-900/50">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            {/* Linha Superior: Total e Toggle */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <TrendingDown className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Mensal
                  </p>
                  <h2 className="text-3xl font-bold">
                    {formatMoney(totalComprometido)}
                  </h2>
                </div>
              </div>

              {/* Botão de Ativar Visão Quinzenal */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="quinzena-mode"
                    className="text-xs text-muted-foreground hidden sm:block"
                  >
                    Modo Quinzenal
                  </Label>
                  <Switch
                    id="quinzena-mode"
                    checked={modoQuinzenal}
                    onCheckedChange={toggleModoQuinzenal} // Usa a nova função que salva
                  />
                </div>
                <span className="text-[10px] text-muted-foreground sm:hidden">
                  Ver Quinzenas
                </span>
              </div>
            </div>

            {/* BLOCOS QUINZENAIS (Limpos, sem texto extra) */}
            {modoQuinzenal && (
              <div className="grid grid-cols-2 gap-4 mt-2 pt-4 border-t border-red-900/30 animate-in fade-in slide-in-from-top-2">
                {/* Bloco 1: Salário Dia 05 */}
                <div className="bg-background/50 rounded-lg p-3 border border-border/50 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Pagar dia 05
                    </span>
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {formatMoney(totalPagamentoDia05)}
                  </p>
                </div>

                {/* Bloco 2: Salário Dia 15 */}
                <div className="bg-background/50 rounded-lg p-3 border border-border/50 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-green-400" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Pagar dia 15
                    </span>
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {formatMoney(totalPagamentoDia15)}
                  </p>
                </div>
              </div>
            )}
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
                placeholder="Nome da conta..."
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
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Lista Completa</h3>
          {modoQuinzenal && (
            <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
              Separado por quinzena
            </span>
          )}
        </div>

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
            {items.map((item) => {
              // Define a cor da borda baseada na quinzena se o modo estiver ativo
              let borderClass = "border-transparent";
              if (modoQuinzenal) {
                borderClass =
                  item.dia_vencimento < 15
                    ? "border-l-4 border-l-blue-400" // Dia 05
                    : "border-l-4 border-l-green-400"; // Dia 15
              }

              return (
                <Card
                  key={item.id}
                  className={`hover:bg-accent/50 transition-colors ${borderClass}`}
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
                        {/* Removi o texto extra que aparecia aqui também, mantendo só o visual da borda */}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatMoney(item.valor)}</p>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
