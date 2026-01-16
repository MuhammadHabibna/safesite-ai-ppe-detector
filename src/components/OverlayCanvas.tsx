import React, { useEffect, useRef } from 'react';
import type { Detection } from '../inference/postprocess';
import type { ModelConfig } from '../inference/models';

interface OverlayCanvasProps {
    image: HTMLImageElement | HTMLVideoElement | null;
    detections: Detection[];
    modelConfig: ModelConfig | null;
    width: number;
    height: number;
    showLabels: boolean;
    showConf: boolean;
    highlightViolations: boolean; // Only for PPE
}

export const OverlayCanvas: React.FC<OverlayCanvasProps> = ({
    image,
    detections,
    modelConfig,
    width,
    height,
    showLabels,
    showConf,
    highlightViolations
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear and match size
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);

        // Draw background image if provided (for screenshot export)
        if (image) {
            if (image instanceof HTMLVideoElement) {
                if (image.readyState >= 2) {
                    ctx.drawImage(image, 0, 0, width, height);
                }
            } else {
                ctx.drawImage(image, 0, 0, width, height);
            }
        }

        // Draw Detections
        detections.forEach(det => {
            const isPPE = modelConfig?.type === 'ppe';
            const labelLower = det.label.toLowerCase();

            let color = '#00FF00'; // Default Green
            let strokeWidth = 3;

            if (isPPE) {
                // Violations: "no helmet", "no vest"
                if (labelLower.includes('no helmet') || labelLower.includes('no vest')) {
                    color = '#FF4444'; // Red
                    if (highlightViolations) {
                        strokeWidth = 5;
                    }
                } else {
                    // Compliant
                    color = '#00FF00';
                    // If highlighting violations only, maybe dim compliant ones? 
                    // User: "highlight violations only (PPE mode only)" usually means hide or dim others?
                    // "toggles: highlight violations only"
                    // Let's assume implies emphasize violation.
                    if (highlightViolations) {
                        // Maybe make compliant transparent?
                        // Or just keep green.
                    }
                }
            } else {
                // COCO
                color = '#00FFFF'; // Cyan
            }

            ctx.strokeStyle = color;
            ctx.lineWidth = strokeWidth;
            ctx.beginPath();
            ctx.rect(det.x1, det.y1, det.x2 - det.x1, det.y2 - det.y1);
            ctx.stroke();

            if (showLabels) {
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.8;
                const text = `${det.label}${showConf ? ` ${Math.round(det.confidence * 100)}%` : ''}`;
                const px = 16;
                ctx.font = `bold ${px}px Inter, sans-serif`;
                const textWidth = ctx.measureText(text).width;

                ctx.fillRect(det.x1, det.y1 - px - 6, textWidth + 10, px + 6);
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = '#000000';
                ctx.fillText(text, det.x1 + 5, det.y1 - 5);
            }
        });

    }, [image, detections, width, height, showLabels, showConf, highlightViolations, modelConfig]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
    );
};
