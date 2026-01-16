import React from 'react';
import { BookOpen, AlertTriangle } from 'lucide-react';

export const Docs: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="flex items-center gap-3 mb-8">
                <BookOpen className="text-yellow-500" size={32} />
                <h1 className="text-3xl font-bold">Documentation</h1>
            </div>

            <div className="space-y-8">
                <section>
                    <h2 className="text-2xl font-bold mb-4">How to Use</h2>
                    <div className="prose prose-neutral">
                        <ol>
                            <li>Go to the <strong>Demo</strong> page.</li>
                            <li>Select your preferred model (PPE for safety gear, COCO for general objects).</li>
                            <li>Allow camera access OR upload an image.</li>
                            <li>Adjust the confidence threshold if you see too many or too few boxes.</li>
                            <li>Use the controls to toggle labels or violation highlighting.</li>
                        </ol>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">Model Details</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded border-neutral-200">
                            <h3 className="font-bold">PPE Detector</h3>
                            <p className="text-sm text-neutral-600 mt-2">
                                Detects 4 classes: <code>Helmet</code>, <code>No Helmet</code>, <code>Vest</code>, <code>No Vest</code>.
                                Optimized for construction sites.
                            </p>
                        </div>
                        <div className="p-4 border rounded border-neutral-200">
                            <h3 className="font-bold">COCO Detector</h3>
                            <p className="text-sm text-neutral-600 mt-2">
                                Standard YOLOv12s model trained on Microsoft COCO dataset. Detects 80 classes including <code>person</code>, <code>vehicle</code>, <code>machinery</code>.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="bg-neutral-100 p-6 rounded-lg">
                    <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-yellow-600" />
                        Limitations
                    </h2>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-neutral-700">
                        <li><strong>Browser Only:</strong> Performance depends on your device GPU/CPU. Mobiles may be slower.</li>
                        <li><strong>Dataset Bias:</strong> The PPE model may not work perfectly in all lighting conditions or angles not represented in the training set.</li>
                        <li><strong>Memory:</strong> High-resolution inputs are resized to 640x640, which may miss small objects.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">troubleshooting</h2>
                    <ul className="space-y-4">
                        <li>
                            <strong>Model not found (404):</strong> Ensure <code>.onnx</code> files are placed in <code>public/models/</code>. Check the /debug page.
                        </li>
                        <li>
                            <strong>Initialization Failed:</strong> Verify WebAssembly (WASM) files are loaded correctly. We use single-threaded WASM to ensure compatibility with all hosting providers.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">Exporting Your Own Models</h2>
                    <p className="mb-2">To use your own YOLO models, export them using:</p>
                    <code className="block bg-neutral-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
                        yolo export model=best.pt format=onnx imgsz=640 simplify opset=12
                    </code>
                </section>
            </div>
        </div>
    );
};
