"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, TrendingUp, Pin, PinOff } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Tipos preparados para integração futura com Supabase
type Meta = {
  id: number
  nome: string
  descricao?: string
  valorTotal: number
  valorDepositado: number
  dataInicio: string
  dataConclusao?: string
  tipo: "vista" | "parcelado"
  parcelamentos?: Parcelamento[]
  fixada?: boolean
}

type Parcelamento = {
  parcelas: number
  valorParcela: number
  parcelasPagas: number
}

// Dados de exemplo
const mockMetas: Meta[] = [
  {
    id: 1,
    nome: "Notebook novo",
    descricao: "Dell XPS 15 para trabalho",
    valorTotal: 5399.0,
    valorDepositado: 1000.0,
    dataInicio: "2025-01-01",
    dataConclusao: "2025-06-30",
    tipo: "parcelado",
    fixada: true,
    parcelamentos: [
      { parcelas: 12, valorParcela: 449.92, parcelasPagas: 2 },
      { parcelas: 8, valorParcela: 674.88, parcelasPagas: 0 },
    ],
  },
  {
    id: 2,
    nome: "Viagem para o Nordeste",
    descricao: "Férias em julho",
    valorTotal: 3500.0,
    valorDepositado: 800.0,
    dataInicio: "2025-01-15",
    dataConclusao: "2025-07-01",
    tipo: "vista",
    fixada: false,
  },
]

