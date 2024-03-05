import { ChatStorage, Entry, RootFolder } from "./shared";
import { atomWithStorage } from "jotai/utils";
import { atom } from "jotai";
import { withImmer } from "jotai-immer";
import { UserExposedOptionsValuesStore } from "./models/model_adapter";

export const modelConfigAtom = withImmer(
	atomWithStorage<UserExposedOptionsValuesStore<string>>("atom-model_opts", {}),
);

export const chatStorageAtom = withImmer(
	atomWithStorage<ChatStorage>("atom-chat_storage", {}),
);
export const chatFilesystemAtom = withImmer(
	atomWithStorage<RootFolder>("atom-chat_fs", []),
);

console.log("*atoms.init", chatStorageAtom, chatFilesystemAtom);

export const singleChatAtom = (path: string[]) =>
	atom(
		(get) => {
			const chatStorage = get(chatStorageAtom);
			return chatStorage?.[path[path.length - 1]];
		},
		(get, set, newChat: (old: Entry | undefined) => Entry) => {
			set(chatStorageAtom, (old) => {
				return {
					...old,
					[path[path.length - 1]]: newChat(old?.[path[path.length - 1]]),
				};
			});
		},
	);
