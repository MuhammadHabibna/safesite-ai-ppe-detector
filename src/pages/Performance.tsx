import React from 'react';
import { Activity } from 'lucide-react';

export const Performance: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="flex items-center gap-3 mb-8">
                <Activity className="text-yellow-500" size={32} />
                <h1 className="text-3xl font-bold">Model Performance</h1>
            </div>

            <div className="grid gap-8">
                <section className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        Fine-Tuned PPE Model (YOLOv12s)
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Specialized</span>
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-neutral-50 text-neutral-600 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-4 py-3">Class</th>
                                    <th className="px-4 py-3">Precision (P)</th>
                                    <th className="px-4 py-3">Recall (R)</th>
                                    <th className="px-4 py-3">mAP50</th>
                                    <th className="px-4 py-3">mAP50-95</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                <tr className="font-bold bg-neutral-50/50">
                                    <td className="px-4 py-3">Overall</td>
                                    <td className="px-4 py-3">0.603</td>
                                    <td className="px-4 py-3">0.756</td>
                                    <td className="px-4 py-3">0.720</td>
                                    <td className="px-4 py-3">0.506</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">Helmet</td>
                                    <td className="px-4 py-3">0.590</td>
                                    <td className="px-4 py-3">0.732</td>
                                    <td className="px-4 py-3">0.676</td>
                                    <td className="px-4 py-3">0.473</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">No Helmet</td>
                                    <td className="px-4 py-3">0.591</td>
                                    <td className="px-4 py-3">0.864</td>
                                    <td className="px-4 py-3">0.796</td>
                                    <td className="px-4 py-3">0.592</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">No Vest</td>
                                    <td className="px-4 py-3">0.527</td>
                                    <td className="px-4 py-3">0.604</td>
                                    <td className="px-4 py-3">0.604</td>
                                    <td className="px-4 py-3">0.403</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3">Vest</td>
                                    <td className="px-4 py-3">0.702</td>
                                    <td className="px-4 py-3">0.824</td>
                                    <td className="px-4 py-3">0.806</td>
                                    <td className="px-4 py-3">0.557</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm">
                    <h3 className="font-bold text-lg mb-2">Metrics Explained</h3>
                    <ul className="list-disc pl-5 space-y-2 text-neutral-600 text-sm">
                        <li><strong>FLOPs:</strong> Floating Point Operations. A measure of model complexity. Lower means faster inference.</li>
                        <li><strong>mAP (Mean Average Precision):</strong> The gold standard for object detection accuracy. mAP50 checks if the box overlaps at least 50% with the ground truth.</li>
                        <li><strong>Precision vs Recall:</strong> Precision is "how many detected items were actually correct". Recall is "how many actual items did we find".</li>
                    </ul>
                </section>

                <section className="bg-yellow-50 p-6 rounded-lg border border-yellow-100 text-sm text-yellow-900">
                    <strong>Note on COCO Model:</strong> The generic YOLOv12s COCO model is trained on 80 varied classes (person, car, dog, etc.) and is NOT evaluated against the specific PPE dataset labels above. It is provided for comparison and general object detection tasks.
                </section>
            </div>
        </div>
    );
};