export default function Metas() {
  const [metas, setMetas] = useState<Meta[]>(mockMetas)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [detalheMeta, setDetalheMeta] = useState<Meta | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [formData, setFormData] = useState<Partial<Meta>>({
    nome: "",
    descricao: "",
    valorTotal: 0,
    valorDepositado: 0,
    dataInicio: new Date().toISOString().split("T")[0],
    dataConclusao: "",
    tipo: "vista",
    parcelamentos: [],
  })

  const [novoParcelamento, setNovoParcelamento] = useState({
    parcelas: 1,
    valorParcela: 0,
    parcelasPagas: 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingId) {
      setMetas(metas.map((m) => (m.id === editingId ? ({ ...formData, id: editingId } as Meta) : m)))
    } else {
      const novaMeta: Meta = {
        ...formData,
        id: Math.max(...metas.map((m) => m.id), 0) + 1,
      } as Meta
      setMetas([...metas, novaMeta])
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      valorTotal: 0,
      valorDepositado: 0,
      dataInicio: new Date().toISOString().split("T")[0],
      dataConclusao: "",
      tipo: "vista",
      parcelamentos: [],
    })
    setEditingId(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (meta: Meta) => {
    setFormData(meta)
    setEditingId(meta.id)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setMetas(metas.filter((m) => m.id !== id))
    if (detalheMeta?.id === id) {
      setDetalheMeta(null)
    }
  }

  const adicionarParcelamento = () => {
    setFormData({
      ...formData,
      parcelamentos: [...(formData.parcelamentos || []), novoParcelamento],
    })
    setNovoParcelamento({ parcelas: 1, valorParcela: 0, parcelasPagas: 0 })
  }

  const removerParcelamento = (index: number) => {
    setFormData({
      ...formData,
      parcelamentos: formData.parcelamentos?.filter((_, i) => i !== index),
    })
  }

  const adicionarDeposito = (metaId: number, valor: number) => {
    setMetas(metas.map((m) => (m.id === metaId ? { ...m, valorDepositado: m.valorDepositado + valor } : m)))
    if (detalheMeta?.id === metaId) {
      setDetalheMeta({
        ...detalheMeta,
        valorDepositado: detalheMeta.valorDepositado + valor,
      })
    }
  }

  const calcularProgresso = (meta: Meta) => {
    return (meta.valorDepositado / meta.valorTotal) * 100
  }

  const calcularFalta = (meta: Meta) => {
    return meta.valorTotal - meta.valorDepositado
  }

  const toggleFixarMeta = (id: number) => {
    setMetas(
      metas.map((m) => {
        if (m.id === id) {
          return { ...m, fixada: !m.fixada }
        }
        // Apenas uma meta pode ser fixada por vez
        return { ...m, fixada: false }
      }),
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Metas Financeiras</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Planeje e acompanhe suas conquistas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 w-full sm:w-auto" onClick={() => resetForm()}>
              <Plus className="h-4 w-4" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Meta" : "Nova Meta"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Meta</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Notebook novo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição (opcional)</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Adicione detalhes sobre sua meta"
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
                      value={formData.valorTotal}
                      onChange={(e) => setFormData({ ...formData, valorTotal: Number.parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valorDepositado">Já Depositado (R$)</Label>
                    <Input
                      id="valorDepositado"
                      type="number"
                      step="0.01"
                      value={formData.valorDepositado}
                      onChange={(e) =>
                        setFormData({ ...formData, valorDepositado: Number.parseFloat(e.target.value) || 0 })
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
                      value={formData.dataInicio}
                      onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataConclusao">Data Desejada (opcional)</Label>
                    <Input
                      id="dataConclusao"
                      type="date"
                      value={formData.dataConclusao}
                      onChange={(e) => setFormData({ ...formData, dataConclusao: e.target.value })}
                    />
                  </div>
                </div>

                {/* Tipo de meta */}
                <div className="space-y-2">
                  <Label>Tipo de Meta</Label>
                  <Tabs
                    value={formData.tipo}
                    onValueChange={(value: "vista" | "parcelado") => setFormData({ ...formData, tipo: value })}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="vista">À Vista</TabsTrigger>
                      <TabsTrigger value="parcelado">Parcelado</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Parcelamentos */}
                {formData.tipo === "parcelado" && (
                  <div className="space-y-4 rounded-lg border p-4">
                    <h3 className="font-semibold text-sm">Simulações de Parcelamento</h3>

                    {formData.parcelamentos && formData.parcelamentos.length > 0 && (
                      <div className="space-y-2">
                        {formData.parcelamentos.map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg bg-accent p-3">
                            <div className="text-sm">
                              <div className="font-medium">
                                {p.parcelas}x de R$ {p.valorParcela.toFixed(2)}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {p.parcelasPagas} pagas · Total: R$ {(p.parcelas * p.valorParcela).toFixed(2)}
                              </div>
                            </div>
                            <Button type="button" size="icon" variant="ghost" onClick={() => removerParcelamento(idx)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="grid gap-2 grid-cols-3">
                        <div>
                          <Label className="text-xs">Parcelas</Label>
                          <Input
                            type="number"
                            min="1"
                            value={novoParcelamento.parcelas}
                            onChange={(e) =>
                              setNovoParcelamento({
                                ...novoParcelamento,
                                parcelas: Number.parseInt(e.target.value) || 1,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Valor</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={novoParcelamento.valorParcela}
                            onChange={(e) =>
                              setNovoParcelamento({
                                ...novoParcelamento,
                                valorParcela: Number.parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Pagas</Label>
                          <Input
                            type="number"
                            min="0"
                            value={novoParcelamento.parcelasPagas}
                            onChange={(e) =>
                              setNovoParcelamento({
                                ...novoParcelamento,
                                parcelasPagas: Number.parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={adicionarParcelamento}
                        className="w-full bg-transparent"
                      >
                        Adicionar Opção
                      </Button>
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

      {/* Modal de Detalhe da Meta */}
      {detalheMeta && (
        <Dialog open={!!detalheMeta} onOpenChange={() => setDetalheMeta(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{detalheMeta.nome}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {detalheMeta.descricao && <p className="text-muted-foreground">{detalheMeta.descricao}</p>}

              {/* Progresso */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span className="font-medium">{calcularProgresso(detalheMeta).toFixed(1)}%</span>
                </div>
                <Progress value={calcularProgresso(detalheMeta)} className="h-3" />
              </div>

              {/* Valores */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                      <p className="text-xl font-bold">
                        R$ {detalheMeta.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Já Depositado</p>
                      <p className="text-xl font-bold text-success">
                        R$ {detalheMeta.valorDepositado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Falta</p>
                      <p className="text-xl font-bold text-primary">
                        R$ {calcularFalta(detalheMeta).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Adicionar Depósito */}
              <div className="space-y-2">
                <Label>Adicionar Depósito</Label>
                <div className="flex gap-2">
                  <Input type="number" step="0.01" placeholder="Valor depositado" id="deposito-input" />
                  <Button
                    onClick={() => {
                      const input = document.getElementById("deposito-input") as HTMLInputElement
                      const valor = Number.parseFloat(input.value) || 0
                      if (valor > 0) {
                        adicionarDeposito(detalheMeta.id, valor)
                        input.value = ""
                      }
                    }}
                  >
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Simulações de Parcelamento */}
              {detalheMeta.tipo === "parcelado" && detalheMeta.parcelamentos && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Simulações de Parcelamento</h3>
                  {detalheMeta.parcelamentos.map((p, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="font-semibold text-lg">
                              {p.parcelas}x de R$ {p.valorParcela.toFixed(2)}
                            </span>
                            <span className="text-muted-foreground">
                              Total: R$ {(p.parcelas * p.valorParcela).toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>Parcelas pagas</span>
                              <span className="font-medium">
                                {p.parcelasPagas}/{p.parcelas}
                              </span>
                            </div>
                            <Progress value={(p.parcelasPagas / p.parcelas) * 100} />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Faltam {p.parcelas - p.parcelasPagas} parcelas · R${" "}
                            {((p.parcelas - p.parcelasPagas) * p.valorParcela).toFixed(2)} restantes
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Datas */}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Início: {new Date(detalheMeta.dataInicio).toLocaleDateString("pt-BR")}</span>
                {detalheMeta.dataConclusao && (
                  <span>Meta: {new Date(detalheMeta.dataConclusao).toLocaleDateString("pt-BR")}</span>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Lista de Metas */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metas.map((meta) => (
          <Card key={meta.id} className="hover:bg-accent/50 transition-all duration-200 relative">
            {meta.fixada && (
              <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1.5">
                <Pin className="h-3 w-3" />
              </div>
            )}
            <CardHeader className="cursor-pointer" onClick={() => setDetalheMeta(meta)}>
              <CardTitle className="flex items-center justify-between pr-8">
                <span className="text-lg text-balance">{meta.nome}</span>
                <TrendingUp className="h-5 w-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="cursor-pointer" onClick={() => setDetalheMeta(meta)}>
                {meta.descricao && <p className="text-sm text-muted-foreground line-clamp-2">{meta.descricao}</p>}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-semibold">{calcularProgresso(meta).toFixed(1)}%</span>
                  </div>
                  <Progress value={calcularProgresso(meta)} className="h-3" />
                </div>

                <div className="flex justify-between items-baseline pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Depositado</p>
                    <p className="font-bold text-success">
                      R$ {meta.valorDepositado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Falta</p>
                    <p className="font-bold text-primary">
                      R$ {calcularFalta(meta).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant={meta.fixada ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFixarMeta(meta.id)
                  }}
                  className="flex-1"
                >
                  {meta.fixada ? (
                    <>
                      <PinOff className="h-4 w-4 mr-1" />
                      Fixada
                    </>
                  ) : (
                    <>
                      <Pin className="h-4 w-4 mr-1" />
                      Fixar
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEdit(meta)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(meta.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {metas.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhuma meta cadastrada ainda.
              <br />
              Clique em "Nova Meta" para começar!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
