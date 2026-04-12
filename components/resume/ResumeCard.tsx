"use client"

import { Copy, MoreHorizontal, PencilLine, Star, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ResumeListItem } from "@/types/resume"

type ResumeCardProps = {
  resume: ResumeListItem
  selected: boolean
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onSetDefault: () => void
}

function formatDateLabel(value?: string) {
  if (!value) {
    return "Just now"
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function ResumeCard({
  resume,
  selected,
  onEdit,
  onDuplicate,
  onDelete,
  onSetDefault,
}: ResumeCardProps) {
  return (
    <Card
      className={
        selected
          ? "border-primary/40 bg-primary/[0.04] shadow-sm transition-colors"
          : "border-border/70 shadow-sm transition-colors hover:border-primary/20"
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{resume.title}</CardTitle>
              {resume.isDefault && (
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                  <Star className="mr-1 h-3 w-3" />
                  Default
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {resume.targetRole}
              {resume.targetCompany ? ` - ${resume.targetCompany}` : ""}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>Duplicate</DropdownMenuItem>
              {!resume.isDefault && <DropdownMenuItem onClick={onSetDefault}>Set as Default</DropdownMenuItem>}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="bg-muted/60">
            {resume.template}
          </Badge>
          <span>Updated {formatDateLabel(resume.updatedAt)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant={selected ? "default" : "outline"} className="w-full" onClick={onEdit}>
            <PencilLine className="mr-2 h-4 w-4" />
            {selected ? "Editing" : "Edit"}
          </Button>
          <Button variant="outline" className="w-full" onClick={onDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="w-full" onClick={onSetDefault} disabled={resume.isDefault}>
            <Star className="mr-2 h-4 w-4" />
            {resume.isDefault ? "Default" : "Set Default"}
          </Button>
          <Button variant="outline" className="w-full" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
