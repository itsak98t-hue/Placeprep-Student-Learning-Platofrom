"use client"

import { useEffect, useMemo, useState } from "react"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { NotificationDoc } from "@/types/dashboard"

export function useNotifications(uid: string | null | undefined) {
  const [notifications, setNotifications] = useState<NotificationDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setNotifications([])
      setLoading(false)
      return
    }

    const notificationsQuery = query(
      collection(db, "users", uid, "notifications"),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      setNotifications(
        snapshot.docs.map((notificationDoc) => {
          const data = notificationDoc.data()
          return {
            id: String(data.id ?? notificationDoc.id),
            type:
              data.type === "achievement" ||
              data.type === "streak" ||
              data.type === "leaderboard" ||
              data.type === "reminder" ||
              data.type === "system"
                ? data.type
                : "system",
            title: String(data.title ?? "Notification"),
            message: String(data.message ?? ""),
            read: data.read === true,
            createdAt: data.createdAt,
          }
        })
      )
      setLoading(false)
    })

    return () => unsubscribe()
  }, [uid])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  )

  return {
    notifications,
    unreadCount,
    loading,
  }
}
