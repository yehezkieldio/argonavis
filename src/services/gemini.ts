import {
    BlockReason,
    type Content,
    type ContentEmbedding,
    type EmbedContentResponse,
    type GenerateContentResult,
    type GenerationConfig,
    GenerativeModel,
    GoogleGenerativeAI,
    HarmBlockThreshold,
    HarmCategory,
    type SafetySetting
} from "@google/generative-ai";
import { container } from "@sapphire/framework";
import { env } from "#/env";

let genAI: GoogleGenerativeAI | null = null;
const MODEL_NAME = "gemini-2.5-pro-exp-03-25";
const EMBEDDING_MODEL_NAME = "gemini-embedding-exp-03-07";

const generationConfig: GenerationConfig = {
    temperature: 0.8,
    topK: 1,
    topP: 0.9,
    maxOutputTokens: 1024
};

const safetySettings: SafetySetting[] = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
];

const initializeGemini = () => {
    if (!genAI) {
        genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }
};

export async function generateText(prompt: Content[]): Promise<string> {
    initializeGemini();
    if (!genAI) throw new Error("Gemini AI not initialized");

    try {
        const model: GenerativeModel = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig,
            safetySettings
        });
        const result: GenerateContentResult = await model.generateContent({ contents: prompt });

        if (
            !result.response.candidates ||
            result.response.candidates.length === 0 ||
            !result.response.candidates[0]?.content
        ) {
            const blockReason: BlockReason | undefined = result.response.promptFeedback?.blockReason;
            container.logger.warn(`Gemini response blocked. Reason: ${blockReason || "Unknown"}`);
            return `My response was blocked due to safety settings. Reason: ${blockReason || "Unknown"}.`;
        }

        const responseText: string = result.response.text();
        return responseText;
    } catch (e) {
        container.logger.error(`Error initializing Gemini model: ${e}`);
        throw new Error("Gemini model initialization failed");
    }
}

export async function generateEmbedding(text: string): Promise<number[]> {
    initializeGemini();
    if (!genAI) throw new Error("Gemini AI not initialized");

    try {
        const cleanedText = text.replace(/\n/g, " ").trim();
        if (!cleanedText) {
            container.logger.warn("Attempted to embed empty text.");
            throw new Error("Cannot generate embedding for empty text.");
        }

        const model: GenerativeModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL_NAME });
        const result: EmbedContentResponse = await model.embedContent(cleanedText);
        const embedding: ContentEmbedding = result.embedding;
        if (!embedding || !embedding.values) {
            throw new Error("Failed to generate embedding, no values returned.");
        }

        return embedding.values;
    } catch (e) {
        container.logger.error(`Error cleaning text for embedding: ${e}`);
        throw new Error("Text cleaning failed");
    }
}
