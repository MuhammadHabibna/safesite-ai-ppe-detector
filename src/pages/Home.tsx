import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, HardHat, Zap } from 'lucide-react';

export const Home: React.FC = () => {
    return (
        <div className="bg-neutral-50 min-h-[calc(100vh-64px)]">
            <div className="bg-neutral-900 py-20 px-4 text-center border-b-4 border-yellow-400">
                <div className="flex justify-center mb-6">
                    <div className="bg-yellow-400 p-4 rounded-full shadow-lg shadow-yellow-400/20">
                        <HardHat size={48} className="text-neutral-900" strokeWidth={2} />
                    </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
                    AI Monitoring <span className="text-yellow-400">On The Edge</span>
                </h1>
                <p className="text-neutral-400 max-w-2xl mx-auto text-lg mb-8">
                    Real-time Personal Protective Equipment (PPE) detection running 100% in your browser.
                    No servers, no latency, complete privacy.
                </p>
                <Link
                    to="/demo"
                    className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-neutral-900 font-bold px-8 py-4 rounded-lg transition transform hover:scale-105"
                >
                    <Zap size={20} />
                    Launch Demo
                </Link>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
                <FeatureCard
                    icon={<ShieldCheck size={32} />}
                    title="Privacy First"
                    desc="All video processing happens locally on your device using WebAssembly and WebGL. No data ever leaves your browser."
                />
                <FeatureCard
                    icon={<HardHat size={32} />}
                    title="Dual Mode"
                    desc="Switch instantly between specialized PPE monitoring (Helmets, Vests) and general purpose YOLOv12 object detection."
                />
                <FeatureCard
                    icon={<Zap size={32} />}
                    title="High Performance"
                    desc="Optimized ONNX Runtime integration delivering up to 60 FPS on modern hardware without any backend infrastructure."
                />
            </div>
        </div>
    );
};

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
    <div className="bg-white p-8 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition">
        <div className="text-yellow-500 mb-4">{icon}</div>
        <h3 className="text-xl font-bold mb-2 text-neutral-900">{title}</h3>
        <p className="text-neutral-500 leading-relaxed">{desc}</p>
    </div>
);
