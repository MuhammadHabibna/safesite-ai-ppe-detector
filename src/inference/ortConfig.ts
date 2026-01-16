import * as ort from 'onnxruntime-web';

// Initialize ONNX Runtime Web configuration
// Initialize ONNX Runtime Web configuration
// Initialize ONNX Runtime Web configuration
export function initOrtConfig() {
    // CDN URL for version 1.23.2
    // Pinning exact version is important to match the installed package
    const cdnUrl = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/';

    // Set WASM paths to CDN
    ort.env.wasm.wasmPaths = cdnUrl;

    // Disable threads to avoid COOP/COEP issues.
    ort.env.wasm.numThreads = 1;

    // SIMD is usually safe and boosts performance
    ort.env.wasm.simd = true;

    console.log('[ORT Config] wasmPaths:', ort.env.wasm.wasmPaths);
    console.log('[ORT Config] numThreads:', ort.env.wasm.numThreads);
    console.log('[ORT Config] simd:', ort.env.wasm.simd);
    console.log('[ORT Config] crossOriginIsolated:', window.crossOriginIsolated);
}
