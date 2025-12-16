// components/config/ThemeToggleCard.tsx
"use client";

import { Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";

export function ThemeToggleCard() {
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };

  return (
    <Card
      onClick={toggleTheme}
      className="flex flex-col items-center justify-center p-4 gap-2 cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95"
    >
      <Palette className="h-6 w-6 text-primary" />
      <span className="text-xs font-medium text-center">Aparência</span>
    </Card>
  );
}
