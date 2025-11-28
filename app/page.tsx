"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Importação do Supabase
import { AuthForm } from "@/components/auth-form"; // Importação do Login
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
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Verifica a sessão ao carregar a página
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Enquanto verifica a sessão, mostramos um carregando simples
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Carregando...
      </div>
    );
  }

  // Se NÃO tiver usuário logado, mostra a tela de Login
  if (!session) {
    return <AuthForm />;
  }

  // Se tiver usuário, mostra o App
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 transition-all duration-300">
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
            } rounded-lg px-4 py-3 text-left transition-all hover:scale-105 ${
              activeTab === "dashboard"
                ? "bg-primary text-primary-foreground shadow-lg"
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
            } rounded-lg px-4 py-3 text-left transition-all hover:scale-105 ${
              activeTab === "lancamentos"
                ? "bg-primary text-primary-foreground shadow-lg"
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
            } rounded-lg px-4 py-3 text-left transition-all hover:scale-105 ${
              activeTab === "metas"
                ? "bg-primary text-primary-foreground shadow-lg"
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
            } rounded-lg px-4 py-3 text-left transition-all hover:scale-105 ${
              activeTab === "configuracoes"
                ? "bg-primary text-primary-foreground shadow-lg"
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

        <div className="border-t p-3 space-y-2">
          <Button
            variant="outline"
            className={`w-full ${
              sidebarCollapsed ? "px-0" : "justify-start gap-3"
            }`}
            onClick={toggleTheme}
            title={
              sidebarCollapsed
                ? theme === "dark"
                  ? "Tema Claro"
                  : "Tema Escuro"
                : ""
            }
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            {!sidebarCollapsed && (
              <span>{theme === "dark" ? "Tema Claro" : "Tema Escuro"}</span>
            )}
          </Button>

          <Button
            variant="ghost"
            className={`w-full text-destructive hover:text-destructive hover:bg-destructive/10 ${
              sidebarCollapsed ? "px-0" : "justify-start gap-3"
            }`}
            onClick={handleLogout}
            title={sidebarCollapsed ? "Sair" : ""}
          >
            <LogOut className="h-5 w-5" />
            {!sidebarCollapsed && <span>Sair</span>}
          </Button>
        </div>
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

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm md:hidden">
        <div className="grid grid-cols-4 gap-1 px-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-all ${
              activeTab === "dashboard"
                ? "text-primary bg-primary/10 scale-105"
                : "text-muted-foreground active:scale-95"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab("lancamentos")}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-all ${
              activeTab === "lancamentos"
                ? "text-primary bg-primary/10 scale-105"
                : "text-muted-foreground active:scale-95"
            }`}
          >
            <Receipt className="h-5 w-5" />
            <span className="text-xs font-medium">Lançam.</span>
          </button>
          <button
            onClick={() => setActiveTab("metas")}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-all ${
              activeTab === "metas"
                ? "text-primary bg-primary/10 scale-105"
                : "text-muted-foreground active:scale-95"
            }`}
          >
            <Target className="h-5 w-5" />
            <span className="text-xs font-medium">Metas</span>
          </button>
          <button
            onClick={() => setActiveTab("configuracoes")}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-all ${
              activeTab === "configuracoes"
                ? "text-primary bg-primary/10 scale-105"
                : "text-muted-foreground active:scale-95"
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs font-medium">Config</span>
          </button>
        </div>
      </nav>

      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-24 right-4 z-40 h-12 w-12 rounded-full shadow-lg md:hidden bg-transparent"
        onClick={toggleTheme}
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
