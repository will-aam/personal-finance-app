"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, CreditCard, CheckCircle, XCircle, Filter } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

// Tipos preparados para integração futura com Supabase
type Lancamento = {
  id: number
  descricao: string
  categoria: string
  tipo: "Despesa" | "Receita"
  valor: number
  formaPagamento: string
  diaVencimento: number
  pago: boolean
  observacoes?: string
}

// Dados de exemplo
const mockLancamentos: Lancamento[] = [
  {
    id: 1,
    descricao: "Salário",
    categoria: "Receita",
    tipo: "Receita",
    valor: 8500.0,
    formaPagamento: "Transferência",
    diaVencimento: 5,
    pago: true,
  },
  {
    id: 2,
    descricao: "Aluguel",
    categoria: "Contas Fixas",
    tipo: "Despesa",
    valor: 1800.0,
    formaPagamento: "Transferência",
    diaVencimento: 5,
    pago: false,
  },
  {
    id: 3,
    descricao: "Supermercado",
    categoria: "Despesas Variáveis",
    tipo: "Despesa",
    valor: 450.0,
    formaPagamento: "Cartão de Débito",
    diaVencimento: 15,
    pago: false,
  },
  {
    id: 4,
    descricao: "Netflix",
    categoria: "Lazer",
    tipo: "Despesa",
    valor: 55.9,
    formaPagamento: "Cartão de Crédito",
    diaVencimento: 20,
    pago: true,
  },
]

export default function Lancamentos() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(mockLancamentos)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>("todos")
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas")
  const [filtroPago, setFiltroPago] = useState<string>("todos")

  // Formulário
  const [formData, setFormData] = useState<Partial<Lancamento>>({
    descricao: "",
    categoria: "Contas Fixas",
    tipo: "Despesa",
    valor: 0,
    formaPagamento: "Pix",
    diaVencimento: 1,
    pago: false,
    observacoes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingId) {
      // Editar
      setLancamentos(lancamentos.map((l) => (l.id === editingId ? ({ ...formData, id: editingId } as Lancamento) : l)))
    } else {
      // Adicionar novo
      const novoLancamento: Lancamento = {
        ...formData,
        id: Math.max(...lancamentos.map((l) => l.id)) + 1,
      } as Lancamento
      setLancamentos([...lancamentos, novoLancamento])
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({
      descricao: "",
      categoria: "Contas Fixas",
      tipo: "Despesa",
      valor: 0,
      formaPagamento: "Pix",
      diaVencimento: 1,
      pago: false,
      observacoes: "",
    })
    setEditingId(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (lancamento: Lancamento) => {
    setFormData(lancamento)
    setEditingId(lancamento.id)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setLancamentos(lancamentos.filter((l) => l.id !== id))
  }

  const togglePago = (id: number) => {
    setLancamentos(lancamentos.map((l) => (l.id === id ? { ...l, pago: !l.pago } : l)))
  }

  // Aplicar filtros
  const lancamentosFiltrados = lancamentos
    .filter((l) => filtroTipo === "todos" || l.tipo === filtroTipo)
    .filter((l) => filtroCategoria === "todas" || l.categoria === filtroCategoria)
    .filter((l) => filtroPago === "todos" || (filtroPago === "pago" ? l.pago : !l.pago))
    .sort((a, b) => a.diaVencimento - b.diaVencimento)

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Lançamentos</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Gerencie suas receitas e despesas</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 flex-1 sm:flex-none"
          >
            <Filter className="h-4 w-4" />
            <span className="sm:inline">Filtros</span>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 flex-1 sm:flex-none" onClick={() => resetForm()}>
                <Plus className="h-4 w-4" />
                <span className="sm:inline">Novo</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Lançamento" : "Novo Lançamento"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase">Informações Básicas</h3>
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value: "Despesa" | "Receita") => setFormData({ ...formData, tipo: value })}
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
                        onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Contas Fixas">Contas Fixas</SelectItem>
                          <SelectItem value="Despesas Variáveis">Despesas Variáveis</SelectItem>
                          <SelectItem value="Lazer">Lazer</SelectItem>
                          <SelectItem value="Educação">Educação</SelectItem>
                          <SelectItem value="Investimentos">Investimentos</SelectItem>
                          <SelectItem value="Receita">Receita</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Pagamento */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase">Pagamento</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="valor">Valor (R$)</Label>
                      <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: Number.parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                      <Select
                        value={formData.formaPagamento}
                        onValueChange={(value) => setFormData({ ...formData, formaPagamento: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pix">Pix</SelectItem>
                          <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                          <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                          <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="Boleto">Boleto</SelectItem>
                          <SelectItem value="Transferência">Transferência</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Controle */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase">Controle</h3>
                  <div className="space-y-2">
                    <Label htmlFor="diaVencimento">Dia de Vencimento</Label>
                    <Input
                      id="diaVencimento"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.diaVencimento}
                      onChange={(e) => setFormData({ ...formData, diaVencimento: Number.parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pago"
                      checked={formData.pago}
                      onCheckedChange={(checked) => setFormData({ ...formData, pago: checked as boolean })}
                    />
                    <Label htmlFor="pago">Marcar como pago</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações (opcional)</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
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

      {/* Filtros */}
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
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="Contas Fixas">Contas Fixas</SelectItem>
                    <SelectItem value="Despesas Variáveis">Despesas Variáveis</SelectItem>
                    <SelectItem value="Lazer">Lazer</SelectItem>
                    <SelectItem value="Educação">Educação</SelectItem>
                    <SelectItem value="Receita">Receita</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
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

      {/* Lista de Lançamentos */}
      <div className="space-y-3">
        {lancamentosFiltrados.map((lancamento) => (
          <Card
            key={lancamento.id}
            className="hover:bg-accent/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start gap-3">
                    <button onClick={() => togglePago(lancamento.id)} className="mt-1">
                      {lancamento.pago ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1">
                      <h3 className="font-semibold">{lancamento.descricao}</h3>
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
                        <span className="rounded-full bg-muted px-2 py-0.5">{lancamento.categoria}</span>
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {lancamento.formaPagamento}
                        </span>
                        <span>Dia {lancamento.diaVencimento}</span>
                      </div>
                      {lancamento.observacoes && (
                        <p className="mt-2 text-sm text-muted-foreground">{lancamento.observacoes}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div
                    className={`text-right font-bold ${
                      lancamento.tipo === "Receita" ? "text-success" : "text-foreground"
                    }`}
                  >
                    {lancamento.tipo === "Receita" ? "+" : "-"} R${" "}
                    {lancamento.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(lancamento)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(lancamento.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {lancamentosFiltrados.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Nenhum lançamento encontrado</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
