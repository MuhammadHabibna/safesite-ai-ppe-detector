import * as ort from 'onnxruntime-web';
import { getModelUrl, getLabelsUrl, type ModelConfig } from './models';
import { initOrtConfig } from './ortConfig';

interface LoadedModel {
    session: ort.InferenceSession;
    labels: string[];
    config: ModelConfig;
}

const sessionCache = new Map<string, LoadedModel>();
let isOrtConfigured = false;

async function ensureOrtConfigured() {
    if (!isOrtConfigured) {
        initOrtConfig();
        isOrtConfigured = true;
    }
}

async function fetchLabels(url: string): Promise<string[]> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load labels from ${url}`);
    const data = await res.json();
    // Handle both array of strings or { 0: "name" } object format
    if (Array.isArray(data)) return data;
    return Object.values(data);
}

export async function loadSession(config: ModelConfig): Promise<LoadedModel> {
    await ensureOrtConfigured();

    if (sessionCache.has(config.id)) {
        return sessionCache.get(config.id)!;
    }

    const modelUrl = getModelUrl(config);
    const labelsUrl = getLabelsUrl(config);

    // Pre-check assets
    try {
        const check = await fetch(modelUrl, { method: 'HEAD' }); // or GET range 0-0
        if (!check.ok && check.status !== 405) { // 405 Method Not Allowed might happen on some statics for HEAD
            // if HEAD fails, try GET with abort
            console.warn(`HEAD ${modelUrl} failed, trying GET...`);
            const checkGet = await fetch(modelUrl, { method: 'GET', signal: AbortSignal.timeout(2000) }).catch(() => null);
            if (!checkGet || !checkGet.ok) {
                throw new Error(`Model file not found at ${modelUrl} (Status: ${check.status})`);
            }
        }
    } catch (e: any) {
        console.error(`Asset check failed for ${modelUrl}`, e);
        // Proceed anyway? No, better to fail fast with clear error
        // throw new Error(`Model asset check failed: ${e.message}`);
        // Actually, sometimes HEAD fails but full load works. let's log and proceed but be wary.
    }

    console.log(`Loading session for ${config.id} from ${modelUrl}...`);

    const start = performance.now();

    // Start with stable provider: wasm only
    // We avoid webgl/webgpu for now to ensure maximum stability with CDN loading
    const executionProviders = ['wasm'];

    console.log(`[Session] Requested EPs: ${executionProviders.join(', ')}`);

    const sessionOptions: ort.InferenceSession.SessionOptions = {
        executionProviders: executionProviders,
        graphOptimizationLevel: 'all',
    };

    try {
        const session = await ort.InferenceSession.create(modelUrl, sessionOptions);
        const end = performance.now();
        console.log(`Session create took ${(end - start).toFixed(1)}ms`);

        // Load labels
        const labels = await fetchLabels(labelsUrl);

        // Warmup (optional but good)
        // Create dummy input
        const tensor = new ort.Tensor('float32', new Float32Array(1 * 3 * 640 * 640), [1, 3, 640, 640]);
        const feeds: Record<string, ort.Tensor> = {};
        feeds[session.inputNames[0]] = tensor;
        await session.run(feeds);
        console.log('Warmup complete');

        const loaded: LoadedModel = { session, labels, config };
        sessionCache.set(config.id, loaded);
        return loaded;

    } catch (e: any) {
        console.error(`Failed to load model ${config.id}`, e);
        throw new Error(`Failed to init ONNX session: ${e.message}`);
    }
}
