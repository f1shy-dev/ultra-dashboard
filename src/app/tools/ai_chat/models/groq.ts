import { generateShortUUID } from "@/lib/utils";
import {
	ToolCall,
	ToolfulModelInit,
	ToollessModelInit,
	UserExposedOptions,
} from "./model_adapter";

const GroqOptions: UserExposedOptions<"apiKey"> = {
	apiKey: {
		type: "string",
		required: true,
		value: "",
		name: "API Key",
		description: "Your Groq API key",
		default: "",
		placeholder: "gsk_************",
	},
};

type GroqAdapterBuilderProps = {
	userExposedOptions: typeof GroqOptions;
	modelId: string;
	name: string;
	description?: string;
};

type GroqAdapterBuilderType = (
	props: GroqAdapterBuilderProps,
) => ToollessModelInit<"apiKey">;

const GroqAdapterBuilder: GroqAdapterBuilderType = ({
	userExposedOptions,
	modelId,
	name,
	description,
}) => {
	const init: ToollessModelInit<"apiKey"> = {
		name,
		description,
		id: `groq-${modelId}`,
		supportedGenerationOptions: ["temperature", "maxTokens", "topP"],
		userExposedOptions,
		supportsTools: false,
		generate: async (messages, options, userOptions) => {
			const res = await fetch(
				"https://api.groq.com/openai/v1/chat/completions",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${userOptions.apiKey}`,
					},
					body: JSON.stringify({
						model: modelId,
						messages: messages.map((m) => ({
							role: m.type === "user" ? "user" : "assistant",
							content: m.content,
						})),
						temperature: options.temperature || 0.5,
						max_tokens: options.maxTokens || 1024,
						top_p: options.topP || 1,
					}),
				},
			);

			const data = await res.json();

			if (data.error || !data.choices[0].message || !res.ok) {
				return {
					id: `error-${generateShortUUID()}`,
					type: "model" as const,
					status: "error",
					content: data.error.message,
					timestamp: Date.now(),
				};
			}

			return {
				id: `success-${generateShortUUID()}`,
				type: "model" as const,
				status: "success",
				content: data.choices[0].message.content,
				timestamp: Date.now(),
			};
		},
	};

	return init;
};

export const Mixtral8X7BAdapter = GroqAdapterBuilder({
	userExposedOptions: GroqOptions,
	modelId: "mixtral-8x7b-32768",
	name: "Groq Mixtral 8x7b Instruct v0.1",
});

export const Llama2_70BAdapter = GroqAdapterBuilder({
	userExposedOptions: GroqOptions,
	modelId: "llama2-70b-4096",
	name: "Groq LLaMA2-70b Chat",
});
