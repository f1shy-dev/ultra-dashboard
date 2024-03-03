import { JSONSchema4 } from "json-schema";

type GenerationOptions = {
	maxTokens: number;
	temperature: number;
	topP: number;
	topK: number;
	presencePenalty: number;
	frequencyPenalty: number;
	n: number;
	stop: string;
};

export type UserExposedOption = {
	type: "number" | "string" | "boolean";
	default?: number | string | boolean;
	required?: boolean;
	value: number | string | boolean;
	name: string;
	description?: string;
};

// interface UserExposedSelectOption<T> {
//     type: "select";
//     default: T;
//     value: T;
//     name: string;
//     description?: string;
//     options: {
//         name: string;
//         value: T;
//     }[];
// }

export type UserExposedOptions<Keys extends string> = {
	[key in Keys]: UserExposedOption;
};

type UserExposedOptionsValue<
	Keys extends string,
	T extends UserExposedOptions<Keys>,
> = {
	[K in keyof T]: T[K]["value"];
};

type _ModelInit<T extends string> = {
	name: string;
	id: string;
	description?: string;
	userExposedOptions?: UserExposedOptions<T>;
	supportedGenerationOptions: (keyof GenerationOptions)[];
	supportsTools: boolean;
};

type MessageBase<T> = {
	id: string;
	content: T;
	status: "success" | "error";
	timestamp: number;
};

interface ToolResponse<S> extends MessageBase<S> {
	type: "tool-call";
	callId?: string;
}

interface Message extends MessageBase<string> {
	type: "user" | "model";
}

export type ChatHistory = (Message | ToolResponse<unknown>)[];

type Tool<T, S> = {
	id: string;
	name: string;
	description: string;
	run: (data: T) => Promise<ToolResponse<S>>;
	schema?: JSONSchema4;
};

export type ToolCall<T> = {
	toolId: string;
	callId?: string;
	data: T;
};

export interface ModelResponse extends Message {
	type: "model";
}

export interface ToolfulModelResponse extends ModelResponse {
	toolCalls?: ToolCall<unknown>[];
}

export interface InstructModelInit<Keys extends string>
	extends _ModelInit<Keys> {
	generate: (
		prompt: string,
		options: Partial<GenerationOptions>,
		userOptions: UserExposedOptionsValue<Keys, UserExposedOptions<Keys>>,
	) => Promise<ModelResponse>;
}

export interface ToollessModelInit<T extends string> extends _ModelInit<T> {
	supportsTools: false;
	generate: (
		messages: ChatHistory,
		options: Partial<GenerationOptions>,
		userOptions: UserExposedOptionsValue<T, UserExposedOptions<T>>,
	) => Promise<ModelResponse>;
}

export interface ToolfulModelInit<T extends string> extends _ModelInit<T> {
	supportsTools: true;
	generate: (
		messages: ChatHistory,
		options: Partial<GenerationOptions>,
		userOptions: UserExposedOptionsValue<T, UserExposedOptions<T>>,
		tools: Tool<unknown, unknown>[],
	) => Promise<ToolfulModelResponse>;
}
