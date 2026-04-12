"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { BehavioralCategory, QuestionFrequency } from "@/data/types"

type BehavioralFiltersProps = {
  category: BehavioralCategory | "All"
  frequency: QuestionFrequency | "All"
  categories: Array<BehavioralCategory | "All">
  frequencies: Array<QuestionFrequency | "All">
  onCategoryChange: (value: BehavioralCategory | "All") => void
  onFrequencyChange: (value: QuestionFrequency | "All") => void
}

export function BehavioralFilters({
  category,
  frequency,
  categories,
  frequencies,
  onCategoryChange,
  onFrequencyChange,
}: BehavioralFiltersProps) {
  return (
    <div className="grid gap-4 rounded-2xl border bg-card/70 p-4 backdrop-blur-sm md:grid-cols-2">
      <FilterSelect label="Category" value={category} options={categories} onChange={onCategoryChange} />
      <FilterSelect label="Frequency" value={frequency} options={frequencies} onChange={onFrequencyChange} />
    </div>
  )
}

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: T[]
  onChange: (value: T) => void
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <Select value={value} onValueChange={(next) => onChange(next as T)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}
