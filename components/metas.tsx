"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Meta } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  TrendingUp,
  Pin,
  PinOff,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function Metas() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detalheMeta, setDetalheMeta] = useState<Meta | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();

  // Estado do Formulário
  const [formData, setFormData] = useState<Partial<Meta>>({
    nome: "",
    descricao: "",
    valor_total: 0,
    valor_depositado: 0,
    data_inicio: new Date().toISOString().split("T")[0],
    data_conclusao: "",
    tipo: "vista",
    parcelamentos: [],
    fixada: false,
  });

  // Estado para parcelas temporárias (apenas visual, simplificado)
  const [novoParcelamento, setNovoParcelamento] = useState({
    parcelas: 1,
    valorParcela: 0,
    parcelasPagas: 0,
  });

  // Buscar Metas
  const fetchMetas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("metas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMetas(data as unknown as Meta[]);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar metas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMetas();
  }, [fetchMetas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Preparar dados (converter strings vazias em null ou 0)
      const payload = {
        nome: formData.nome,
        descricao: formData.descricao,
        valor_total: formData.valor_total,
        valor_depositado: formData.valor_depositado || 0,
        data_inicio: formData.data_inicio,
        data_conclusao: formData.data_conclusao || null,
        tipo: formData.tipo,
        parcelamentos: formData.parcelamentos,
        fixada: formData.fixada,
      };

      if (editingId) {
        const { error } = await supabase
          .from("metas")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        toast({ title: "Meta atualizada!" });
      } else {
        const { error } = await supabase.from("metas").insert([payload]);
        if (error) throw error;
        toast({ title: "Meta criada!" });
      }

      resetForm();
      fetchMetas();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza?")) return;
    try {
      const { error } = await supabase.from("metas").delete().eq("id", id);
      if (error) throw error;

      setMetas(metas.filter((m) => m.id !== id));
      if (detalheMeta?.id === id) setDetalheMeta(null);
      toast({ title: "Meta removida" });
    } catch (error: any) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const toggleFixarMeta = async (id: number) => {
    try {
      // 1. Desfixar todas
      await supabase.from("metas").update({ fixada: false }).neq("id", 0);

      // 2. Fixar a selecionada (se não estava fixada antes)
      const metaAtual = metas.find((m) => m.id === id);
      if (!metaAtual?.fixada) {
        await supabase.from("metas").update({ fixada: true }).eq("id", id);
      }

      fetchMetas();
    } catch (error) {
      console.error(error);
    }
  };

  const adicionarDeposito = async (metaId: number, valor: number) => {
    try {
      const meta = metas.find((m) => m.id === metaId);
      if (!meta) return;

      const novoValor = Number(meta.valor_depositado) + valor;

      const { error } = await supabase
        .from("metas")
        .update({ valor_depositado: novoValor })
        .eq("id", metaId);

      if (error) throw error;

      toast({ title: "Depósito registrado!" });
      fetchMetas();

      // Atualiza modal se aberto
      if (detalheMeta && detalheMeta.id === metaId) {
        setDetalheMeta({ ...detalheMeta, valor_depositado: novoValor });
      }
    } catch (error) {
      toast({ title: "Erro no depósito", variant: "destructive" });
    }
  };

  // Helpers de formulário
  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      valor_total: 0,
      valor_depositado: 0,
      data_inicio: new Date().toISOString().split("T")[0],
      data_conclusao: "",
      tipo: "vista",
      parcelamentos: [],
      fixada: false,
    });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (meta: Meta) => {
    setFormData(meta);
    setEditingId(meta.id);
    setIsDialogOpen(true);
  };

  // Parcelamentos (Apenas lógica visual local, pois o banco usa JSONB)
  const adicionarParcelamento = () => {
    const novosParcelamentos = [
      ...(formData.parcelamentos || []),
      novoParcelamento,
    ];
    setFormData({ ...formData, parcelamentos: novosParcelamentos });
  };

  const removerParcelamento = (index: number) => {
    const novos = formData.parcelamentos?.filter((_, i) => i !== index);
    setFormData({ ...formData, parcelamentos: novos });
  };

  const calcularProgresso = (meta: Meta) => {
    if (!meta.valor_total) return 0;
    return Math.min((meta.valor_depositado / meta.valor_total) * 100, 100);
  };

  const calcularFalta = (meta: Meta) => {
    return Math.max(meta.valor_total - meta.valor_depositado, 0);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Metas Financeiras</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Planeje e acompanhe suas conquistas
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="flex items-center gap-2 w-full sm:w-auto"
              onClick={() => resetForm()}
            >
              <Plus className="h-4 w-4" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Meta" : "Nova Meta"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Meta</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    placeholder="Ex: Notebook novo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição (opcional)</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    rows={2}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="valorTotal">Valor Total (R$)</Label>
                    <Input
                      id="valorTotal"
                      type="number"
                      step="0.01"
                      value={formData.valor_total || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          valor_total: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valorDepositado">Já Depositado (R$)</Label>
                    <Input
                      id="valorDepositado"
                      type="number"
                      step="0.01"
                      value={formData.valor_depositado || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          valor_depositado: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dataInicio">Data de Início</Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      value={formData.data_inicio}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          data_inicio: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataConclusao">
                      Data Desejada (opcional)
                    </Label>
                    <Input
                      id="dataConclusao"
                      type="date"
                      value={formData.data_conclusao || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          data_conclusao: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Meta</Label>
                  <Tabs
                    value={formData.tipo}
                    onValueChange={(value: string) =>
                      setFormData({
                        ...formData,
                        tipo: value as "vista" | "parcelado",
                      })
                    }
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="vista">À Vista</TabsTrigger>
                      <TabsTrigger value="parcelado">Parcelado</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Área de Parcelamento Simplificada */}
                {formData.tipo === "parcelado" && (
                  <div className="rounded-lg border p-4 bg-accent/50">
                    <p className="text-sm text-muted-foreground mb-2">
                      Simulação de parcelas
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Qtd Parcelas"
                        type="number"
                        value={novoParcelamento.parcelas}
                        onChange={(e) =>
                          setNovoParcelamento({
                            ...novoParcelamento,
                            parcelas: Number(e.target.value),
                          })
                        }
                      />
                      <Input
                        placeholder="Valor"
                        type="number"
                        value={novoParcelamento.valorParcela}
                        onChange={(e) =>
                          setNovoParcelamento({
                            ...novoParcelamento,
                            valorParcela: Number(e.target.value),
                          })
                        }
                      />
                      <Button
                        type="button"
                        onClick={adicionarParcelamento}
                        variant="secondary"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 space-y-1">
                      {formData.parcelamentos?.map((p: any, i: number) => (
                        <div
                          key={i}
                          className="flex justify-between text-xs bg-background p-2 rounded border"
                        >
                          <span>
                            {p.parcelas}x de R$ {p.valorParcela}
                          </span>
                          <Trash2
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removerParcelamento(i)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingId ? "Salvar Alterações" : "Criar Meta"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modal de Detalhe */}
      {detalheMeta && (
        <Dialog open={!!detalheMeta} onOpenChange={() => setDetalheMeta(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{detalheMeta.nome}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {detalheMeta.descricao && (
                <p className="text-muted-foreground">{detalheMeta.descricao}</p>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span className="font-medium">
                    {calcularProgresso(detalheMeta).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={calcularProgresso(detalheMeta)}
                  className="h-3"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-bold">
                      R${" "}
                      {Number(detalheMeta.valor_total).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground">Depositado</p>
                    <p className="font-bold text-success">
                      R${" "}
                      {Number(detalheMeta.valor_depositado).toLocaleString(
                        "pt-BR",
                        { minimumFractionDigits: 2 }
                      )}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm text-muted-foreground">Falta</p>
                    <p className="font-bold text-destructive">
                      R${" "}
                      {calcularFalta(detalheMeta).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <Label>Adicionar Depósito</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Valor"
                    id="deposito-input"
                  />
                  <Button
                    onClick={() => {
                      const el = document.getElementById(
                        "deposito-input"
                      ) as HTMLInputElement;
                      if (el.value) {
                        adicionarDeposito(detalheMeta.id, Number(el.value));
                        el.value = "";
                      }
                    }}
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Lista */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin mx-auto col-span-full" />
        ) : (
          metas.map((meta) => (
            <Card
              key={meta.id}
              className="hover:bg-accent/50 transition-all duration-200 relative cursor-pointer"
              onClick={() => setDetalheMeta(meta)}
            >
              {meta.fixada && (
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1.5">
                  <Pin className="h-3 w-3" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between pr-8">
                  <span className="text-lg text-balance">{meta.nome}</span>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-semibold">
                      {calcularProgresso(meta).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={calcularProgresso(meta)} className="h-3" />
                </div>
                <div className="flex justify-between items-baseline pt-2">
                  <p className="text-xs text-muted-foreground">
                    Falta:{" "}
                    <span className="font-bold text-primary">
                      R${" "}
                      {calcularFalta(meta).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </p>
                </div>
                <div
                  className="flex gap-2 pt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant={meta.fixada ? "default" : "outline"}
                    onClick={() => toggleFixarMeta(meta.id)}
                    className="flex-1"
                  >
                    {meta.fixada ? (
                      <PinOff className="h-4 w-4" />
                    ) : (
                      <Pin className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(meta)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(meta.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {!loading && metas.length === 0 && (
        <div className="text-center text-muted-foreground py-10">
          Nenhuma meta criada.
        </div>
      )}
    </div>
  );
}
