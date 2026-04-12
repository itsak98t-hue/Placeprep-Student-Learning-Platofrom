import { CheckCircle2, Github, Moon, Palette, Sun } from "lucide-react"

import { ThemeSwitcher } from "@/components/theme-switcher"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const themeCards = [
  {
    title: "Light Theme",
    description: "Bright surfaces, clear contrast, and clean verification of CSS-variable tokens.",
    icon: Sun,
  },
  {
    title: "Dark Theme",
    description: "Current app-friendly dark look with stronger depth and smooth Tailwind token usage.",
    icon: Moon,
  },
  {
    title: "GitHub Theme",
    description: "Custom GitHub-inspired dark styling using the requested palette and reusable variables.",
    icon: Github,
  },
] as const

export default function ThemeDemoPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground transition-colors duration-300 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-8 shadow-sm transition-colors duration-300 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="border-border bg-background text-primary">
              Theme System Demo
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight">Light, Dark, and GitHub themes</h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              This page uses only Tailwind token classes like <span className="text-primary">`bg-background`</span>,
              <span className="text-primary"> `bg-card`</span>, <span className="text-primary">`border-border`</span>,
              and <span className="text-primary"> `text-foreground`</span> so you can confirm the three manual themes are working.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Primary Action
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {themeCards.map((item) => {
            const Icon = item.icon

            return (
              <Card key={item.title} className="border-border bg-card text-card-foreground shadow-sm transition-colors duration-300">
                <CardHeader className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription className="text-muted-foreground">{item.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                    Background token, card token, and border token all inherit from the active theme class.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-primary text-primary-foreground">Primary</Badge>
                    <Badge variant="outline" className="border-border text-foreground">
                      Border Token
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="border-border bg-card text-card-foreground shadow-sm transition-colors duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>GitHub-style verification block</CardTitle>
                <CardDescription className="text-muted-foreground">
                  The GitHub theme should use `#0d1117`, `#161b22`, `#30363d`, `#c9d1d9`, and `#58a6ff`.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-border bg-background p-5">
              <h2 className="text-xl font-semibold">Sample Content</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                This panel exists to confirm readable foreground text, card contrast, and token-based borders across all three manual themes.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Save Changes</Button>
                <Button variant="outline" className="border-border bg-card text-foreground hover:bg-background">
                  Secondary Action
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Theme Checklist</h3>
              <div className="mt-4 space-y-3">
                {[
                  "Background updates instantly",
                  "Cards inherit token colors",
                  "Borders stay visible in all modes",
                  "Primary buttons adapt cleanly",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
