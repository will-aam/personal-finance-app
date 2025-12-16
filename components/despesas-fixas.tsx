// components/despesas-fixas.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
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
  X,
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

  // Estados do Formulário
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novoDia, setNovoDia] = useState("");

  // Estado do Modo Quinzenal (Persistente)
  const [modoQuinzenal, setModoQuinzenal] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const salvo = localStorage.getItem("modoQuinzenalFinanceApp");
    if (salvo === "true") {
      setModoQuinzenal(true);
    }
  }, []);

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
      setIsFormOpen(false);
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

  const itemsDia05 = items.filter((item) => item.dia_vencimento < 15);
  const itemsDia15 = items.filter((item) => item.dia_vencimento >= 15);

  const totalPagamentoDia05 = itemsDia05.reduce(
    (acc, item) => acc + item.valor,
    0
  );
  const totalPagamentoDia15 = itemsDia15.reduce(
    (acc, item) => acc + item.valor,
    0
  );

  const formatMoney = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const DespesaCard = ({
    item,
    colorClass,
  }: {
    item: DespesaFixa;
    colorClass?: string;
  }) => (
    <Card
      className={`hover:bg-accent/50 transition-colors bg-card/40 ${
        colorClass || "border-border/40"
      }`}
    >
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center h-10 w-10 rounded-lg bg-muted/50 border border-border/50 font-bold text-sm">
            <span className="text-[9px] uppercase text-muted-foreground tracking-tighter">
              Dia
            </span>
            {item.dia_vencimento}
          </div>
          <div>
            <p className="font-medium text-sm sm:text-base truncate max-w-[150px]">
              {item.nome}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-sm sm:text-base">
            {formatMoney(item.valor)}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400 mt-1"
            onClick={() => handleExcluir(item.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 pb-20 p-4 md:p-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-right-8 duration-300">
      {/* Header com Botão Voltar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Despesas Fixas
            </h1>
            <p className="text-muted-foreground hidden sm:block text-sm">
              Controle seus pagamentos recorrentes
            </p>
          </div>
        </div>
      </div>

      {/* Card Principal - Resumo */}
      <Card className="bg-red-950/20 border-red-900/30 shadow-sm relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6">
            {/* Linha Superior: Total (Esq) e Switch (Dir) */}
            <div className="flex justify-between items-start">
              {/* Bloco do Total */}
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                  <TrendingDown className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Mensal
                  </p>
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    {formatMoney(totalComprometido)}
                  </h2>
                </div>
              </div>

              {/* Botão Switch - Discreto no canto superior direito */}
              <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity scale-90 origin-top-right">
                <Label
                  htmlFor="quinzena-mode"
                  className="text-[10px] text-muted-foreground uppercase cursor-pointer tracking-wider font-semibold"
                >
                  Quinzenal
                </Label>
                <Switch
                  id="quinzena-mode"
                  checked={modoQuinzenal}
                  onCheckedChange={toggleModoQuinzenal}
                  className="scale-75 data-[state=checked]:bg-red-500"
                />
              </div>
            </div>

            {/* Blocos Quinzenais (Visíveis apenas se ativado) */}
            {modoQuinzenal && (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 pt-2">
                {/* Bloco 1: Dia 05 */}
                <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/10 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                      Dia 05
                    </span>
                  </div>
                  <p className="text-lg font-bold text-blue-100">
                    {formatMoney(totalPagamentoDia05)}
                  </p>
                </div>

                {/* Bloco 2: Dia 15 */}
                <div className="bg-green-500/5 rounded-xl p-4 border border-green-500/10 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-green-400" />
                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">
                      Dia 15
                    </span>
                  </div>
                  <p className="text-lg font-bold text-green-100">
                    {formatMoney(totalPagamentoDia15)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botão Expansível para Nova Despesa */}
      <div className="space-y-4">
        {!isFormOpen ? (
          <Button
            onClick={() => setIsFormOpen(true)}
            variant="outline"
            className="w-full h-12 border-dashed border-muted-foreground/20 hover:bg-accent hover:border-solid transition-all rounded-xl gap-2 text-muted-foreground"
          >
            <Plus className="h-4 w-4" />
            Adicionar Nova Despesa
          </Button>
        ) : (
          <Card className="animate-in zoom-in-95 duration-200 border-primary/20 bg-card/60">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Nova Conta</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFormOpen(false)}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-4 items-end">
                <div className="md:col-span-2 space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Ex: Internet"
                    autoFocus
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
                    inputMode="decimal"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vencimento</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={novoDia}
                      onChange={(e) => setNovoDia(e.target.value)}
                      placeholder="Dia"
                      inputMode="numeric"
                    />
                    <Button
                      onClick={handleAdicionar}
                      className="bg-primary text-primary-foreground"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lista de Despesas */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg tracking-tight px-1">
          Suas Contas
        </h3>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 border rounded-xl border-dashed bg-muted/5 text-muted-foreground">
            <p>Nenhuma conta cadastrada.</p>
            <Button variant="link" onClick={() => setIsFormOpen(true)}>
              Cadastrar a primeira
            </Button>
          </div>
        ) : modoQuinzenal ? (
          // VISÃO DIVIDIDA (MODO QUINZENAL)
          <div className="grid md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            {/* Coluna 1: Dia 05 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-blue-500/20">
                <h4 className="font-bold text-sm text-blue-400 uppercase tracking-wider">
                  1ª Quinzena (Dia 05)
                </h4>
              </div>

              {itemsDia05.length === 0 ? (
                <div className="p-4 border border-dashed border-blue-500/10 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground italic">
                    Nada para o dia 05.
                  </p>
                </div>
              ) : (
                itemsDia05.map((item) => (
                  <DespesaCard
                    key={item.id}
                    item={item}
                    colorClass="border-l-4 border-l-blue-500/50"
                  />
                ))
              )}
            </div>

            {/* Coluna 2: Dia 15 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-green-500/20">
                <h4 className="font-bold text-sm text-green-400 uppercase tracking-wider">
                  2ª Quinzena (Dia 15)
                </h4>
              </div>

              {itemsDia15.length === 0 ? (
                <div className="p-4 border border-dashed border-green-500/10 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground italic">
                    Nada para o dia 15.
                  </p>
                </div>
              ) : (
                itemsDia15.map((item) => (
                  <DespesaCard
                    key={item.id}
                    item={item}
                    colorClass="border-l-4 border-l-green-500/50"
                  />
                ))
              )}
            </div>
          </div>
        ) : (
          // VISÃO PADRÃO (LISTA ÚNICA)
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <DespesaCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
