import { pipeline } from "@xenova/transformers";

let embedderPromise: Promise<any> | null = null;

export async function getLocalEmbedder() {
    if (!embedderPromise) {
        embedderPromise = pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
        );
    }

    return embedderPromise;
}

export async function embedText(text: string): Promise<number[]> {
    const embedder = await getLocalEmbedder();

    const output = await embedder(text, {
        pooling: "mean",
        normalize: true,
    });

    return Array.from(output.data as Float32Array);
}
