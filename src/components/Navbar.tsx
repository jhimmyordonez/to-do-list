import { useAuth } from '../context/AuthContext';

export function Navbar() {
    const { user, signOut, isDemo } = useAuth();

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
                        {isDemo && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                                Demo
                            </span>
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
