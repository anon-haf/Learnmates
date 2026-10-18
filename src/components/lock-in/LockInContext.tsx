import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

export interface UserDevice {
  id: string;
  device_id: string;
  device_name: string;
  status: 'lobby' | 'locked' | 'open';
  lock_until: string | null;
  last_active_at: string;
  is_host: boolean;
}

export interface LockInSessionState {
  user_id?: string;
  status: 'active';
  session_minutes: number;
  started_at: string;
  paused_duration_ms: number;
  breaks_allowed: number;
  breaks_taken: number;
  current_break_started_at: string | null;
  tab_left_at: string | null;
  tab_left_device_id: string | null;
}

interface LockInContextType {
  sessionState: LockInSessionState | null;
  updateSessionState: (updates: Partial<LockInSessionState>) => Promise<void>;
  endSessionContext: () => Promise<void>;
  startSession: (minutes: number, deviceUpdates: any[]) => Promise<void>;
  
  devices: UserDevice[];
  currentDevice: UserDevice | undefined;
  deviceId: string;
  fetchDevices: () => Promise<void>;
}

const LockInContext = createContext<LockInContextType | undefined>(undefined);

const getDeviceId = () => {
  let id = localStorage.getItem('lock_in_device_id');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    localStorage.setItem('lock_in_device_id', id);
  }
  return id;
};

const getDeviceName = () => {
  const ua = navigator.userAgent;
  let browser = "Browser";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  
  let os = "Device";
  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac")) os = "Mac";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("iPhone")) os = "iPhone";
  else if (ua.includes("iPad")) os = "iPad";
  else if (ua.includes("Android")) os = "Android";

  return `${browser} on ${os}`;
};

