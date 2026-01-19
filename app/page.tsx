// app/page.tsx
"use client";

import { useState } from "react";
import Dashboard from "@/components/dashboard";
import Lancamentos from "@/components/lancamentos";
import Metas from "@/components/metas";
import Configuracoes from "@/components/configuracoes";
import DespesasFixas from "@/components/despesas-fixas";
import Receitas from "@/components/receitas"; // <--- NOVO IMPORT
import {
  LayoutDashboard,
  Receipt,
  Target,
  Settings,
  Menu,
  ChevronLeft,
  Home as HomeIcon,
  FileText,
  Cog,
  PieChart, // <--- NOVO ÍCONE PARA "PLANOS"
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 transition-all duration-300">
      {/* --- SIDEBAR (Desktop) --- */}
      <aside
        className={`hidden md:fixed md:left-0 md:top-0 md:flex md:h-screen md:flex-col md:border-r md:bg-card transition-all duration-300 ${
          sidebarCollapsed ? "md:w-20" : "md:w-64"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-primary">My Pocket</h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto"
          >
            {sidebarCollapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {/* Dashboard */}
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex w-full items-center ${
              sidebarCollapsed ? "justify-center" : "gap-3"
            } rounded-lg px-4 py-3 text-left transition-all ${
              activeTab === "dashboard"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
            title={sidebarCollapsed ? "Dashboard" : ""}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed && (
              <span className="font-medium">Dashboard</span>
            )}
          </button>

          {/* Lançamentos */}
          <button
            onClick={() => setActiveTab("lancamentos")}
            className={`flex w-full items-center ${
              sidebarCollapsed ? "justify-center" : "gap-3"
            } rounded-lg px-4 py-3 text-left transition-all ${
              activeTab === "lancamentos"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
            title={sidebarCollapsed ? "Lançamentos" : ""}
          >
            <Receipt className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed && (
              <span className="font-medium">Lançamentos</span>
            )}
          </button>

          {/* Planos (Receitas) - NOVO BOTÃO DESKTOP */}
          <button
            onClick={() => setActiveTab("receitas")}
            className={`flex w-full items-center ${
              sidebarCollapsed ? "justify-center" : "gap-3"
            } rounded-lg px-4 py-3 text-left transition-all ${
              activeTab === "receitas"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
            title={sidebarCollapsed ? "Planos" : ""}
          >
            <PieChart className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">Planos</span>}
          </button>

          {/* Metas */}
          <button
            onClick={() => setActiveTab("metas")}
            className={`flex w-full items-center ${
              sidebarCollapsed ? "justify-center" : "gap-3"
            } rounded-lg px-4 py-3 text-left transition-all ${
              activeTab === "metas"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
            title={sidebarCollapsed ? "Metas" : ""}
          >
            <Target className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">Metas</span>}
          </button>

          {/* Configurações */}
          <button
            onClick={() => setActiveTab("configuracoes")}
            className={`flex w-full items-center ${
              sidebarCollapsed ? "justify-center" : "gap-3"
            } rounded-lg px-4 py-3 text-left transition-all ${
              activeTab === "configuracoes"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
            title={sidebarCollapsed ? "Configurações" : ""}
          >
            <Settings className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed && (
              <span className="font-medium">Configurações</span>
            )}
          </button>
        </nav>
      </aside>

      {/* --- ÁREA PRINCIPAL --- */}
      <main
        className={`min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        {activeTab === "dashboard" && <Dashboard onNavigate={setActiveTab} />}
        {activeTab === "lancamentos" && <Lancamentos />}
        {activeTab === "receitas" && <Receitas />} {/* TELA NOVA */}
        {activeTab === "metas" && <Metas />}
        {activeTab === "configuracoes" && (
          <Configuracoes onNavigate={setActiveTab} />
        )}
        {activeTab === "despesas_fixas" && (
          <DespesasFixas onBack={() => setActiveTab("configuracoes")} />
        )}
      </main>

      {/* --- MENU MOBILE (Fixo embaixo) --- */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 md:hidden">
        <div className="bg-card border rounded-full px-3 py-2 flex items-center gap-1 shadow-xl backdrop-blur-sm bg-opacity-95">
          {/* Home */}
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-14 h-14 flex flex-col items-center justify-center rounded-2xl transition-all ${
              activeTab === "dashboard"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground"
            }`}
          >
            <HomeIcon className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-medium">Home</span>
          </button>

          {/* Lançamentos */}
          <button
            onClick={() => setActiveTab("lancamentos")}
            className={`w-14 h-14 flex flex-col items-center justify-center rounded-2xl transition-all ${
              activeTab === "lancamentos"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground"
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-medium">Lançam.</span>
          </button>

          {/* Planos (Receitas) - NOVO BOTÃO MOBILE */}
          <button
            onClick={() => setActiveTab("receitas")}
            className={`w-14 h-14 flex flex-col items-center justify-center rounded-2xl transition-all ${
              activeTab === "receitas"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground"
            }`}
          >
            <PieChart className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-medium">Planos</span>
          </button>

          {/* Configurações */}
          <button
            onClick={() => setActiveTab("configuracoes")}
            className={`w-14 h-14 flex flex-col items-center justify-center rounded-2xl transition-all ${
              activeTab === "configuracoes" || activeTab === "despesas_fixas"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground"
            }`}
          >
            <Cog className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-medium">Config</span>
          </button>
        </div>
      </div>
    </div>
  );
}
