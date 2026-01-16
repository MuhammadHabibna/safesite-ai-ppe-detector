import React, { useState, useEffect } from 'react';

import { MODELS, getModelUrl } from '../inference/models';

export const Debug: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [checks, setChecks] = useState<Record<string, 'pending' | 'ok' | 'fail'>>({});

    const log = (msg: string) => setLogs(p => [...p, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    useEffect(() => {
        // Initial static info

        log(`User Agent: ${navigator.userAgent}`);
        log(`crossOriginIsolated: ${window.crossOriginIsolated}`);
        log(`Base URL: ${import.meta.env.BASE_URL}`);
        log(`Location: ${window.location.href}`);
    }, []);

    const checkUrl = async (key: string, url: string, description: string) => {
        setChecks(p => ({ ...p, [key]: 'pending' }));
        log(`Checking ${description}...`);
        log(`Target URL: ${url}`);

        try {
            const res = await fetch(url, { method: 'HEAD' });
            const status = res.status;
            log(`HTTP Status: ${status} ${res.statusText}`);

            if (res.ok) {
                setChecks(p => ({ ...p, [key]: 'ok' }));
                log('✅ Resource accessible');
            } else {
                // Fallback to GET for some servers
                log('HEAD failed, trying GET...');
                const resGet = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-10' } }); // Try partial
                log(`GET Status: ${resGet.status}`);
                if (resGet.ok) {
                    setChecks(p => ({ ...p, [key]: 'ok' }));
                    log('✅ Resource accessible via GET');
                } else {
                    throw new Error(`Status ${status}`);
                }
            }
        } catch (e: any) {
            setChecks(p => ({ ...p, [key]: 'fail' }));
            log(`❌ Failed: ${e.message}`);
        }
    };

    const checkWasm = async () => {
        // Check for ort-wasm.wasm


        // Actually verify how ort uses it.
        // For debug, just check the file we expect to exist.
        const expectedUrl = `${import.meta.env.BASE_URL}ort/ort-wasm.wasm`;
        await checkUrl('wasm', expectedUrl, 'ORT WASM File');

        const mjsUrl = `${import.meta.env.BASE_URL}ort/ort-wasm-simd-threaded.jsep.mjs`;
        await checkUrl('mjs', mjsUrl, 'ORT JSEP MJS File');
    };

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">System Debug</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">Asset Verification</h2>
                    <div className="flex flex-col gap-3">
                        {MODELS.map(m => (
                            <button
                                key={m.id}
                                onClick={() => checkUrl(m.id, getModelUrl(m), `Model: ${m.name}`)}
                                className="flex items-center justify-between px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded text-left transition"
                            >
                                <span>Check {m.name}</span>
                                <StatusBadge status={checks[m.id]} />
                            </button>
                        ))}

                        <button
                            onClick={checkWasm}
                            className="flex items-center justify-between px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded text-left transition"
                        >
                            <span>Check ORT WASM</span>
                            <StatusBadge status={checks['wasm']} />
                        </button>
                    </div>
                </div>

                <div className="bg-neutral-900 text-green-400 p-6 rounded-lg font-mono text-sm h-96 overflow-y-auto">
                    <div className="sticky top-0 bg-neutral-900 pb-2 border-b border-neutral-800 mb-2 font-bold text-white flex justify-between">
                        <span>Debug Log</span>
                        <button onClick={() => setLogs([])} className="text-xs text-neutral-500 hover:text-white">Clear</button>
                    </div>
                    {logs.map((L, i) => (
                        <div key={i} className="mb-1">{L}</div>
                    ))}
                    {logs.length === 0 && <span className="text-neutral-600">Ready...</span>}
                </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg text-blue-900 text-sm">
                <strong>Tip:</strong> If assets 404, verify that the <code>.onnx</code> files are in <code>public/models/</code> and the WASM files are in <code>public/ort/</code>.
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status?: 'pending' | 'ok' | 'fail' }) => {
    if (!status) return <span className="text-neutral-400 text-xs">Idle</span>;
    if (status === 'pending') return <span className="text-yellow-600 text-xs font-bold animate-pulse">Running...</span>;
    if (status === 'ok') return <span className="text-green-600 text-xs font-bold">OK</span>;
    return <span className="text-red-600 text-xs font-bold">FAIL</span>;
};
