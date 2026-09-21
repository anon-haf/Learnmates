import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { XP_RULES } from '../lib/xp-rules';
import { triggerXPNotification } from '../components/XPRewardNotification';

const TEN_MINUTES_MS = XP_RULES.active_time.checkInterval;

export function useXP() {
  const activeTimeRef = useRef(0);
  const isMouseMovingRef = useRef(false);

  useEffect(() => {
    let mouseTimeout: ReturnType<typeof setTimeout>;
    
    const handleMouseMove = () => {
      isMouseMovingRef.current = true;
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        isMouseMovingRef.current = false;
      }, 3000);
    };
    
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('keydown', handleMouseMove, { passive: true });
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleMouseMove);
      clearTimeout(mouseTimeout);
    };
  }, []);

  useEffect(() => {
    const activeInterval = setInterval(() => {
      const isVisible = document.visibilityState === 'visible';
      
      if (isVisible && isMouseMovingRef.current) {
        activeTimeRef.current += 1000;
      }
    }, 1000);
    
    return () => clearInterval(activeInterval);
  }, []);

  useEffect(() => {
    const activePingInterval = setInterval(async () => {
      if (activeTimeRef.current < TEN_MINUTES_MS) {
        return;
      }

      const duration = Math.floor(activeTimeRef.current / TEN_MINUTES_MS) * 600;
        
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
          
        const res = await fetch('/api/xp/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          keepalive: true,
          body: JSON.stringify({
            action: 'active_time',
            duration,
            tabVisible: document.visibilityState === 'visible',
            mouseMoving: true
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.awarded > 0) {
            triggerXPNotification(data.awarded, 'active_time');
          }
          activeTimeRef.current = Math.max(0, activeTimeRef.current - duration * 1000);
        }
      } catch (error) {
        console.error('Failed to send active time heartbeat', error);
      }
    }, 30000);
    
    return () => clearInterval(activePingInterval);
  }, []);
}
