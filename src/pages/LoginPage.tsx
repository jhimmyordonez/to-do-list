import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
    const { user, loading, signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (user) {
        return <Navigate to="/todos" replace />;
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const { error } = await signIn(email, password);
            if (error) {
                setError(error.message);
            }
        } finally {
            setIsSubmitting(false);
        }
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
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
                        <span className="text-3xl">✅</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">Daily To-Do</h1>
                    <p className="text-indigo-200 mt-2">Organize your day, one task at a time</p>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign In</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

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
                                required
                                disabled={isSubmitting}
                                placeholder="you@email.com"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm
                         focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                         placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                                required
                                disabled={isSubmitting}
                                minLength={6}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm
                         focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                         placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
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
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <span>Sign In</span>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-gray-500">
                        Contact your administrator to create an account.
                    </p>
                </div>
            </div>
        </div>
    );
}
