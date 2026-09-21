import React, { useEffect, useState } from 'react';

export interface XPEvent {
  id: string;
  amount: number;
  action: string;
}

const EMOJI_MAP: Record<string, string> = {
  active_time: '⏱️',
  question_view: '📝',
  download: '📥',
  paper_download: '📄',
  topical_paper_download: '📑',
  streak_visit: '🔥',
};

// We create a global event emitter for triggering notifications from anywhere
type Listener = (event: XPEvent) => void;
let listeners: Listener[] = [];

export const triggerXPNotification = (amount: number, action: string) => {
  const event: XPEvent = {
    id: Math.random().toString(36).substring(2, 9),
    amount,
    action,
  };
  listeners.forEach(listener => listener(event));
};

export function XPRewardNotification() {
  const [notifications, setNotifications] = useState<XPEvent[]>([]);

  useEffect(() => {
    const listener = (event: XPEvent) => {
      setNotifications(prev => [...prev, event]);
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== event.id));
      }, 3000);
    };

    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((notif) => (
        <div 
          key={notif.id}
          className="bg-white border-2 border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg shadow-lg font-bold flex items-center gap-3 transform transition-all duration-300 translate-y-0 opacity-100"
          style={{ animation: 'slideIn 0.3s ease-out forwards' }}
        >
          <div className="text-2xl">{EMOJI_MAP[notif.action] || '⭐'}</div>
          <div>
            <div className="text-sm opacity-80 capitalize leading-tight">{notif.action.replace('_', ' ')}</div>
            <div className="text-lg">+{notif.amount} XP</div>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
