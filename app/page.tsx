"use client";

import { useState } from "react";
import Dashboard from "@/components/dashboard";
import Lancamentos from "@/components/lancamentos";
import Metas from "@/components/metas";
import Configuracoes from "@/components/configuracoes";
import {
  LayoutDashboard,
  Receipt,
  Target,
  Settings,
  Menu,
  Moon,
  Sun,
  ChevronLeft,
  Home as HomeIcon,
  FileText,
  Cog,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <aside
        className={`hidden md:fixed md:left-0 md:top-0 md:flex md:h-screen md:flex-col md:border-r md:bg-card transition-all duration-300 ${
          sidebarCollapsed ? "md:w-20" : "md:w-64"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-primary">Finanças Will</h1>
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

      <main
        className={`min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "lancamentos" && <Lancamentos />}
        {activeTab === "metas" && <Metas />}
        {activeTab === "configuracoes" && <Configuracoes />}
      </main>

      {/* Menu Mobile Minimalista */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 md:hidden">
        <div className="bg-card border rounded-full px-2 py-1 flex items-center gap-1">
          {/* Botão Dashboard */}
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center justify-center p-2 rounded-full transition-all ${
              activeTab === "dashboard"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground"
            }`}
          >
            <HomeIcon className="h-4 w-4" />
            <span className="text-xs mt-1">Home</span>
          </button>

          {/* Botão Lançamentos */}
          <button
            onClick={() => setActiveTab("lancamentos")}
            className={`flex flex-col items-center justify-center p-2 rounded-full transition-all ${
              activeTab === "lancamentos"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span className="text-xs mt-1">Lançam.</span>
          </button>

          {/* Botão Configurações */}
          <button
            onClick={() => setActiveTab("configuracoes")}
            className={`flex flex-col items-center justify-center p-2 rounded-full transition-all ${
              activeTab === "configuracoes"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground"
            }`}
          >
            <Cog className="h-4 w-4" />
            <span className="text-xs mt-1">Config</span>
          </button>
        </div>
      </div>
    </div>
  );
}
