import { Mic, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  resolvedTheme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function Header({ resolvedTheme, onToggleTheme }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 mx-auto max-w-5xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">SpenWriter</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggleTheme}>
          {resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </Button>
      </div>
    </header>
  )
}
