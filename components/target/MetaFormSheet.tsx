"use client";

import type React from "react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Meta } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch"; // Importe o componente Switch
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, Trash2 } from "lucide-react";

interface MetaFormSheetProps {
  metaToEdit: Meta | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function MetaFormSheet({
  metaToEdit,
  onClose,
  onSuccess,
}: MetaFormSheetProps) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(
    metaToEdit?.id || null
  );

  // Atualize o estado inicial para incluir os novos campos de automação
  const [formData, setFormData] = useState<Partial<Meta>>({
    nome: metaToEdit?.nome || "",
    link: metaToEdit?.link || "",
    descricao: metaToEdit?.descricao || "",
    valor_total: metaToEdit?.valor_total || 0,
    valor_depositado: metaToEdit?.valor_depositado || 0,
    data_inicio:
      metaToEdit?.data_inicio || new Date().toISOString().split("T")[0],
    data_conclusao: metaToEdit?.data_conclusao || "",
    tipo: metaToEdit?.tipo || "vista",
    parcelamentos: metaToEdit?.parcelamentos || [],
    fixada: metaToEdit?.fixada || false,

    // Novos campos para o Depósito Automático Simulado
    auto_deposito_ativo: metaToEdit?.auto_deposito_ativo || false,
    auto_valor: metaToEdit?.auto_valor || 0,
    auto_dia_cobranca: metaToEdit?.auto_dia_cobranca || 15,
    auto_data_inicio:
      metaToEdit?.auto_data_inicio || new Date().toISOString().split("T")[0],
    auto_meses_duracao: metaToEdit?.auto_meses_duracao || 0,
  });

  const [novoParcelamento, setNovoParcelamento] = useState({
    parcelas: 1,
    valorParcela: 0,
    parcelasPagas: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        nome: formData.nome,
        link: formData.link,
        descricao: formData.descricao,
        valor_total: formData.valor_total,
        valor_depositado: formData.valor_depositado || 0,
        data_inicio: formData.data_inicio,
        data_conclusao: formData.data_conclusao || null,
        tipo: formData.tipo,
        parcelamentos: formData.parcelamentos,
        fixada: formData.fixada,

        // Novos campos no payload
        auto_deposito_ativo: formData.auto_deposito_ativo,
        auto_valor: formData.auto_valor,
        auto_dia_cobranca: formData.auto_dia_cobranca,
        auto_data_inicio: formData.auto_data_inicio,
        auto_meses_duracao: formData.auto_meses_duracao,
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

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editingId ? "Editar Meta" : "Nova Meta"}</SheetTitle>
          <SheetDescription>
            Defina os detalhes do seu objetivo financeiro.
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-6 py-6 px-4 sm:px-6 max-w-lg mx-auto"
        >
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
              <Label htmlFor="link">Link do Produto (opcional)</Label>
              <Input
                id="link"
                type="url"
                value={formData.link || ""}
                onChange={(e) =>
                  setFormData({ ...formData, link: e.target.value })
                }
                placeholder="https://exemplo.com/produto"
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
                    setFormData({ ...formData, data_inicio: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataConclusao">Data Desejada (opcional)</Label>
                <Input
                  id="dataConclusao"
                  type="date"
                  value={formData.data_conclusao || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, data_conclusao: e.target.value })
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

            {/* NOVA SEÇÃO: Depósito Automático Simulado */}
            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">
                    Depósito Automático (Simulação)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Adiciona valor automaticamente todo mês
                  </p>
                </div>
                <Switch
                  checked={formData.auto_deposito_ativo}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, auto_deposito_ativo: checked })
                  }
                />
              </div>
              {formData.auto_deposito_ativo && (
                <div className="grid gap-4 md:grid-cols-2 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="autoValor">Valor Mensal (R$)</Label>
                    <Input
                      id="autoValor"
                      type="number"
                      step="0.01"
                      value={formData.auto_valor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          auto_valor: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="autoDia">Dia do Depósito</Label>
                    <Input
                      id="autoDia"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Ex: 15"
                      value={formData.auto_dia_cobranca}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          auto_dia_cobranca: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="autoInicio">Iniciar em</Label>
                    <Input
                      id="autoInicio"
                      type="date"
                      value={formData.auto_data_inicio}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          auto_data_inicio: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="autoMeses">Duração (Meses)</Label>
                    <Input
                      id="autoMeses"
                      type="number"
                      placeholder="0 para indeterminado"
                      value={formData.auto_meses_duracao || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          auto_meses_duracao: Number(e.target.value),
                        })
                      }
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Deixe vazio para infinito
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <SheetFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingId ? "Salvar Alterações" : "Criar Meta"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
