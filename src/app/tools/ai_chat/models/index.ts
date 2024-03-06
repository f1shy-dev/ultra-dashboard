import { Llama2_70BAdapter, Mixtral8X7BAdapter } from "./groq";
import { GPT4TurboAdapter, GPT35TurboAdapter } from "./openai";

export const modelAdapters = [
	GPT4TurboAdapter,
	GPT35TurboAdapter,
	Mixtral8X7BAdapter,
	Llama2_70BAdapter,
];
