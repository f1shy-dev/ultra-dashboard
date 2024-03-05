import { generateShortUUID } from "@/lib/utils";
import {
	ToolCall,
	ToolfulModelInit,
	UserExposedOptions,
} from "./model_adapter";

const OpenAIOptions: UserExposedOptions<"apiKey"> = {
	apiKey: {
		type: "string",
		required: true,
		value: "",
		name: "API Key",
		description: "Your OpenAI API key",
	},
};

type OpenAIAdapterBuilderProps = {
	userExposedOptions: typeof OpenAIOptions;
	modelId: string;
	name: string;
	description?: string;
};

type OpenAIAdapterBuilderType = (
	props: OpenAIAdapterBuilderProps,
) => ToolfulModelInit<"apiKey">;

const OpenAIAdapterBuilder: OpenAIAdapterBuilderType = ({
	userExposedOptions,
	modelId,
	name,
	description,
}) => {
	const init: ToolfulModelInit<"apiKey"> = {
		name,
		description,
		id: `openai-${modelId}`,
		supportedGenerationOptions: [
			"temperature",
			"maxTokens",
			"topP",
			"frequencyPenalty",
			"presencePenalty",
		],
		userExposedOptions,
		supportsTools: true,
		generate: async (messages, options, userOptions) => {
			const res = await fetch("https://api.openai.com/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${userOptions.apiKey}`,
				},
				body: JSON.stringify({
					model: modelId,
					messages: messages.map((m) => ({
						role: m.type,
						content: m.content,
					})),
					temperature: options.temperature || 0.7,
					max_tokens: options.maxTokens || 256,
					top_p: options.topP || 1,
					frequency_penalty: options.frequencyPenalty || 0,
					presence_penalty: options.presencePenalty || 0,
				}),
			});

			const data = await res.json();

			if (data.error) {
				return {
					id: `error-${generateShortUUID()}`,
					type: "model" as const,
					status: "error",
					content: data.error.message,
					timestamp: Date.now(),
				};
			}
			const toolCalls: ToolCall<unknown>[] = [];
			try {
				if (data.choices[0].message.tool_calls) {
					for (const toolCall of data.choices[0].message.tool_calls) {
						const functionName = toolCall.function.name;
						const functionArgs = JSON.parse(toolCall.function.arguments);
						toolCalls.push({
							toolId: functionName,
							callId: toolCall.id,
							data: functionArgs,
						});
					}
				}
			} catch (e) {
				return {
					id: "error",
					type: "model" as const,
					status: "error",
					content: "Model returned an invalid tool call",
					timestamp: Date.now(),
				};
			}

			return {
				id: "success",
				type: "model" as const,
				status: "success",
				content: data.choices[0].message.content,
				timestamp: Date.now(),
				toolCalls,
			};
		},
	};

	return init;
};

export const GPT35TurboAdapter = OpenAIAdapterBuilder({
	userExposedOptions: OpenAIOptions,
	modelId: "gpt-3.5-turbo",
	name: "OpenAI GPT-3.5 Turbo",
});

export const GPT4TurboAdapter = OpenAIAdapterBuilder({
	userExposedOptions: OpenAIOptions,
	modelId: "gpt-4-turbo-preview",
	name: "OpenAI GPT-4 Turbo",
});
