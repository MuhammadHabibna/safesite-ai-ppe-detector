import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { HardHat, Bug } from 'lucide-react';

export const Layout: React.FC = () => {
    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col font-sans text-neutral-900">
            <header className="border-b border-yellow-400 bg-neutral-900 text-white sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-yellow-400 p-1.5 rounded text-neutral-900">
                            <HardHat size={24} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-lg tracking-tight">SafeSite <span className="text-yellow-400">AI</span></span>
                    </div>

                    <nav className="flex items-center gap-6 text-sm font-medium">
                        <NavLink to="/" className={({ isActive }) => isActive ? "text-yellow-400" : "hover:text-yellow-200 transition"}>Home</NavLink>
                        <NavLink to="/demo" className={({ isActive }) => isActive ? "text-yellow-400" : "hover:text-yellow-200 transition"}>Demo</NavLink>
                        <NavLink to="/performance" className={({ isActive }) => isActive ? "text-yellow-400" : "hover:text-yellow-200 transition"}>Performance</NavLink>
                        <NavLink to="/docs" className={({ isActive }) => isActive ? "text-yellow-400" : "hover:text-yellow-200 transition"}>Docs</NavLink>
                        <NavLink to="/debug" className="flex items-center gap-1 text-neutral-500 hover:text-white transition">
                            <Bug size={14} /> Debug
                        </NavLink>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                <Outlet />
            </main>

            <footer className="bg-neutral-900 text-neutral-500 py-8 border-t border-neutral-800">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
                    <div className="text-center md:text-left">
                        <p>&copy; {new Date().getFullYear()} SafeSite AI. Client-side ONNX Inference.</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <span className="text-neutral-600">Created by <span className="font-medium text-neutral-300">@muhammadhabibna</span></span>
                        <div className="flex gap-4">
                            <a
                                href="https://www.linkedin.com/in/muhammad-habib-nur-aiman-b82b07313/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-yellow-400 transition-colors"
                            >
                                LinkedIn
                            </a>
                            <a
                                href="https://mhabibstudio.vercel.app/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-yellow-400 transition-colors"
                            >
                                Portfolio
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
