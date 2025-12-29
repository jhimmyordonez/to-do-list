import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';

type AuthMode = 'login' | 'register';

export function LoginPage() {
    const { user, loading, signIn, signUp, isDemo } = useAuth();
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Redirect if already authenticated
    if (user) {
        return <Navigate to="/todos" replace />;
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setIsSubmitting(true);

        try {
            if (mode === 'login') {
                const { error } = await signIn(email || 'demo@example.com', password || 'demo123');
                if (error) {
                    setError(error.message);
                }
            } else {
                const { error } = await signUp(email, password);
                if (error) {
                    setError(error.message);
                } else if (!isDemo) {
                    setSuccessMessage(
                        'Account created successfully. Check your email to confirm your account.'
                    );
                    setMode('login');
                    setPassword('');
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDemoAccess = async () => {
        setIsSubmitting(true);
        await signIn('demo@example.com', 'demo123');
        setIsSubmitting(false);
    };

    const toggleMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
        setError(null);
        setSuccessMessage(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 px-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
                        <span className="text-3xl">✅</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">Daily To-Do</h1>
                    <p className="text-indigo-200 mt-2">Organize your day, one task at a time</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* Demo Mode Banner */}
                    {!isSupabaseConfigured && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <span className="text-xl">🎨</span>
                                <div>
                                    <p className="font-medium text-amber-800">Demo Mode Available</p>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Supabase is not configured. You can try the app with temporary data.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleDemoAccess}
                                disabled={isSubmitting}
                                className="mt-3 w-full py-2.5 px-4 bg-amber-500 text-white font-medium rounded-lg
                         hover:bg-amber-600 transition-colors duration-200 
                         disabled:bg-amber-300 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                ) : (
                                    <>
                                        <span>🚀</span>
                                        <span>Enter Demo Mode</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Divider for demo mode */}
                    {!isSupabaseConfigured && (
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-1 h-px bg-gray-200"></div>
                            <span className="text-sm text-gray-400">or continue with</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
                        <button
                            type="button"
                            onClick={() => setMode('login')}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200
                ${mode === 'login'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('register')}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200
                ${mode === 'register'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-600">{successMessage}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required={isSupabaseConfigured}
                                disabled={isSubmitting}
                                placeholder="you@email.com"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm
                         focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                         placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed
                         transition-shadow duration-200"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required={isSupabaseConfigured}
                                disabled={isSubmitting}
                                minLength={6}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm
                         focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                         placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed
                         transition-shadow duration-200"
                            />
                            {mode === 'register' && (
                                <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg shadow-sm
                       hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 
                       focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed
                       transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    <span>{mode === 'login' ? 'Signing in...' : 'Signing up...'}</span>
                                </>
                            ) : (
                                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="mt-6 text-center text-sm text-gray-600">
                        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="text-indigo-600 font-medium hover:text-indigo-500 transition-colors"
                        >
                            {mode === 'login' ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
