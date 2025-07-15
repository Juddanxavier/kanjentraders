/** @format */
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Monitor, Smartphone, Tablet, MapPin, Clock } from 'lucide-react';
import { authClient } from '@/lib/auth/auth-client';
import { formatDistanceToNow } from 'date-fns';

interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export function SessionsList({ currentSessionId }: { currentSessionId?: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    try {
      const response = await authClient.listSessions();
      if (response.data) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }

  async function revokeSession(sessionId: string) {
    setRevokingSession(sessionId);
    try {
      await authClient.revokeSession({ token: sessionId });
      toast.success('Session revoked successfully');
      await fetchSessions(); // Refresh the list
    } catch (error) {
      console.error('Error revoking session:', error);
      toast.error('Failed to revoke session');
    } finally {
      setRevokingSession(null);
    }
  }

  async function revokeAllOtherSessions() {
    if (!confirm('Are you sure you want to sign out from all other devices?')) {
      return;
    }

    setIsLoading(true);
    try {
      await authClient.revokeOtherSessions();
      toast.success('All other sessions revoked successfully');
      await fetchSessions(); // Refresh the list
    } catch (error) {
      console.error('Error revoking sessions:', error);
      toast.error('Failed to revoke sessions');
    } finally {
      setIsLoading(false);
    }
  }

  function getDeviceIcon(userAgent?: string) {
    if (!userAgent) return <Monitor className="h-5 w-5" />;
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile')) return <Smartphone className="h-5 w-5" />;
    if (ua.includes('tablet')) return <Tablet className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  }

  function getDeviceInfo(userAgent?: string) {
    if (!userAgent) return 'Unknown device';
    
    // Simple parsing - you might want to use a proper user agent parser
    const ua = userAgent.toLowerCase();
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    return 'Unknown browser';
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          You have {sessions.length} active {sessions.length === 1 ? 'session' : 'sessions'}
        </p>
        {sessions.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={revokeAllOtherSessions}
          >
            Sign out all other sessions
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {sessions.map((session) => {
          const isCurrent = session.id === currentSessionId;
          const createdAt = new Date(session.createdAt);
          
          return (
            <Card key={session.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getDeviceIcon(session.userAgent)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {getDeviceInfo(session.userAgent)}
                      </p>
                      {isCurrent && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {session.ipAddress && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.ipAddress}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(createdAt, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
                {!isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeSession(session.token)}
                    disabled={revokingSession === session.id}
                  >
                    {revokingSession === session.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Revoke'
                    )}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
