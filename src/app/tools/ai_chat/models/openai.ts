import { generateShortUUID } from "@/lib/utils";
import {
	ModelResponse,
	ToolCall,
	ToolfulModelInit,
	UserExposedOptions,
} from "./model_adapter";
import {
	CustomEventDataType,
	CustomEventType,
	SSE,
	SSEOptions,
	SSEOptionsMethod,
} from "sse-ts";

const OpenAIOptions: UserExposedOptions<"apiKey"> = {
	apiKey: {
		type: "string",
		required: true,
		value: "",
		name: "API Key",
		description: "Your OpenAI API key",
		default: "",
		placeholder: "sk-1234567890",
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
		streamAnimationWordClamp: 3,
		generate: async ({ messages, options, userOptions }) => {
			const res = await fetch("https://api.openai.com/v1/chat/completions", {
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
					temperature: options.temperature || 0.7,
					max_tokens: options.maxTokens || 256,
					top_p: options.topP || 1,
					frequency_penalty: options.frequencyPenalty || 0,
					presence_penalty: options.presencePenalty || 0,
				}),
			});

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
					id: `error-${generateShortUUID()}`,
					type: "model" as const,
					status: "error",
					content: "Model returned an invalid tool call",
					timestamp: Date.now(),
				};
			}

			return {
				id: data.id,
				type: "model" as const,
				status: "success",
				content: data.choices[0].message.content,
				timestamp: Date.now(),
				toolCalls,
			};
		},

		streamGenerate: async ({
			messages,
			options,
			userOptions,
			onMessageUpdate,
			messageBase,
		}) => {
			const source = new SSE("https://api.openai.com/v1/chat/completions", {
				method: SSEOptionsMethod.POST,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${userOptions.apiKey}`,
				},
				payload: JSON.stringify({
					model: modelId,
					messages: messages.map((m) => ({
						role: m.type === "user" ? "user" : "assistant",
						content: m.content,
					})),
					temperature: options.temperature || 0.7,
					max_tokens: options.maxTokens || 256,
					top_p: options.topP || 1,
					frequency_penalty: options.frequencyPenalty || 0,
					presence_penalty: options.presencePenalty || 0,
					stream: true,
				}),
			});

			// biome-ignore lint/style/useConst: <explanation>
			let msg: Partial<ModelResponse> = {
				id: `stream-${generateShortUUID()}`,
				type: "model" as const,
				status: "success",
				timestamp: Date.now(),
				content: "",
				isDoneStreaming: false,
				...(messageBase || {}),
			};

			const finishedAnnouncer = new EventTarget();
			const finish = () => {
				source.close();
				const _msg = {
					...msg,
					isDoneStreaming: undefined,
				};
				onMessageUpdate(_msg as ModelResponse);
				finishedAnnouncer.dispatchEvent(new Event("done"));
			};

			source.addEventListener("message", (event: CustomEventType) => {
				const dataEvent = event as CustomEventDataType;
				if (
					typeof dataEvent.data === "string" &&
					["done", "[done]", "done\n"].includes(
						dataEvent.data.trim().toLowerCase(),
					)
				) {
					return finish();
				}
				const payload = JSON.parse(dataEvent.data.split("data: ")[0] || "{}");

				if (
					!payload.choices ||
					!payload.choices[0] ||
					!payload.choices[0].delta
				) {
					return;
				}

				if (payload.choices[0].finish_reason) {
					return finish();
				}

				msg = {
					...msg,
					content: msg.content + payload.choices[0].delta.content,
				};

				onMessageUpdate(msg as ModelResponse);
			});

			source.addEventListener("error", (event: CustomEventType) => {
				console.error(event);
			});

			source.addEventListener("open", (event: CustomEventType) => {
				console.log(event);
			});

			source.addEventListener("close", (event: CustomEventType) => {
				console.log(event);
			});

			source.stream();

			await new Promise((resolve) => {
				finishedAnnouncer.addEventListener("done", () => {
					resolve(null);
				});
			});
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
