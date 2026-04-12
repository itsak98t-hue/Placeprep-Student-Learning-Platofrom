"use client"

export function normalizeStoredIds(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return [...new Set(value.filter((item): item is string => typeof item === "string"))]
}

export function readScopedProgress<T extends Record<string, string[]>>(
  storageKey: string,
  defaults: T
): T {
  if (typeof window === "undefined") {
    return defaults
  }

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return defaults
    }

    const parsed = JSON.parse(raw) as Partial<Record<keyof T, unknown>>
    const normalized = {} as T

    for (const key of Object.keys(defaults) as Array<keyof T>) {
      normalized[key] = normalizeStoredIds(parsed[key]) as T[keyof T]
    }

    return normalized
  } catch {
    return defaults
  }
}

export function writeScopedProgress<T>(storageKey: string, progress: T) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(progress))
  } catch {
    // Ignore storage write failures so the UI stays usable in restrictive environments.
  }
}

export function toggleStoredId(values: string[], id: string) {
  return values.includes(id) ? values.filter((value) => value !== id) : [...values, id]
}
