"use client"

import { useEffect, useState } from "react"
import { Github, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const themeOptions = [
  { label: "Light", value: "light", icon: Sun },
  { label: "Dark", value: "dark", icon: Moon },
  { label: "GitHub", value: "github", icon: Github },
] as const

function CurrentThemeIcon({ theme }: { theme: string | undefined }) {
  if (theme === "dark") {
    return <Moon className="h-5 w-5" />
  }

  if (theme === "github") {
    return <Github className="h-5 w-5" />
  }

  return <Sun className="h-5 w-5" />
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="hover-scale hover:bg-primary/5" disabled>
        <Sun className="h-5 w-5 opacity-60" />
        <span className="sr-only">Theme switcher loading</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="hover-scale hover:bg-primary/5">
          <CurrentThemeIcon theme={theme} />
          <span className="sr-only">Switch theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card min-w-40 shadow-xl">
        {themeOptions.map((option) => {
          const Icon = option.icon
          const active = theme === option.value

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={active ? "bg-primary/10 text-primary" : "hover:bg-primary/5"}
            >
              <Icon className="mr-2 h-4 w-4" />
              <span>{option.label}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
