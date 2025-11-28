"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Target,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

// Dados de exemplo - preparados para futura integração com Supabase
const mockData = {
  receitas: 8500.0,
  despesas: 5320.5,
  proximosVencimentos: [
    {
      id: 1,
      descricao: "Aluguel",
      dia: 5,
      valor: 1800.0,
      formaPagamento: "Transferência",
      pago: false,
      atrasado: true,
    },
    { id: 2, descricao: "Internet", dia: 10, valor: 99.9, formaPagamento: "Boleto", pago: false, atrasado: false },
    {
      id: 3,
      descricao: "Spotify",
      dia: 12,
      valor: 19.9,
      formaPagamento: "Cartão de Crédito",
      pago: true,
      atrasado: false,
    },
    {
      id: 4,
      descricao: "Supermercado",
      dia: 15,
      valor: 450.0,
      formaPagamento: "Cartão de Débito",
      pago: false,
      atrasado: false,
    },
    { id: 5, descricao: "Academia", dia: 20, valor: 129.9, formaPagamento: "Pix", pago: true, atrasado: false },
  ],
  categorias: [
    { name: "Contas Fixas", value: 2500, fill: "hsl(var(--chart-1))" },
    { name: "Despesas Variáveis", value: 1200, fill: "hsl(var(--chart-2))" },
    { name: "Lazer", value: 800, fill: "hsl(var(--chart-3))" },
    { name: "Educação", value: 500, fill: "hsl(var(--chart-4))" },
    { name: "Outros", value: 320.5, fill: "hsl(var(--chart-5))" },
  ],
  metaFixada: {
    nome: "Notebook novo",
    valorTotal: 5399.0,
    valorDepositado: 1000.0,
    progresso: 18.5,
  },
}

export default function Dashboard() {
  const [mesSelecionado, setMesSelecionado] = useState("2025-01")

  const saldo = mockData.receitas - mockData.despesas

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-balance">Olá, Will</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Aqui está um resumo das suas finanças</p>
        </div>
        <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025-01">Janeiro 2025</SelectItem>
            <SelectItem value="2024-12">Dezembro 2024</SelectItem>
            <SelectItem value="2024-11">Novembro 2024</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-success hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <div className="rounded-full bg-success/10 p-2">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-success">
              R$ {mockData.receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total de entradas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <div className="rounded-full bg-destructive/10 p-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-destructive">
              R$ {mockData.despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total de saídas</p>
          </CardContent>
        </Card>

        <Card
          className={`border-l-4 ${saldo >= 0 ? "border-l-primary" : "border-l-destructive"} hover:shadow-lg transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <div className={`rounded-full ${saldo >= 0 ? "bg-primary/10" : "bg-destructive/10"} p-2`}>
              <DollarSign className={`h-4 w-4 ${saldo >= 0 ? "text-primary" : "text-destructive"}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl md:text-3xl font-bold ${saldo >= 0 ? "text-primary" : "text-destructive"}`}>
              R$ {Math.abs(saldo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{saldo >= 0 ? "Saldo positivo" : "Saldo negativo"}</p>
          </CardContent>
        </Card>

        {mockData.metaFixada && (
          <Card className="border-l-4 border-l-primary hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Meta Fixada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-bold text-lg">{mockData.metaFixada.nome}</h3>
                <p className="text-sm text-muted-foreground">
                  R$ {mockData.metaFixada.valorDepositado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} de R${" "}
                  {mockData.metaFixada.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-semibold">{mockData.metaFixada.progresso.toFixed(1)}%</span>
                </div>
                <Progress value={mockData.metaFixada.progresso} className="h-3" />
              </div>
              <div className="text-sm text-muted-foreground">
                Faltam R${" "}
                {(mockData.metaFixada.valorTotal - mockData.metaFixada.valorDepositado).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Gráfico de Categorias */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockData.categorias.map((cat, idx) => {
                const percentual = (cat.value / mockData.despesas) * 100
                return (
                  <div
                    key={idx}
                    className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:border-primary/50"
                  >
                    {/* Barra de progresso de fundo */}
                    <div
                      className="absolute inset-0 opacity-5 transition-all group-hover:opacity-10"
                      style={{
                        background: `linear-gradient(to right, ${cat.fill} ${percentual}%, transparent ${percentual}%)`,
                      }}
                    />

                    <div className="relative flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="h-10 w-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: `${cat.fill}20` }}
                        >
                          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.fill }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm md:text-base truncate">{cat.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{percentual.toFixed(1)}% do total</p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-lg md:text-xl font-bold">
                          R$ {cat.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Total */}
              <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-base md:text-lg">Total de Despesas</h4>
                  <div className="text-xl md:text-2xl font-bold text-primary">
                    R$ {mockData.despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximos Vencimentos */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos Vencimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockData.proximosVencimentos.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start justify-between gap-4 rounded-lg border p-3 ${
                    item.atrasado ? "border-destructive bg-destructive/5" : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.descricao}</span>
                      {item.pago ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : item.atrasado ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Dia {item.dia}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {item.formaPagamento}
                      </span>
                    </div>
                  </div>
                  <div className={`text-right ${item.atrasado ? "text-destructive" : ""}`}>
                    <div className="font-bold">
                      R$ {item.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                    {item.atrasado && <span className="text-xs text-destructive">Atrasado</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
