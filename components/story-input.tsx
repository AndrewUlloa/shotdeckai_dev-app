'use client'

// import { ArrowUp } from "lucide-react"
// import { Button } from "@/components/ui/button"

export function StoryInput() {
  return (
    // <div className="flex h-9 w-full rounded-2xl border-white/10 border-gradient-lg backdrop-blur-[10px] text-card-foreground shadow px-3 py-1 text-sm transition-colors">
    //   <input
    //     type="text"
    //     placeholder="My story looks and feels like..."
    //     className="bg-transparent text-white placeholder-white text-sm flex-grow outline-none px-1 py-1"
    //     inputMode="text"
    //     autoComplete="off"
    //     spellCheck="false"
    //   />
    // </div>
    <div className="w-full max-w-lg mx-auto rounded-2xl border-gradient backdrop-blur-[10px] shadow-lg">
      <textarea
        className="flex w-full rounded-2xl px-3 py-1 placeholder:text-white text-white text-base font-inter bg-transparent"
        rows={2}
        spellCheck="false"
        placeholder="My story looks and feels like..."
        required
        inputMode="text"
        autoComplete="off"
      />
    </div>
  )
}
// 'use client'

// export function StoryInput() {
//   return (
//     <div className="w-full max-w-lg mx-auto">
//       <textarea 
//         className="flex min-h-[60px] w-full rounded-md border border-white/10 py-2 px-4 shadow-sm 
//                    placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-1 
//                    focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50 
//                    resize-none bg-transparent text-white text-base transition-colors
//                    backdrop-blur-[10px]"
//         rows={4}
//         spellCheck="false"
//         placeholder="My story looks and feels like..."
//         required
//         inputMode="text"
//         autoComplete="off"
//       />
//     </div>
//   )
// }