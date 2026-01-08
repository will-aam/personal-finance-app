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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
  Search,
  ChevronDown,
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

  // --- FILTROS (ARRAYS PARA MULTI-SELEÇÃO) ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filtrosTipo, setFiltrosTipo] = useState<string[]>([]);
  const [filtrosCategoria, setFiltrosCategoria] = useState<string[]>([]);
  const [filtrosPagamento, setFiltrosPagamento] = useState<string[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string | null>(null);

  // Estado de data
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [filtroMes, setFiltroMes] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // Form State
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

  // Atualiza Mês
  useEffect(() => {
    if (date) {
      const ano = date.getFullYear();
      const mes = String(date.getMonth() + 1).padStart(2, "0");
      setFiltroMes(`${ano}-${mes}`);
    }
  }, [date]);

  // Carregar Opções
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
    } catch (error) {
      console.error("Erro ao carregar opções", error);
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  // Carregar Lançamentos
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

  // --- LÓGICA DE FILTRAGEM ---
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

  // --- SELEÇÃO EM MASSA ---
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
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  // --- CRUD ---
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
    if (!confirm("Excluir este lançamento?")) return;
    try {
      const { error } = await supabase
        .from("lancamentos")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setLancamentos(lancamentos.filter((l) => l.id !== id));
      toast({ title: "Excluído com sucesso" });
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
      await supabase
        .from("lancamentos")
        .update({ pago: novoStatus })
        .eq("id", lancamento.id);
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
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

  // Componente Auxiliar para Pílula de Filtro
  const FilterPill = ({
    label,
    isActive,
    count,
    onClick,
  }: {
    label: string;
    isActive: boolean;
    count?: number;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap select-none",
        isActive
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background hover:bg-accent text-muted-foreground"
      )}
    >
      {label}
      {/* Verifica estritamente se count existe e é maior que 0 */}
      {typeof count === "number" && count > 0 && (
        <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-background/20 text-[10px]">
          {count}
        </span>
      )}
      <ChevronDown className="h-3 w-3 opacity-50" />
    </button>
  );

  return (
    // Adicionei overflow-x-hidden para evitar rolagem horizontal da página
    <div className="space-y-4 p-4 md:p-6 max-w-5xl mx-auto pb-24 overflow-x-hidden w-full">
      {/* --- TOPO FIXO: TÍTULO, DATA, NOVO --- */}
      {/* Ajustei margens e flex para mobile */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sticky top-0 z-10 bg-background/95 backdrop-blur-md py-2 -mx-4 px-4 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lançamentos</h1>
        </div>

        {/* Container dos botões superiores */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* CALENDÁRIO: Usa flex-1 para ocupar espaço disponível sem estourar */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "flex-1 sm:flex-none sm:w-48 justify-start text-left font-normal truncate",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarLucide className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">
                  {date ? format(date, "MMMM yyyy", { locale: ptBR }) : "Mês"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          {/* BOTÃO NOVO: Mantém tamanho fixo (shrink-0) para não ser esmagado */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => resetForm()}
                size="icon"
                className="shrink-0"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar" : "Novo"} Lançamento
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                      required
                    />
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
                <Button type="submit" className="w-full">
                  Salvar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* --- BARRA DE COMANDOS --- */}
      <div className="flex flex-col gap-3">
        {/* Linha 1: Toggle Select All & Botão Delete */}
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
              <Trash2 className="h-3 w-3 mr-2" />
              Excluir ({selectedIds.length})
            </Button>
          )}
        </div>

        {/* Linha 2: Barra de Pesquisa */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar lançamentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/30"
          />
        </div>

        {/* Linha 3: FILTROS SCROLLÁVEIS (PÍLULAS) */}
        {/* Adicionei classes para esconder a scrollbar no Chrome/Safari e Firefox */}
        <ScrollArea className="w-full whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex w-max space-x-2 pb-2">
            {/* Sheet TIPO */}
            <Sheet>
              <SheetTrigger asChild>
                <div>
                  <FilterPill
                    label="Tipo"
                    isActive={filtrosTipo.length > 0}
                    count={filtrosTipo.length}
                    onClick={() => {}}
                  />
                </div>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="rounded-t-xl h-auto max-h-[80vh]"
              >
                <SheetHeader className="mb-4">
                  <SheetTitle>Filtrar por Tipo</SheetTitle>
                </SheetHeader>
                <div className="flex flex-wrap gap-2">
                  {["Despesa", "Receita"].map((tipo) => {
                    const isSelected = filtrosTipo.includes(tipo);
                    return (
                      <Badge
                        key={tipo}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2 text-sm"
                        onClick={() => {
                          setFiltrosTipo((prev) =>
                            isSelected
                              ? prev.filter((i) => i !== tipo)
                              : [...prev, tipo]
                          );
                        }}
                      >
                        {tipo}
                      </Badge>
                    );
                  })}
                </div>
                <SheetFooter className="mt-6 flex-row gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setFiltrosTipo([])}
                  >
                    Limpar
                  </Button>
                  <SheetClose asChild>
                    <Button className="flex-1">Aplicar</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* Sheet CATEGORIA */}
            <Sheet>
              <SheetTrigger asChild>
                <div>
                  <FilterPill
                    label="Categoria"
                    isActive={filtrosCategoria.length > 0}
                    count={filtrosCategoria.length}
                    onClick={() => {}}
                  />
                </div>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="rounded-t-xl h-auto max-h-[80vh] overflow-y-auto"
              >
                <SheetHeader className="mb-4">
                  <SheetTitle>Categorias</SheetTitle>
                </SheetHeader>
                <div className="flex flex-wrap gap-2">
                  {categoriasDB.map((cat) => {
                    const isSelected = filtrosCategoria.includes(cat.nome);
                    return (
                      <Badge
                        key={cat.id}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2 text-sm"
                        onClick={() => {
                          setFiltrosCategoria((prev) =>
                            isSelected
                              ? prev.filter((i) => i !== cat.nome)
                              : [...prev, cat.nome]
                          );
                        }}
                      >
                        {cat.nome}
                      </Badge>
                    );
                  })}
                </div>
                <SheetFooter className="mt-6 flex-row gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setFiltrosCategoria([])}
                  >
                    Limpar
                  </Button>
                  <SheetClose asChild>
                    <Button className="flex-1">Aplicar</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* Sheet PAGAMENTO */}
            <Sheet>
              <SheetTrigger asChild>
                <div>
                  <FilterPill
                    label="Pagamento"
                    isActive={filtrosPagamento.length > 0}
                    count={filtrosPagamento.length}
                    onClick={() => {}}
                  />
                </div>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="rounded-t-xl h-auto max-h-[80vh]"
              >
                <SheetHeader className="mb-4">
                  <SheetTitle>Forma de Pagamento</SheetTitle>
                </SheetHeader>
                <div className="flex flex-wrap gap-2">
                  {formasPagamentoDB.map((fp) => {
                    const isSelected = filtrosPagamento.includes(fp.nome);
                    return (
                      <Badge
                        key={fp.id}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2 text-sm"
                        onClick={() => {
                          setFiltrosPagamento((prev) =>
                            isSelected
                              ? prev.filter((i) => i !== fp.nome)
                              : [...prev, fp.nome]
                          );
                        }}
                      >
                        {fp.nome}
                      </Badge>
                    );
                  })}
                </div>
                <SheetFooter className="mt-6 flex-row gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setFiltrosPagamento([])}
                  >
                    Limpar
                  </Button>
                  <SheetClose asChild>
                    <Button className="flex-1">Aplicar</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* Sheet STATUS */}
            <Sheet>
              <SheetTrigger asChild>
                <div>
                  <FilterPill
                    label="Status"
                    isActive={!!filtroStatus}
                    onClick={() => {}}
                  />
                </div>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-xl h-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle>Status do Lançamento</SheetTitle>
                </SheetHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={filtroStatus === "pago" ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 text-sm"
                    onClick={() =>
                      setFiltroStatus((prev) =>
                        prev === "pago" ? null : "pago"
                      )
                    }
                  >
                    Pago / Realizado
                  </Badge>
                  <Badge
                    variant={
                      filtroStatus === "pendente" ? "default" : "outline"
                    }
                    className="cursor-pointer px-4 py-2 text-sm"
                    onClick={() =>
                      setFiltroStatus((prev) =>
                        prev === "pendente" ? null : "pendente"
                      )
                    }
                  >
                    Pendente
                  </Badge>
                </div>
                <SheetFooter className="mt-6 flex-row gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setFiltroStatus(null)}
                  >
                    Limpar
                  </Button>
                  <SheetClose asChild>
                    <Button className="flex-1">Aplicar</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
          {/* Removi o componente ScrollBar para não aparecer visualmente */}
        </ScrollArea>
      </div>

      {/* --- LISTA --- */}
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
                Nenhum lançamento encontrado com estes filtros.
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
            <Card
              key={lancamento.id}
              className={cn(
                "transition-all border-l-4 hover:shadow-sm",
                selectedIds.includes(lancamento.id)
                  ? "bg-accent/50 border-primary shadow-sm"
                  : "border-transparent"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <button onClick={() => togglePago(lancamento)}>
                        {lancamento.pago ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground/50" />
                        )}
                      </button>
                      <h3 className="font-semibold leading-none">
                        {lancamento.descricao}
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pl-7">
                      <span
                        className={cn(
                          "font-medium",
                          lancamento.tipo === "Receita"
                            ? "text-green-600"
                            : "text-red-500"
                        )}
                      >
                        {lancamento.tipo}
                      </span>
                      <span>•</span>
                      <span>{lancamento.categoria}</span>
                      <span>•</span>
                      <span>
                        {new Date(
                          lancamento.data_vencimento
                        ).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div
                      className={cn(
                        "font-bold text-sm",
                        lancamento.tipo === "Receita" ? "text-green-600" : ""
                      )}
                    >
                      {lancamento.tipo === "Receita" ? "+" : "-"}
                      {Number(lancamento.valor).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </div>

                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleEdit(lancamento)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-red-400 hover:text-red-500"
                        onClick={() => handleDelete(lancamento.id)}
                      >
                        <Trash2 className="h-3 w-3" />
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
