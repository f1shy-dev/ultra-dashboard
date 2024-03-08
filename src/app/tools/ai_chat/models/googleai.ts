import { generateShortUUID } from "@/lib/utils";
import {
	ModelResponse,
	ToolCall,
	ToolfulModelInit,
	ToollessModelInit,
	UserExposedOptions,
} from "../shared/model_adapter";
import {
	CustomEventDataType,
	CustomEventType,
	SSE,
	SSEOptions,
	SSEOptionsMethod,
} from "sse-ts";

const GoogleAIOptions: UserExposedOptions<"apiKey" | "useProxy"> = {
	apiKey: {
		type: "string",
		required: true,
		value: "",
		name: "API Key",
		description: "Your Google AI Studio API key",
		default: "",
		placeholder: "****-**********",
	},
	useProxy: {
		type: "boolean",
		required: true,
		value: true,
		name: "Use Proxy",
		description: "Use a proxy to access the API (bypass geo-restrictions)",
		default: true,
	},
};

type GoogleAIAdapterBuilderProps = {
	userExposedOptions: typeof GoogleAIOptions;
	modelId: string;
	name: string;
	description?: string;
};

type Init = ToollessModelInit<"apiKey" | "useProxy">;
type GoogleAIAdapterBuilderType = (props: GoogleAIAdapterBuilderProps) => Init;

const GoogleAIAdapterBuilder: GoogleAIAdapterBuilderType = ({
	userExposedOptions,
	modelId,
	name,
	description,
}) => {
	const init: Init = {
		name,
		description,
		id: `googleai-${modelId}`,
		supportedGenerationOptions: [
			"temperature",
			"maxTokens",
			"topP",
			"frequencyPenalty",
			"presencePenalty",
			"topK",
		],
		userExposedOptions,
		supportsTools: false,
		streamAnimationWordClamp: 3,
		generate: async ({ messages, options, userOptions }) => {
			const endpoint = userOptions.useProxy
				? "/api/proxies/gemini"
				: "https://generativelanguage.googleapis.com";
			const res = await fetch(
				`${endpoint}/v1beta/models/${modelId}:generateContent?key=${userOptions.apiKey}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						contents: messages.map((m) => ({
							role: m.type === "user" ? "user" : "model",
							parts: [
								{
									text: m.content,
								},
							],
						})),

						safetySettings: [
							{
								category: "HARM_CATEGORY_HARASSMENT",
								threshold: "BLOCK_ONLY_HIGH",
							},
							{
								category: "HARM_CATEGORY_HATE_SPEECH",
								threshold: "BLOCK_ONLY_HIGH",
							},
							{
								category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
								threshold: "BLOCK_ONLY_HIGH",
							},
							{
								category: "HARM_CATEGORY_DANGEROUS_CONTENT",
								threshold: "BLOCK_ONLY_HIGH",
							},
						],
						generationConfig: {
							temperature: options.temperature || 1.0,
							maxOutputTokens: options.maxTokens || 512,
							topP: options.topP || 1,
							topK: options.topK || 1,
						},
					}),
				},
			);

			const data = await res.json();

			if (data.error || !res.ok) {
				return {
					id: `error-${generateShortUUID()}`,
					type: "model" as const,
					status: "error",
					content: data.error.message,
					timestamp: Date.now(),
				};
			}

			return {
				id: data.id,
				type: "model" as const,
				status: "success",
				content: data.candidates[0].contents.parts
					.map((p: { text: string }) => p.text)
					.join("")
					.trim(),
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
			const endpoint = userOptions.useProxy
				? "/api/proxies/gemini"
				: "https://generativelanguage.googleapis.com";
			const source = new SSE(
				`${endpoint}/v1beta/models/${modelId}:streamGenerateContent?key=${userOptions.apiKey}`,
				{
					method: SSEOptionsMethod.POST,
					headers: {
						"Content-Type": "application/json",
					},
					payload: JSON.stringify({
						contents: messages.map((m) => ({
							role: m.type === "user" ? "user" : "model",
							parts: [
								{
									text: m.content,
								},
							],
						})),

						safetySettings: [
							{
								category: "HARM_CATEGORY_HARASSMENT",
								threshold: "BLOCK_ONLY_HIGH",
							},
							{
								category: "HARM_CATEGORY_HATE_SPEECH",
								threshold: "BLOCK_ONLY_HIGH",
							},
							{
								category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
								threshold: "BLOCK_ONLY_HIGH",
							},
							{
								category: "HARM_CATEGORY_DANGEROUS_CONTENT",
								threshold: "BLOCK_ONLY_HIGH",
							},
						],
						generationConfig: {
							temperature: options.temperature || 1.0,
							maxOutputTokens: options.maxTokens || 512,
							topP: options.topP || 1,
							topK: options.topK || 1,
						},
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
			let finished = false;
			const finish = () => {
				finished = true;
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

				console.log(payload);

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

			const _onStreamFailure = source._onStreamFailure;
			source._onStreamFailure = (event: Event) => {
				if (finished) return;

				if (!event || !event.currentTarget) return _onStreamFailure(event);
				const xml = event.currentTarget as XMLHttpRequest;
				if (xml.status !== 200) {
					console.error(xml);

					try {
						const body = JSON.parse(xml.responseText);

						msg = {
							...msg,
							status: "error",
							content: body[0].error.message || "Unknown error",
						} as ModelResponse;
					} catch (e) {
						msg = {
							...msg,
							status: "error",
							content: "Unknown error",
						} as ModelResponse;
					}
					finish();
				}
			};

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

export const PaLM2LegacyAdapter = GoogleAIAdapterBuilder({
	userExposedOptions: GoogleAIOptions,
	modelId: "chat-bison-001",
	name: "PaLM 2 Chat (Legacy)",
});

export const Gemini1_0ProAdapter = GoogleAIAdapterBuilder({
	userExposedOptions: GoogleAIOptions,
	modelId: "gemini-1.0-pro",
	name: "Gemini 1.0 Pro",
});
