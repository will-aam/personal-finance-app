"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Lancamento } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Filter, Loader2, Search } from "lucide-react"; // X removido
import { useToast } from "@/hooks/use-toast";

// NOVOS COMPONENTES
import { MonthSelector } from "./lancamentos/MonthSelector";
import { LancamentoItem } from "./lancamentos/LancamentoItem";
import { LancamentosFilters } from "./lancamentos/LancamentosFilters";

export default function Lancamentos() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();

  // Seleção e Opções
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [categoriasDB, setCategoriasDB] = useState<
    { id: number; nome: string }[]
  >([]);
  const [formasPagamentoDB, setFormasPagamentoDB] = useState<
    { id: number; nome: string }[]
  >([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [filtrosTipo, setFiltrosTipo] = useState<string[]>([]);
  const [filtrosCategoria, setFiltrosCategoria] = useState<string[]>([]);
  const [filtrosPagamento, setFiltrosPagamento] = useState<string[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string | null>(null);

  // Data
  const [date, setDate] = useState<Date>(new Date());
  const [filtroMes, setFiltroMes] = useState(
    new Date().toISOString().slice(0, 7),
  );

  // Formulario
  const [formData, setFormData] = useState<Partial<Lancamento>>({
    descricao: "",
    categoria: "Contas Fixas",
    tipo: "Despesa",
    valor: 0,
    forma_pagamento: "Pix",
    data_vencimento: new Date().toISOString().split("T")[0],
    pago: false,
    observacoes: "",
  });

  // --- EFEITOS E BUSCAS ---
  useEffect(() => {
    if (date) {
      const ano = date.getFullYear();
      const mes = String(date.getMonth() + 1).padStart(2, "0");
      setFiltroMes(`${ano}-${mes}`);
    }
  }, [date]);

  const fetchOpcoes = useCallback(async () => {
    try {
      setLoadingOptions(true);
      const { data: cat } = await supabase
        .from("categorias")
        .select("*")
        .order("nome");
      if (cat) setCategoriasDB(cat);
      const { data: pay } = await supabase
        .from("formas_pagamento")
        .select("*")
        .order("nome");
      if (pay) setFormasPagamentoDB(pay);
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  const fetchLancamentos = useCallback(async () => {
    try {
      setLoading(true);
      setSelectedIds([]);
      const [ano, mes] = filtroMes.split("-");
      const dataInicio = `${filtroMes}-01`;
      const dataFim = `${filtroMes}-${new Date(parseInt(ano), parseInt(mes), 0).getDate()}`;

      const { data, error } = await supabase
        .from("lancamentos")
        .select("*")
        .gte("data_vencimento", dataInicio)
        .lte("data_vencimento", dataFim)
        .order("data_vencimento", { ascending: true });

      if (error) throw error;
      setLancamentos(data as unknown as Lancamento[]);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filtroMes, toast]);

  useEffect(() => {
    fetchLancamentos();
    fetchOpcoes();
  }, [fetchLancamentos, fetchOpcoes]);

  // --- LÓGICA DE FILTRO ---
  const lancamentosFiltrados = lancamentos.filter((l) => {
    const matchSearch = l.descricao
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchTipo = filtrosTipo.length === 0 || filtrosTipo.includes(l.tipo);
    const matchCategoria =
      filtrosCategoria.length === 0 || filtrosCategoria.includes(l.categoria);
    const matchPagamento =
      filtrosPagamento.length === 0 ||
      filtrosPagamento.includes(l.forma_pagamento);
    let matchStatus = true;
    if (filtroStatus === "pago") matchStatus = l.pago === true;
    if (filtroStatus === "pendente") matchStatus = l.pago === false;
    return (
      matchSearch &&
      matchTipo &&
      matchCategoria &&
      matchPagamento &&
      matchStatus
    );
  });

  // --- AÇÕES CRUD E SELEÇÃO ---
  const handleSelectAll = () => {
    if (
      selectedIds.length === lancamentosFiltrados.length &&
      lancamentosFiltrados.length > 0
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(lancamentosFiltrados.map((l) => l.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0 || !confirm("Excluir itens selecionados?"))
      return;
    try {
      await supabase.from("lancamentos").delete().in("id", selectedIds);
      toast({ title: `${selectedIds.length} excluídos.` });
      setLancamentos((prev) => prev.filter((l) => !selectedIds.includes(l.id)));
      setSelectedIds([]);
    } catch (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await supabase.from("lancamentos").update(formData).eq("id", editingId);
        toast({ title: "Atualizado!" });
      } else {
        await supabase.from("lancamentos").insert([formData]);
        toast({ title: "Criado!" });
      }
      resetForm();
      fetchLancamentos();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Excluir este lançamento?")) return;
    try {
      await supabase.from("lancamentos").delete().eq("id", id);
      setLancamentos((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Excluído com sucesso" });
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const togglePago = async (lancamento: Lancamento) => {
    try {
      const novoStatus = !lancamento.pago;
      setLancamentos((prev) =>
        prev.map((l) =>
          l.id === lancamento.id ? { ...l, pago: novoStatus } : l,
        ),
      );
      await supabase
        .from("lancamentos")
        .update({ pago: novoStatus })
        .eq("id", lancamento.id);
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      descricao: "",
      categoria: categoriasDB[0]?.nome || "Contas Fixas",
      tipo: "Despesa",
      valor: 0,
      forma_pagamento: formasPagamentoDB[0]?.nome || "Pix",
      data_vencimento: new Date().toISOString().split("T")[0],
      pago: false,
      observacoes: "",
    });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (lancamento: Lancamento) => {
    setFormData(lancamento);
    setEditingId(lancamento.id);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-5xl mx-auto pb-24 overflow-x-hidden w-full">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sticky top-0 z-10 bg-background/95 backdrop-blur-md py-2 -mx-4 px-4 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lançamentos</h1>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <MonthSelector date={date} setDate={setDate} />

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} size="icon" className="shrink-0">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>

            {/* MODAL BLINDADO (TELA CHEIA MOBILE) */}
            <DialogContent
              className="w-screen h-screen max-w-none rounded-none sm:rounded-lg sm:h-auto sm:max-w-lg flex flex-col p-0 gap-0"
              onInteractOutside={(e) => e.preventDefault()}
            >
              {/* HEADER SIMPLES (O 'X' padrão do Dialog já aparecerá aqui no canto) */}
              <DialogHeader className="p-6 pb-2 border-b">
                <DialogTitle>
                  {editingId ? "Editar" : "Novo"} Lançamento
                </DialogTitle>
              </DialogHeader>

              {/* Área de Scroll para o Formulário */}
              <div className="flex-1 overflow-y-auto p-6">
                <form
                  id="lancamento-form"
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                      required
                      placeholder="Ex: Mercado, Salário..."
                      className="text-lg py-6"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          R$
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.valor || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              valor: Number(e.target.value),
                            })
                          }
                          required
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(v: any) =>
                          setFormData({ ...formData, tipo: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Despesa">Despesa</SelectItem>
                          <SelectItem value="Receita">Receita</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(v) =>
                        setFormData({ ...formData, categoria: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriasDB.map((c) => (
                          <SelectItem key={c.id} value={c.nome}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Pagamento</Label>
                    <Select
                      value={formData.forma_pagamento}
                      onValueChange={(v) =>
                        setFormData({ ...formData, forma_pagamento: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formasPagamentoDB.map((f) => (
                          <SelectItem key={f.id} value={f.nome}>
                            {f.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Vencimento</Label>
                    <Input
                      type="date"
                      value={formData.data_vencimento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          data_vencimento: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Espaço extra no final */}
                  <div className="h-4"></div>
                </form>
              </div>

              {/* Rodapé Fixo */}
              <div className="p-4 border-t bg-background/95 backdrop-blur z-10 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                  type="button"
                >
                  Cancelar
                </Button>
                <Button className="flex-1" type="submit" form="lancamento-form">
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* CONTROLES: SELECT ALL + SEARCH + FILTROS */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={
                lancamentosFiltrados.length > 0 &&
                selectedIds.length === lancamentosFiltrados.length
              }
              onCheckedChange={handleSelectAll}
            />
            <Label
              htmlFor="select-all"
              className="cursor-pointer font-medium text-sm"
            >
              Selecionar Todos
            </Label>
          </div>
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="h-8"
            >
              <Trash2 className="h-3 w-3 mr-2" /> Excluir ({selectedIds.length})
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lançamentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/30"
          />
        </div>

        <LancamentosFilters
          filtrosTipo={filtrosTipo}
          setFiltrosTipo={setFiltrosTipo}
          filtrosCategoria={filtrosCategoria}
          setFiltrosCategoria={setFiltrosCategoria}
          filtrosPagamento={filtrosPagamento}
          setFiltrosPagamento={setFiltrosPagamento}
          filtroStatus={filtroStatus}
          setFiltroStatus={setFiltroStatus}
          categoriasOptions={categoriasDB}
          pagamentoOptions={formasPagamentoDB}
        />
      </div>

      {/* LISTA */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : lancamentosFiltrados.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Filter className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground">
                Nenhum lançamento encontrado.
              </p>
              {(filtrosTipo.length > 0 ||
                filtrosCategoria.length > 0 ||
                searchQuery) && (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery("");
                    setFiltrosTipo([]);
                    setFiltrosCategoria([]);
                    setFiltrosPagamento([]);
                    setFiltroStatus(null);
                  }}
                >
                  Limpar tudo
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          lancamentosFiltrados.map((lancamento) => (
            <LancamentoItem
              key={lancamento.id}
              lancamento={lancamento}
              isSelected={selectedIds.includes(lancamento.id)}
              onSelect={() => {}}
              onTogglePago={() => togglePago(lancamento)}
              onEdit={() => handleEdit(lancamento)}
              onDelete={() => handleDelete(lancamento.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
