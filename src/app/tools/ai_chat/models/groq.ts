import { generateShortUUID } from "@/lib/utils";
import {
	ModelResponse,
	ToolCall,
	ToolfulModelInit,
	ToollessModelInit,
	UserExposedOptions,
} from "./model_adapter";
import {
	SSE,
	SSEOptionsMethod,
	CustomEventType,
	CustomEventDataType,
} from "sse-ts";

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
		streamAnimationWordClamp: 12,
		generate: async ({ messages, options, userOptions }) => {
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

		streamGenerate: async ({
			messages,
			options,
			userOptions,
			onMessageUpdate,
			messageBase,
		}) => {
			const source = new SSE(
				"https://api.groq.com/openai/v1/chat/completions",
				{
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
						temperature: options.temperature || 0.5,
						max_tokens: options.maxTokens || 1024,
						top_p: options.topP || 1,
						stream: true,
					}),
				},
			);

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
				finish();
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