export const LockInProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const devicesRef = useRef<UserDevice[]>([]);
  const [deviceId, setDeviceId] = useState<string>('');
  const [sessionState, setSessionState] = useState<LockInSessionState | null>(null);

  const applyDeviceUpdate = useCallback((device: UserDevice) => {
    const activeSince = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const nextDevices = devicesRef.current.filter(
      existing => existing.id !== device.id && existing.last_active_at >= activeSince
    );
    if (device.last_active_at >= activeSince) {
      nextDevices.push(device);
    }
    nextDevices.sort((a, b) => b.last_active_at.localeCompare(a.last_active_at));
    devicesRef.current = nextDevices;
    setDevices(nextDevices);
  }, []);

  const fetchSession = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('lock_in_sessions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
      
    setSessionState(data as LockInSessionState | null);
  }, [user]);

  const fetchDevices = useCallback(async () => {
    if (!user) return;
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', user.id)
      .gte('last_active_at', fiveMinsAgo)
      .order('last_active_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch active devices', error);
    } else if (data) {
      const activeDevices = data as UserDevice[];
      devicesRef.current = activeDevices;
      setDevices(activeDevices);
    }
  }, [user]);

  const heartbeat = useCallback(async (id: string, name: string) => {
    if (!user) return;
    
    const now = new Date().toISOString();
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const activeDevices = devicesRef.current.filter(
      device => device.last_active_at >= fiveMinsAgo
    );
      
    let shouldBeHost = false;
    let shouldDemote = false;

    if (activeDevices.length > 0) {
      const hosts = activeDevices.filter(d => d.is_host);
      const isAlreadyHost = activeDevices.some(d => d.device_id === id && d.is_host);
      
      if (hosts.length === 0) {
        shouldBeHost = true;
      } else if (hosts.length === 1) {
        if (isAlreadyHost) {
          shouldBeHost = true;
        }
      } else {
        // Deterministic tie breaker for multiple hosts
        hosts.sort((a, b) => a.device_id.localeCompare(b.device_id));
        const winner = hosts[0];
        if (winner.device_id === id) {
          shouldBeHost = true;
        } else if (isAlreadyHost) {
          shouldDemote = true;
        }
      }
    } else {
      shouldBeHost = true;
    }

    const { data, error } = await supabase
      .from('user_devices')
      .update({ 
        last_active_at: now, 
        device_name: name,
        ...(shouldBeHost ? { is_host: true } : {}),
        ...(shouldDemote ? { is_host: false } : {})
      })
      .eq('user_id', user.id)
      .eq('device_id', id)
      .select('id, device_id, device_name, status, lock_until, last_active_at, is_host');

    if (error) {
      console.error('Failed to update active device', error);
      return;
    }

    if (data?.[0]) {
      applyDeviceUpdate(data[0] as UserDevice);
    } else {
      const { data: insertedDevice, error: insertError } = await supabase
        .from('user_devices')
        .insert({
          user_id: user.id,
          device_id: id,
          device_name: name,
          status: 'lobby',
          last_active_at: now,
          is_host: shouldBeHost
        })
        .select('id, device_id, device_name, status, lock_until, last_active_at, is_host')
        .single();
      if (insertError) {
        console.error('Failed to register device', insertError);
      } else if (insertedDevice) {
        applyDeviceUpdate(insertedDevice as UserDevice);
      }
    }
  }, [user, applyDeviceUpdate]);

  useEffect(() => {
    if (!user) return;

    const id = getDeviceId();
    const name = getDeviceName();
    setDeviceId(id);

    const deviceChannel = supabase
      .channel(`user_devices_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_devices', filter: `user_id=eq.${user.id}` },
        payload => {
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as Partial<UserDevice>).id;
            if (deletedId) {
              const activeSince = new Date(Date.now() - 5 * 60 * 1000).toISOString();
              const nextDevices = devicesRef.current.filter(
                device => device.id !== deletedId && device.last_active_at >= activeSince
              );
              devicesRef.current = nextDevices;
              setDevices(nextDevices);
            } else {
              void fetchDevices();
            }
            return;
          }

          const changedDevice = payload.new as UserDevice;
          applyDeviceUpdate(changedDevice);
        }
      )
      .subscribe();
      
    const sessionChannel = supabase
      .channel(`lock_in_sessions_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lock_in_sessions', filter: `user_id=eq.${user.id}` },
        () => fetchSession()
      )
      .subscribe();

    let isMounted = true;
    const initialize = async () => {
      await Promise.all([fetchSession(), fetchDevices()]);
      if (isMounted) {
        await heartbeat(id, name);
      }
    };
    void initialize();

    const interval = setInterval(() => heartbeat(id, name), 120000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      supabase.removeChannel(deviceChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [user, heartbeat, fetchDevices, fetchSession, applyDeviceUpdate]);

  const currentDevice = devices.find(d => d.device_id === deviceId);

  const updateSessionState = async (updates: Partial<LockInSessionState>) => {
    if (!user) return;
    
    // Optimistic update
    setSessionState(prev => prev ? { ...prev, ...updates } : null);

    await supabase
      .from('lock_in_sessions')
      .update(updates)
      .eq('user_id', user.id);
  };

  const startSession = async (minutes: number, deviceUpdates: any[]) => {
    if (!user) return;
    
    await Promise.all(deviceUpdates);

    const newSession = {
      user_id: user.id,
      session_minutes: minutes,
      started_at: new Date().toISOString(),
      paused_duration_ms: 0,
      breaks_allowed: Math.round(minutes / 60),
      breaks_taken: 0,
      current_break_started_at: null,
      tab_left_at: null,
      tab_left_device_id: null,
      status: 'active' as const
    };

    // Optimistic
    setSessionState(newSession);

    await supabase.from('lock_in_sessions').upsert(newSession);
  };

  const endSessionContext = async () => {
    if (!user) return;
    setSessionState(null);
    await supabase.from('lock_in_sessions').delete().eq('user_id', user.id);
  };

  return (
    <LockInContext.Provider value={{ 
      sessionState, 
      updateSessionState, 
      endSessionContext,
      startSession,
      devices,
      currentDevice,
      deviceId,
      fetchDevices
    }}>
      {children}
    </LockInContext.Provider>
  );
};

export const useLockInSession = () => {
  const context = useContext(LockInContext);
  if (!context) {
    throw new Error('useLockInSession must be used within a LockInProvider');
  }
  return context;
};
