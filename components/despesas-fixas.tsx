// app/components/despesas-fixas.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { authClient } from "@/lib/auth-client"; // <--- NOVO IMPORT
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { EditFixedExpenseDialog } from "@/components/EditFixedExpenseDialog";
import {
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  TrendingDown,
  Wallet,
  X,
  Calendar,
  Pencil,
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
  const { toast } = useToast();

  // --- USER SESSION ---
  const session = authClient.useSession();
  const userId = session.data?.user.id;

  const [items, setItems] = useState<DespesaFixa[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Formulário de Criação
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novoDia, setNovoDia] = useState("");

  // Estado do Modo Quinzenal
  const [modoQuinzenal, setModoQuinzenal] = useState(false);

  // Estado para Edição
  const [editingItem, setEditingItem] = useState<DespesaFixa | null>(null);

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
    if (!userId) return; // Só busca se tiver usuário

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("despesas_fixas")
        .select("*")
        .eq("user_id", userId) // <--- SEGURANÇA
        .order("dia_vencimento", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast({ title: "Erro ao carregar", description: error.message });
    } finally {
      setLoading(false);
    }
  }, [toast, userId]);

  useEffect(() => {
    if (userId) {
      fetchDespesas();
    }
  }, [fetchDespesas, userId]);

  const handleAdicionar = async () => {
    if (!userId) return;
    if (!novoNome || !novoValor || !novoDia) return;

    try {
      const { error } = await supabase.from("despesas_fixas").insert([
        {
          user_id: userId, // <--- SEGURANÇA: Cria com dono
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
    if (!userId) return;
    if (!confirm("Tem certeza que deseja excluir esta despesa?")) return;
    try {
      const { error } = await supabase
        .from("despesas_fixas")
        .delete()
        .eq("id", id)
        .eq("user_id", userId); // <--- SEGURANÇA: Só apaga se for meu

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
    0,
  );
  const totalPagamentoDia15 = itemsDia15.reduce(
    (acc, item) => acc + item.valor,
    0,
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
      className={`transition-all duration-200 hover:shadow-md hover:-translate-y-1 bg-card/40 ${
        colorClass || "border-border/40"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-muted/50 border border-border/50">
                <Calendar className="h-4 w-4 text-muted-foreground mb-1" />
                <span className="text-xs font-bold">{item.dia_vencimento}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">{item.nome}</p>
              </div>
            </div>

            {/* Ações (Editar e Excluir) */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={() => setEditingItem(item)} // Abre o modal de edição
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-50/10"
                onClick={() => handleExcluir(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-base sm:text-lg">
              {formatMoney(item.valor)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 pb-20 p-4 md:p-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-right-8 duration-300">
      {/* Componente de Edição (Modal) */}
      <EditFixedExpenseDialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        expense={editingItem}
        onSuccess={fetchDespesas}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full hover:bg-accent/50"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Despesas Fixas
            </h1>
            <p className="text-muted-foreground hidden sm:block text-sm">
              Controle seus pagamentos recorrentes
            </p>
          </div>
        </div>
      </div>

      {/* Card Resumo */}
      <Card className="from-red-950/20 to-red-900/10 border-red-900/30 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-xl"></div>
        <CardContent className="p-6 relative">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                  <TrendingDown className="h-7 w-7 text-red-500" />
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

            {modoQuinzenal && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 pt-2">
                <div className="from-blue-500/5 to-blue-600/5 rounded-xl p-4 border border-blue-500/10 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                      Dia 05
                    </span>
                  </div>
                  <p className="text-xl font-bold text-blue-100">
                    {formatMoney(totalPagamentoDia05)}
                  </p>
                </div>
                <div className="from-green-500/5 to-green-600/5 rounded-xl p-4 border border-green-500/10 flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-green-400" />
                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">
                      Dia 15
                    </span>
                  </div>
                  <p className="text-xl font-bold text-green-100">
                    {formatMoney(totalPagamentoDia15)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botão Adicionar */}
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

      {/* Lista */}
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
          <div className="grid md:grid-cols-2 gap-6 animate-in fade-in duration-300">
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
                <div className="space-y-3">
                  {itemsDia05.map((item) => (
                    <DespesaCard
                      key={item.id}
                      item={item}
                      colorClass="border-l-4 border-l-blue-500/50"
                    />
                  ))}
                </div>
              )}
            </div>

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
                <div className="space-y-3">
                  {itemsDia15.map((item) => (
                    <DespesaCard
                      key={item.id}
                      item={item}
                      colorClass="border-l-4 border-l-green-500/50"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <DespesaCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
