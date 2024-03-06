import { ChatHistory } from "./models/model_adapter";

type EntryBase = {
	id: string;
	name: string;
	modelId: string;
};

export type ChatEntry = EntryBase & {
	type: "chat";
	messages: ChatHistory;
};

export type StructuredPromptEntry = EntryBase & {
	type: "structured-prompt";
	prompts: string[];
};

export type InstructPromptEntry = EntryBase & {
	type: "instruct-prompt";
	prompt: string;
};

export type Entry = ChatEntry | StructuredPromptEntry | InstructPromptEntry;
export type ChatStorage = {
	[key: string]: Entry;
};

export type PointerEntry = {
	type: "pointer";
	refId: string;
	refType: "chat" | "structured-prompt" | "instruct-prompt";
};

export type Folder = {
	name: string;
	type: "folder";
	id: string;
	entries: (PointerEntry | Folder)[];
};
export type RootFolder = (PointerEntry | Folder)[];

export type StorageUpdater<T> = (newValue: T | ((oldValue: T) => T)) => void;
