import React, { useState, useEffect, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { Camera, Download, Play, AlertTriangle, CheckCircle, RefreshCw, FileUp, Image as ImageIcon } from 'lucide-react';
import type { Tensor } from 'onnxruntime-web';
import { MODELS } from '../inference/models';
import { loadSession } from '../inference/loadSession';
import { preprocess } from '../inference/preprocess';
import { postprocess, type Detection } from '../inference/postprocess';
import { OverlayCanvas } from '../components/OverlayCanvas';
import clsx from 'clsx';

export const Demo: React.FC = () => {
    const [modelId, setModelId] = useState(MODELS[0].id);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'webcam' | 'image'>('webcam');
    const [isCapturing, setIsCapturing] = useState(false);

    // Inference Params
    const [confThreshold, setConfThreshold] = useState(0.25);
    const [iouThreshold, setIouThreshold] = useState(0.45);

    // UI Toggles
    const [showLabels, setShowLabels] = useState(true);
    const [showConf, setShowConf] = useState(true);
    const [highlightViolations, setHighlightViolations] = useState(false);

    // Stats
    const [inferenceTime, setInferenceTime] = useState(0);
    const [fps, setFps] = useState(0);
    const [detections, setDetections] = useState<Detection[]>([]);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const requestRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
    const sessionRef = useRef<any>(null); // LoadedModel
    const containerRef = useRef<HTMLDivElement>(null);

    // Caching for Refresh
    const [lastRawOutput, setLastRawOutput] = useState<Tensor | null>(null);
    const [lastMetadata, setLastMetadata] = useState<any | null>(null);
    const [pendingSettings, setPendingSettings] = useState(false);


    // Watch for settings changes to trigger pending state (only in Image mode)
    useEffect(() => {
        if (mode === 'image' && lastRawOutput) {
            setPendingSettings(true);
        }
    }, [confThreshold, iouThreshold]);

    const currentModel = MODELS.find(m => m.id === modelId)!;

    // Load Model
    useEffect(() => {
        let mounted = true;
        const init = async () => {
            setLoading(true);
            setError(null);
            setIsCapturing(false);
            try {
                const loaded = await loadSession(currentModel);
                if (mounted) {
                    sessionRef.current = loaded;
                    // Set defaults from model config
                    setConfThreshold(loaded.config.confThreshold);
                    setIouThreshold(loaded.config.iouThreshold);
                    setLoading(false);
                }
            } catch (e: any) {
                if (mounted) {
                    setError(e.message);
                    setLoading(false);
                }
            }
        };
        init();
        return () => { mounted = false; cancelAnimationFrame(requestRef.current!); };
    }, [modelId]);

    // Webcam Loop
    const runInference = useCallback(async () => {
        if (!sessionRef.current || !isCapturing || mode !== 'webcam') return;

        const video = videoRef.current;
        if (!video || video.readyState < 2) {
            requestRef.current = requestAnimationFrame(runInference);
            return;
        }

        const t0 = performance.now();
        try {
            // Preprocess
            const { tensor, metadata } = preprocess(video, currentModel.inputSize);

            // Run
            const feeds: Record<string, any> = {};
            feeds[sessionRef.current.session.inputNames[0]] = tensor;
            const outputMap = await sessionRef.current.session.run(feeds);
            const outputTensor = outputMap[sessionRef.current.session.outputNames[0]];

            // Postprocess
            const dets = postprocess(
                outputTensor,
                0,
                sessionRef.current.labels,
                currentModel,
                metadata
            );

            // Update State
            setDetections(dets);

            const t1 = performance.now();
            const dt = t1 - t0;
            setInferenceTime(dt);

            // FPS
            const now = performance.now();
            const delta = now - lastTimeRef.current;
            if (delta >= 1000) {
                setFps(1000 / dt); // approx instantaneous fps based on inference time, or count frames? 
                // Better: count frames in 1 sec. For simple demo, 1000/dt is "potential fps", but real fps includes overhead.
                // Let's just smooth it:
            }
            lastTimeRef.current = now;

        } catch (e) {
            console.error(e);
            setIsCapturing(false);
        }

        requestRef.current = requestAnimationFrame(runInference);
    }, [isCapturing, mode, currentModel]);

    useEffect(() => {
        if (isCapturing && mode === 'webcam') {
            requestRef.current = requestAnimationFrame(runInference);
        } else {
            cancelAnimationFrame(requestRef.current!);
        }
        return () => cancelAnimationFrame(requestRef.current!);
    }, [isCapturing, mode, runInference]);

    const toggleCamera = async () => {
        if (isCapturing) {
            setIsCapturing(false);
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(t => t.stop());
            if (videoRef.current) videoRef.current.srcObject = null;
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1280 } }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play();
                        setIsCapturing(true);
                    };
                }
            } catch (e) {
                alert('Camera access denied or failed');
            }
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);

            // Reset state
            setMode('image');
            setIsCapturing(false);
            setDetections([]);
            setLastRawOutput(null);
            setLastMetadata(null);
            setPendingSettings(false);

            if (imageRef.current) {
                imageRef.current.onload = async () => {
                    runImageInference();
                };
                imageRef.current.src = url;
            }
        }
    };

    const runImageInference = async () => {
        if (!sessionRef.current || !imageRef.current) return;

        setLoading(true);
        try {
            const t0 = performance.now();
            const { tensor, metadata } = preprocess(imageRef.current, currentModel.inputSize);

            const feeds: any = {};
            feeds[sessionRef.current.session.inputNames[0]] = tensor;

            // Run Inference
            const res = await sessionRef.current.session.run(feeds);
            const outputTensor = res[sessionRef.current.session.outputNames[0]];

            // Cache raw output
            setLastRawOutput(outputTensor);
            setLastMetadata(metadata);

            // Postprocess
            const dets = postprocess(outputTensor, 0, sessionRef.current.labels, currentModel, metadata);
            setDetections(dets);

            setInferenceTime(performance.now() - t0);
            setPendingSettings(false);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = useCallback(() => {
        if (!lastRawOutput || !lastMetadata || !sessionRef.current) {
            // If no cache, try full run if image exists
            if (mode === 'image' && imageRef.current) {
                runImageInference();
            }
            return;
        }

        const t0 = performance.now();
        const dets = postprocess(lastRawOutput, 0, sessionRef.current.labels, currentModel, lastMetadata);
        setDetections(dets);
        setInferenceTime(performance.now() - t0); // fast!
        setPendingSettings(false);
    }, [lastRawOutput, lastMetadata, currentModel, confThreshold, iouThreshold]);

    // Export
    const downloadJSON = () => {
        const data = JSON.stringify(detections, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `detections-${Date.now()}.json`;
        a.click();
    };

    const downloadCSV = () => {
        const csv = Papa.unparse(detections);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `detections-${Date.now()}.csv`;
        a.click();
    };



    // PPE Summary
    const ppeStats = detections.reduce((acc, d) => {
        const l = d.label.toLowerCase();
        if (l.includes('no helmet')) acc.noHelmet++;
        else if (l.includes('helmet')) acc.helmet++;
        if (l.includes('no vest')) acc.noVest++;
        else if (l.includes('vest')) acc.vest++;
        return acc;
    }, { helmet: 0, noHelmet: 0, vest: 0, noVest: 0 });

    const ppeCompliant = ppeStats.noHelmet === 0 && ppeStats.noVest === 0 && (ppeStats.helmet > 0 || ppeStats.vest > 0);

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            {/* Top Controls */}
            {/* Top Controls */}
            <div className="bg-white border-b border-neutral-200 p-4 flex flex-wrap items-center gap-4 justify-between">

                <div className="flex items-center gap-4">
                    {/* Primary Upload Button */}
                    <label className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg font-bold cursor-pointer transition",
                        mode === 'image'
                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    )}>
                        <FileUp size={20} />
                        <span>Upload Image</span>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/bmp,image/gif"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                    </label>

                    <div className="h-6 w-px bg-neutral-300 mx-2 hidden md:block"></div>

                    <div className="flex bg-neutral-100 p-1 rounded-lg">
                        {MODELS.map(m => (
                            <button
                                key={m.id}
                                onClick={() => setModelId(m.id)}
                                className={clsx(
                                    "px-4 py-2 rounded-md text-sm font-medium transition",
                                    modelId === m.id ? "bg-white shadow text-neutral-900" : "text-neutral-500 hover:text-neutral-700"
                                )}
                            >
                                {m.name}
                            </button>
                        ))}
                    </div>


                </div>

                <div className="flex items-center gap-4">
                    {loading && <span className="text-yellow-600 text-sm animate-pulse font-medium">Processing...</span>}
                    {error && <span className="text-red-600 text-sm font-bold">Error: {error}</span>}

                    <button
                        onClick={() => setMode('webcam')}
                        className={clsx(
                            "flex items-center gap-2 px-3 py-2 rounded hover:bg-neutral-100 transition",
                            mode === 'webcam' ? "text-blue-600 font-bold bg-blue-50" : "text-neutral-500"
                        )}
                        title="Switch to Webcam"
                    >
                        <Camera size={20} />
                        <span className="hidden sm:inline">Webcam</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Canvas Area */}
                <div className="flex-1 bg-neutral-900 relative flex items-center justify-center p-4">
                    <div ref={containerRef} className="relative shadow-2xl overflow-hidden rounded-lg bg-black" style={{ maxHeight: '100%', maxWidth: '100%' }}>
                        {mode === 'webcam' ? (
                            <video
                                ref={videoRef}
                                muted
                                playsInline
                                className="block max-h-full max-w-full"
                                style={{ height: 'auto', width: 'auto', maxHeight: '80vh' }}
                            />
                        ) : (
                            <img
                                ref={imageRef}
                                className="block max-h-full max-w-full"
                                style={{ height: 'auto', width: 'auto', maxHeight: '80vh' }}
                                alt="Input"
                            />
                        )}
                        {/* Placeholder when no image/video */}
                        {!imageRef.current?.src && mode === 'image' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 pointer-events-none">
                                <ImageIcon size={64} className="mb-4 opacity-50" />
                                <p className="font-medium">Upload an image to start detection</p>
                                <p className="text-xs mt-2 opacity-70">Supports JPG, PNG, WEBP</p>
                            </div>
                        )}

                        {/* Placeholder when no image/video */}
                        {!imageRef.current?.src && mode === 'image' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-500 pointer-events-none">
                                <ImageIcon size={64} className="mb-4 opacity-50" />
                                <p className="font-medium">Upload an image to start detection</p>
                                <p className="text-xs mt-2 opacity-70">Supports JPG, PNG, WEBP</p>
                            </div>
                        )}

                        <OverlayCanvas
                            image={mode === 'webcam' ? videoRef.current : imageRef.current}
                            detections={detections}
                            modelConfig={currentModel}
                            width={mode === 'webcam' ? videoRef.current?.videoWidth || 640 : imageRef.current?.naturalWidth || 640}
                            height={mode === 'webcam' ? videoRef.current?.videoHeight || 480 : imageRef.current?.naturalHeight || 480}
                            showLabels={showLabels}
                            showConf={showConf}
                            highlightViolations={highlightViolations && currentModel.type === 'ppe'}
                        />
                    </div>

                    {mode === 'webcam' && !isCapturing && !loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                            <button
                                onClick={toggleCamera}
                                className="bg-yellow-400 text-neutral-900 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-yellow-300 transition"
                            >
                                <Play fill="currentColor" /> Start Camera
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar Controls */}
                <div className="w-80 bg-white border-l border-neutral-200 overflow-y-auto p-4 flex flex-col gap-6">

                    {/* Stats Panel */}
                    <div className="bg-neutral-50 p-4 rounded border border-neutral-100">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase mb-2">Performance</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <div className="text-neutral-400 text-xs">Inference</div>
                                <div className="font-mono font-bold">{inferenceTime.toFixed(1)} ms</div>
                            </div>
                            <div>
                                <div className="text-neutral-400 text-xs">FPS (Est)</div>
                                <div className="font-mono font-bold">{fps.toFixed(1)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Config */}
                    <div>
                        <h3 className="text-xs font-bold text-neutral-500 uppercase mb-4">Settings</h3>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Confidence</span>
                                    <span className="text-neutral-500">{Math.round(confThreshold * 100)}%</span>
                                </div>
                                <input
                                    type="range" min="0.1" max="0.9" step="0.05"
                                    value={confThreshold} onChange={e => setConfThreshold(parseFloat(e.target.value))}
                                    className="w-full accent-yellow-400"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>IoU Threshold</span>
                                    <span className="text-neutral-500">{Math.round(iouThreshold * 100)}%</span>
                                </div>
                                <input
                                    type="range" min="0.1" max="0.9" step="0.05"
                                    value={iouThreshold} onChange={e => setIouThreshold(parseFloat(e.target.value))}
                                    className="w-full accent-yellow-400"
                                />
                            </div>

                        </div>

                        {/* Refresh Button */}
                        <div className="pt-2">
                            <button
                                onClick={handleRefresh}
                                disabled={!pendingSettings && !!lastRawOutput}
                                className={clsx(
                                    "w-full flex items-center justify-center gap-2 px-4 py-2 rounded font-bold transition",
                                    pendingSettings
                                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md animate-pulse"
                                        : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                                )}
                            >
                                <RefreshCw size={16} className={clsx(pendingSettings && "animate-spin-slow")} />
                                Refresh Results
                            </button>
                            {pendingSettings && (
                                <p className="text-xs text-center text-blue-600 mt-1 font-medium">
                                    Settings changed - click Refresh to apply
                                </p>
                            )}
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} className="accent-yellow-400" />
                                Show Labels
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={showConf} onChange={e => setShowConf(e.target.checked)} className="accent-yellow-400" />
                                Show Confidence
                            </label>
                            {currentModel.type === 'ppe' && (
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={highlightViolations} onChange={e => setHighlightViolations(e.target.checked)} className="accent-yellow-400 h-4 w-4" />
                                    <span className="text-red-600 font-medium">Highlight Violations Only</span>
                                </label>
                            )}
                        </div>
                    </div>


                    {/* Results / Filter */}
                    <div className="flex-1 min-h-[200px]">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase mb-2">Detections ({detections.length})</h3>

                        {/* PPE Summary Check */}
                        {currentModel.type === 'ppe' && detections.length > 0 && (
                            <div className={clsx("p-3 rounded mb-3 flex items-center gap-3", ppeCompliant ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                                {ppeCompliant ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                <div className="text-sm font-bold">
                                    {ppeCompliant ? "Fully Compliant" : "Safety Violation Detected"}
                                </div>
                            </div>
                        )}

                        <div className="space-y-1 max-h-60 overflow-y-auto text-sm">
                            {detections.map((d, i) => (
                                <div key={i} className="flex justify-between p-2 bg-neutral-50 rounded hover:bg-neutral-100">
                                    <span>{d.label}</span>
                                    <span className="font-mono text-neutral-500">{(d.confidence * 100).toFixed(0)}%</span>
                                </div>
                            ))}
                            {detections.length === 0 && <div className="text-neutral-400 text-center py-4">No detections</div>}
                        </div>
                    </div>

                    {/* Exports */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                        <button onClick={downloadJSON} className="flex items-center justify-center gap-1 p-2 bg-neutral-100 rounded text-xs hover:bg-neutral-200">
                            <Download size={14} /> JSON
                        </button>
                        <button onClick={downloadCSV} className="flex items-center justify-center gap-1 p-2 bg-neutral-100 rounded text-xs hover:bg-neutral-200">
                            <Download size={14} /> CSV
                        </button>
                    </div>

                </div>
            </div>
        </div >
    );
};
