import { useAuth } from '../context/AuthContext';

interface NavbarProps {
    streak?: number;
}

export function Navbar({ streak = 0 }: NavbarProps) {
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">✅</span>
                        <h1 className="text-xl font-bold text-gray-900">Daily To-Do</h1>
                        {streak > 0 && (
                            <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                <span className="text-sm">🔥</span>
                                <span className="text-sm font-bold text-orange-600">{streak}</span>
                            </div>
                        )}
                    </div>

                    {user && (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600 hidden sm:block">
                                {user.email}
                            </span>
                            <button
                                onClick={handleSignOut}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 
                         hover:bg-gray-200 rounded-lg transition-colors duration-200"
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
