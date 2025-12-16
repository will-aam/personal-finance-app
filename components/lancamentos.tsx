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
  Plus,
  Pencil,
  Trash2,
  CreditCard,
  CheckCircle,
  XCircle,
  Filter,
  Loader2,
  CalendarIcon,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function Lancamentos() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  // Estados para categorias e formas de pagamento do banco
  const [categoriasDB, setCategoriasDB] = useState<
    { id: number; nome: string }[]
  >([]);
  const [formasPagamentoDB, setFormasPagamentoDB] = useState<
    { id: number; nome: string }[]
  >([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroPago, setFiltroPago] = useState<string>("todos");
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

  // Função para buscar categorias e formas de pagamento
  const fetchOpcoes = useCallback(async () => {
    try {
      setLoadingOptions(true);

      // Buscar categorias
      const { data: catData, error: catError } = await supabase
        .from("categorias")
        .select("*")
        .order("nome");

      if (catError) throw catError;
      if (catData) setCategoriasDB(catData);

      // Buscar formas de pagamento
      const { data: payData, error: payError } = await supabase
        .from("formas_pagamento")
        .select("*")
        .order("nome");

      if (payError) throw payError;
      if (payData) setFormasPagamentoDB(payData);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar opções",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingOptions(false);
    }
  }, [toast]);

  const fetchLancamentos = useCallback(async () => {
    try {
      setLoading(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const { error } = await supabase
          .from("lancamentos")
          .update({
            descricao: formData.descricao,
            categoria: formData.categoria,
            tipo: formData.tipo,
            valor: formData.valor,
            forma_pagamento: formData.forma_pagamento,
            data_vencimento: formData.data_vencimento,
            pago: formData.pago,
            observacoes: formData.observacoes,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast({ title: "Lançamento atualizado!" });
      } else {
        const { error } = await supabase.from("lancamentos").insert([
          {
            descricao: formData.descricao,
            categoria: formData.categoria,
            tipo: formData.tipo,
            valor: formData.valor,
            forma_pagamento: formData.forma_pagamento,
            data_vencimento: formData.data_vencimento,
            pago: formData.pago,
            observacoes: formData.observacoes,
          },
        ]);

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
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
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

      if (error) {
        setLancamentos(
          lancamentos.map((l) =>
            l.id === lancamento.id ? { ...l, pago: !novoStatus } : l
          )
        );
        throw error;
      }
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
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

  const lancamentosFiltrados = lancamentos
    .filter((l) => filtroTipo === "todos" || l.tipo === filtroTipo)
    .filter(
      (l) => filtroCategoria === "todas" || l.categoria === filtroCategoria
    )
    .filter(
      (l) =>
        filtroPago === "todos" || (filtroPago === "pago" ? l.pago : !l.pago)
    );

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Lançamentos</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Gerencie suas receitas e despesas
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="month"
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="w-full sm:w-auto"
          />
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
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
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                    Informações Básicas
                  </h3>
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
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, tipo: value })
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
                      <Label htmlFor="categoria">Categoria</Label>
                      <Select
                        value={formData.categoria}
                        onValueChange={(value) =>
                          setFormData({ ...formData, categoria: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingOptions ? (
                            <SelectItem value="loading" disabled>
                              Carregando...
                            </SelectItem>
                          ) : categoriasDB.length === 0 ? (
                            <SelectItem value="padrao" disabled>
                              Nenhuma categoria cadastrada
                            </SelectItem>
                          ) : (
                            categoriasDB.map((cat) => (
                              <SelectItem key={cat.id} value={cat.nome}>
                                {cat.nome}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                    Pagamento
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="valor">Valor (R$)</Label>
                      <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        value={formData.valor || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setFormData({
                            ...formData,
                            valor: isNaN(val) ? 0 : val,
                          });
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                      <Select
                        value={formData.forma_pagamento}
                        onValueChange={(value) =>
                          setFormData({ ...formData, forma_pagamento: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingOptions ? (
                            <SelectItem value="loading" disabled>
                              Carregando...
                            </SelectItem>
                          ) : formasPagamentoDB.length === 0 ? (
                            <SelectItem value="padrao" disabled>
                              Nenhuma forma de pagamento cadastrada
                            </SelectItem>
                          ) : (
                            formasPagamentoDB.map((fp) => (
                              <SelectItem key={fp.id} value={fp.nome}>
                                {fp.nome}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                    Controle
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                    <Input
                      id="dataVencimento"
                      type="date"
                      value={formData.data_vencimento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          data_vencimento: e.target.value,
                        })
                      }
                      required
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
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações (opcional)</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          observacoes: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingId ? "Salvar Alterações" : "Adicionar Lançamento"}
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

      {showFilters && (
        <Card className="animate-in slide-in-from-top-2 duration-300">
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
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
              className="hover:bg-accent/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
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
