"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { ResumeListItem } from "@/types/resume"

type DeleteResumeDialogProps = {
  open: boolean
  resume: ResumeListItem | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function DeleteResumeDialog({
  open,
  resume,
  onOpenChange,
  onConfirm,
}: DeleteResumeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete resume?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove {resume?.title ?? "this resume"} from your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => void onConfirm()}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
