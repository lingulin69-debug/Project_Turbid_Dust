import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PlayerNotification {
  id: string;
  target_oc: string;
  content: string;
  notification_type: 'private' | 'popup';
  is_read: boolean;
  created_at: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useNotifications = (ocName: string | null) => {
  const [notifications, setNotifications] = useState<PlayerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [popupNotification, setPopupNotification] = useState<PlayerNotification | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!ocName) return;
    try {
      // Fetch private notifications
      const res = await fetch(`${API_BASE}/notifications/private/${encodeURIComponent(ocName)}`);
      if (!res.ok) return;
      const data = await res.json();
      const privates: PlayerNotification[] = (data.notifications || data || []).map((n: any) => ({
        id: n.id,
        target_oc: ocName,
        content: n.content,
        notification_type: 'private' as const,
        is_read: n.is_read ?? false,
        created_at: n.created_at,
      }));

      // Fetch popup notifications
      const popupRes = await fetch(`${API_BASE}/notifications/popup/${encodeURIComponent(ocName)}`);
      let popups: PlayerNotification[] = [];
      if (popupRes.ok) {
        const popupData = await popupRes.json();
        popups = (popupData.popup_notifications || []).map((n: any) => ({
          id: n.id,
          target_oc: ocName,
          content: n.content,
          notification_type: 'popup' as const,
          is_read: false,
          created_at: n.timestamp || n.created_at,
        }));
      }

      const all = [...privates, ...popups].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNotifications(all);
      setUnreadCount(all.filter(n => !n.is_read).length);
      setPopupNotification(popups.find(n => !n.is_read) ?? null);
    } catch (_) {
      // silent fail
    }
  }, [ocName]);

  const markRead = useCallback(async (notificationId: string) => {
    if (!ocName) return;
    try {
      await fetch(`${API_BASE}/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oc_name: ocName, notification_id: notificationId }),
      });
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      setPopupNotification(prev => (prev?.id === notificationId ? null : prev));
    } catch (_) {
      // silent fail
    }
  }, [ocName]);

  const markAllRead = useCallback(async () => {
    if (!ocName) return;
    const unread = notifications.filter(n => !n.is_read && n.notification_type === 'private');
    await Promise.all(unread.map(n => markRead(n.id)));
  }, [ocName, notifications, markRead]);

  useEffect(() => {
    if (!ocName) {
      setNotifications([]);
      setUnreadCount(0);
      setPopupNotification(null);
      return;
    }

    fetchNotifications();

    // Realtime: re-fetch on new notifications for this player
    const channel = (supabase as any)
      .channel(`notifications-${ocName}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_notifications',
          filter: `target_oc=eq.${ocName}`,
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ocName, fetchNotifications]);

  return { notifications, unreadCount, popupNotification, markRead, markAllRead };
};
