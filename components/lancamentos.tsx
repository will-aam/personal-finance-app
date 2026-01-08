"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Lancamento } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Plus,
  Pencil,
  Trash2,
  CreditCard,
  CheckCircle,
  XCircle,
  Filter,
  Loader2,
  CalendarIcon,
  Calendar as CalendarLucide,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Lancamentos() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  // --- SELEÇÃO EM MASSA ---
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // --- ESTADOS DE OPÇÕES DO BANCO ---
  const [categoriasDB, setCategoriasDB] = useState<
    { id: number; nome: string }[]
  >([]);
  const [formasPagamentoDB, setFormasPagamentoDB] = useState<
    { id: number; nome: string }[]
  >([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // --- FILTROS ---
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroPago, setFiltroPago] = useState<string>("todos");

  // Estado de data
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [filtroMes, setFiltroMes] = useState(
    new Date().toISOString().slice(0, 7)
  );

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
      const { data: catData } = await supabase
        .from("categorias")
        .select("*")
        .order("nome");
      if (catData) setCategoriasDB(catData);

      const { data: payData } = await supabase
        .from("formas_pagamento")
        .select("*")
        .order("nome");
      if (payData) setFormasPagamentoDB(payData);
    } catch (error: any) {
      console.error("Erro ao carregar opções", error);
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
      const dataFim = `${filtroMes}-${new Date(
        parseInt(ano),
        parseInt(mes),
        0
      ).getDate()}`;

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

  // --- LÓGICA DE SELEÇÃO EM MASSA ---

  const lancamentosFiltrados = lancamentos
    .filter((l) => filtroTipo === "todos" || l.tipo === filtroTipo)
    .filter(
      (l) => filtroCategoria === "todas" || l.categoria === filtroCategoria
    )
    .filter(
      (l) =>
        filtroPago === "todos" || (filtroPago === "pago" ? l.pago : !l.pago)
    );

  const handleSelectAll = () => {
    if (
      selectedIds.length === lancamentosFiltrados.length &&
      lancamentosFiltrados.length > 0
    ) {
      setSelectedIds([]); // Desmarcar todos
    } else {
      setSelectedIds(lancamentosFiltrados.map((l) => l.id)); // Marcar todos visíveis
    }
  };

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.length} itens?`))
      return;

    try {
      const { error } = await supabase
        .from("lancamentos")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;

      toast({ title: `${selectedIds.length} lançamentos excluídos.` });
      setLancamentos(lancamentos.filter((l) => !selectedIds.includes(l.id)));
      setSelectedIds([]);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // --- CRUD INDIVIDUAL ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from("lancamentos")
          .update(formData)
          .eq("id", editingId);
        if (error) throw error;
        toast({ title: "Lançamento atualizado!" });
      } else {
        const { error } = await supabase.from("lancamentos").insert([formData]);
        if (error) throw error;
        toast({ title: "Lançamento criado!" });
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
    if (!confirm("Tem certeza que deseja excluir este lançamento?")) return;
    try {
      const { error } = await supabase
        .from("lancamentos")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Lançamento excluído" });
      setLancamentos(lancamentos.filter((l) => l.id !== id));
    } catch (error: any) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const togglePago = async (lancamento: Lancamento) => {
    try {
      const novoStatus = !lancamento.pago;
      setLancamentos(
        lancamentos.map((l) =>
          l.id === lancamento.id ? { ...l, pago: novoStatus } : l
        )
      );
      const { error } = await supabase
        .from("lancamentos")
        .update({ pago: novoStatus })
        .eq("id", lancamento.id);
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      descricao: "",
      categoria:
        categoriasDB.length > 0 ? categoriasDB[0].nome : "Contas Fixas",
      tipo: "Despesa",
      valor: 0,
      forma_pagamento:
        formasPagamentoDB.length > 0 ? formasPagamentoDB[0].nome : "Pix",
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
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* HEADER DE AÇÕES */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Lançamentos</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Gerencie suas receitas e despesas
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* SELEÇÃO EM MASSA (BOTÃO DE EXCLUIR) */}
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="animate-in fade-in zoom-in duration-200"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir ({selectedIds.length})
            </Button>
          )}

          {/* DATE PICKER (SHADCN CALENDAR) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full sm:w-60 justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarLucide className="mr-2 h-4 w-4" />
                {date ? (
                  format(date, "MMMM 'de' yyyy", { locale: ptBR })
                ) : (
                  <span>Selecione o mês</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  if (newDate) setDate(newDate);
                }}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="flex items-center gap-2"
                onClick={() => resetForm()}
              >
                <Plus className="h-4 w-4" />
                <span>Novo</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Lançamento" : "Novo Lançamento"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(val: "Despesa" | "Receita") =>
                          setFormData({ ...formData, tipo: val })
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
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={formData.categoria}
                        onValueChange={(val) =>
                          setFormData({ ...formData, categoria: val })
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
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Valor</Label>
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Forma Pagamento</Label>
                      <Select
                        value={formData.forma_pagamento}
                        onValueChange={(val) =>
                          setFormData({ ...formData, forma_pagamento: val })
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
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pago"
                      checked={formData.pago}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, pago: checked as boolean })
                      }
                    />
                    <Label htmlFor="pago">Marcar como pago</Label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingId ? "Salvar" : "Adicionar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ÁREA DE FILTROS AVANÇADOS */}
      {showFilters && (
        <Card className="animate-in slide-in-from-top-2 duration-300">
          <CardHeader>
            <CardTitle className="text-base">Filtros Avançados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="Despesa">Despesas</SelectItem>
                    <SelectItem value="Receita">Receitas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={filtroCategoria}
                  onValueChange={setFiltroCategoria}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {categoriasDB.map((cat) => (
                      <SelectItem key={cat.id} value={cat.nome}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filtroPago} onValueChange={setFiltroPago}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pago">Pagos</SelectItem>
                    <SelectItem value="nao-pago">Não Pagos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BARRA DE SELEÇÃO GLOBAL (SELECIONAR TODOS) - NOVO LOCAL */}
      {lancamentosFiltrados.length > 0 && (
        <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all-main"
              checked={
                lancamentosFiltrados.length > 0 &&
                selectedIds.length === lancamentosFiltrados.length
              }
              onCheckedChange={handleSelectAll}
            />
            <Label
              htmlFor="select-all-main"
              className="cursor-pointer font-medium"
            >
              Selecionar Todos
            </Label>
          </div>
          <span className="text-xs text-muted-foreground">
            {selectedIds.length} selecionado(s)
          </span>
        </div>
      )}

      {/* LISTA DE LANÇAMENTOS */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : lancamentosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">
                Nenhum lançamento encontrado neste período
              </p>
            </CardContent>
          </Card>
        ) : (
          lancamentosFiltrados.map((lancamento) => (
            <Card
              key={lancamento.id}
              className={cn(
                "hover:bg-accent/50 transition-colors border-l-4",
                selectedIds.includes(lancamento.id)
                  ? "bg-accent border-primary"
                  : "border-transparent"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* CHECKBOX DE SELEÇÃO INDIVIDUAL */}
                  <div className="flex items-center h-full pt-1">
                    <Checkbox
                      checked={selectedIds.includes(lancamento.id)}
                      onCheckedChange={() => handleSelectOne(lancamento.id)}
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => togglePago(lancamento)}
                        className="mt-1"
                        title="Alterar status de pagamento"
                      >
                        {lancamento.pago ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {lancamento.descricao}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span
                            className={`rounded-full px-2 py-0.5 ${
                              lancamento.tipo === "Receita"
                                ? "bg-success/10 text-success"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {lancamento.tipo}
                          </span>
                          <span className="rounded-full bg-muted px-2 py-0.5">
                            {lancamento.categoria}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {lancamento.forma_pagamento}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {new Date(
                              lancamento.data_vencimento
                            ).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        {lancamento.observacoes && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {lancamento.observacoes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div
                      className={`text-right font-bold ${
                        lancamento.tipo === "Receita"
                          ? "text-success"
                          : "text-foreground"
                      }`}
                    >
                      {lancamento.tipo === "Receita" ? "+" : "-"}{" "}
                      {Number(lancamento.valor).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(lancamento)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(lancamento.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
