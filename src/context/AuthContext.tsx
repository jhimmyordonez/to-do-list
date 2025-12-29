import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isDemo: boolean;
    signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for demo mode
const mockUser: User = {
    id: 'demo-user-123',
    email: 'demo@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
};

const mockSession: Session = {
    access_token: 'demo-token',
    refresh_token: 'demo-refresh',
    expires_in: 3600,
    expires_at: Date.now() / 1000 + 3600,
    token_type: 'bearer',
    user: mockUser,
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const isDemo = !isSupabaseConfigured;

    useEffect(() => {
        if (isDemo) {
            // Demo mode: no auth, just show the app
            setUser(null);
            setSession(null);
            setLoading(false);
            return;
        }

        // Real Supabase mode
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [isDemo]);

    const signUp = async (email: string, password: string) => {
        if (isDemo) {
            // Demo mode: simulate successful registration
            setUser(mockUser);
            setSession(mockSession);
            return { error: null };
        }
        const { error } = await supabase.auth.signUp({ email, password });
        return { error };
    };

    const signIn = async (email: string, password: string) => {
        if (isDemo) {
            // Demo mode: simulate successful login
            setUser({ ...mockUser, email });
            setSession(mockSession);
            return { error: null };
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    const signOut = async () => {
        if (isDemo) {
            setUser(null);
            setSession(null);
            return;
        }
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider
            value={{ user, session, loading, isDemo, signUp, signIn, signOut }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
