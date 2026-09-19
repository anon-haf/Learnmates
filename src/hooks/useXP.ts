import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { XP_RULES } from '../lib/xp-rules';
import { triggerXPNotification } from '../components/XPRewardNotification';

export function useXP() {
  const activeTimeRef = useRef(0);
  const scrollTimeRef = useRef(0);
  
  const lastActivePingRef = useRef(Date.now());
  const lastScrollPingRef = useRef(Date.now());
  
  const lastScrollPosRef = useRef(0);
  const lastScrollTimeRef = useRef(Date.now());
  
  const isMouseMovingRef = useRef(false);
  const isReachedBottomRef = useRef(false);

  useEffect(() => {
    // Mouse movement tracking
    let mouseTimeout: ReturnType<typeof setTimeout>;
    
    const handleMouseMove = () => {
      isMouseMovingRef.current = true;
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        isMouseMovingRef.current = false;
      }, 3000); // Consider active for 3s after mouse movement
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
    // Scroll tracking (uses capture true to catch scroll events on any container element)
    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement | Document;
      let scrollTop = 0;
      let scrollHeight = 0;
      let clientHeight = 0;

      if (target === document || target === document.documentElement || target === document.body) {
        scrollTop = window.scrollY || document.documentElement.scrollTop;
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = window.innerHeight;
      } else if (target instanceof HTMLElement) {
        scrollTop = target.scrollTop;
        scrollHeight = target.scrollHeight;
        clientHeight = target.clientHeight;
      }

      if (scrollHeight <= 0) return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastScrollTimeRef.current;
      const distance = Math.abs(scrollTop - lastScrollPosRef.current);
      
      if (timeDiff > 0 && distance > 0) {
        const speed = (distance / timeDiff) * 1000; // pixels per second
        
        // If speed is within natural reading speed, accumulate scroll time
        if (speed < XP_RULES.scrolling.maxScrollSpeed) {
          scrollTimeRef.current += timeDiff;
        }
      }
      
      // Check if reached near bottom (within 100px or 90% scrolled)
      if (scrollTop + clientHeight >= scrollHeight - 100 || (scrollHeight > 0 && (scrollTop + clientHeight) / scrollHeight >= 0.9)) {
        isReachedBottomRef.current = true;
      }
      
      lastScrollPosRef.current = scrollTop;
      lastScrollTimeRef.current = currentTime;
    };
    
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);

  useEffect(() => {
    // Active time accumulation interval (runs every second)
    const activeInterval = setInterval(() => {
      const isVisible = document.visibilityState === 'visible';
      
      if (isVisible && isMouseMovingRef.current) {
        activeTimeRef.current += 1000;
      }
    }, 1000);
    
    return () => clearInterval(activeInterval);
  }, []);

  useEffect(() => {
    // API Heartbeat for active time (every 30 seconds)
    const activePingInterval = setInterval(async () => {
      const now = Date.now();
      
      // Only send if we have accrued at least 15 seconds of active time
      if (activeTimeRef.current >= 15000) {
        const duration = Math.floor(activeTimeRef.current / 1000);
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          
          const res = await fetch('/api/xp/heartbeat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
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
            // Deduct the successfully reported duration
            activeTimeRef.current = Math.max(0, activeTimeRef.current - duration * 1000);
            lastActivePingRef.current = now;
          }
        } catch (error) {
          console.error('Failed to send active time heartbeat', error);
        }
      }
    }, 30000);
    
    return () => clearInterval(activePingInterval);
  }, []);

  useEffect(() => {
    // API Heartbeat for scrolling
    const scrollPingInterval = setInterval(async () => {
      const now = Date.now();

      if (scrollTimeRef.current >= 3000 && isReachedBottomRef.current) {
        const duration = Math.floor(scrollTimeRef.current / 1000);
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          
          const res = await fetch('/api/xp/heartbeat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              action: 'scrolling',
              duration,
              scrollSpeed: 50,
              reachedBottom: true
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.awarded > 0) {
              triggerXPNotification(data.awarded, 'scrolling');
            }
            scrollTimeRef.current = 0;
            isReachedBottomRef.current = false;
            lastScrollPingRef.current = now;
          }
        } catch (error) {
          console.error('Failed to send scroll heartbeat', error);
        }
      }
    }, 30000);
    
    return () => clearInterval(scrollPingInterval);
  }, []);
}
