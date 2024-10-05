'use client'

import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export function StoryInput() {
  return (
    <div className="flex h-9 w-full rounded-2xl border-white/10 border-gradient-lg backdrop-blur-[10px] text-card-foreground shadow px-3 py-1 text-sm transition-colors">
      <input
        type="text"
        placeholder="My story looks and feels like..."
        className="bg-transparent text-white placeholder-gray-400 text-lg flex-grow outline-none px-4 py-2"
      />
      <Button className="bg-[#0a84ff] text-white p-2 rounded-full hover:bg-[#007aff] transition-colors ml-2">
        <ArrowUp className="w-5 h-5" />
      </Button>
    </div>
  )
}