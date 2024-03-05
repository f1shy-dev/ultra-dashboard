"use client";

import {
	ChatEntry,
	ChatStorage,
	Entry,
	RootFolder,
	StorageUpdater,
} from "../shared";
import { useMemo, useState } from "react";
import { MingcuteMessage2Line } from "@/icons/Mingcute";
import { ChatWindow } from "./chat_window";
import { useLocalStorageValue } from "@react-hookz/web";
import useLocalStorage from "@/lib/useLocalStorage";

export default function Page({
	params: { path },
}: { params: { path: string[] } }) {
	// const {
	// 	value: chatStorage,
	// 	set: setChatStorage,
	// 	fetch: fetchCS,
	// } = useLocalStorageValue<ChatStorage>("ai_chat_store", {
	// 	defaultValue: {},
	// 	initializeWithValue: false,
	// });

	const [chatStorage, setChatStorage, getCS] = useLocalStorage<ChatStorage>(
		"ai_chat_store",
		{},
	);

	const chat = chatStorage?.[path[path.length - 1]] as ChatEntry | undefined;

	const updateChat: StorageUpdater<Entry> = (newChat) => {
		// fetchCS();
		const _chat = chatStorage?.[path[path.length - 1]] as ChatEntry | undefined;
		console.log("newChat", { newChat, _chat });
		if (!chatStorage || !_chat) return;
		if (newChat instanceof Function) {
			setChatStorage({
				...chatStorage,
				[_chat.id]: newChat(_chat),
			});
			console.log("newChat instanceof Function", {
				newChat: newChat(_chat),
				_chat,
				chatStorage,
			});
			return;
		}

		setChatStorage({ ...chatStorage, [_chat.id]: newChat });
	};

	return (
		<div className="flex flex-col w-full h-[calc(100vh-2.25rem)]">
			<div className="flex border-b px-3 py-1.5 text-sm items-center font-medium h-[2.25rem]">
				<MingcuteMessage2Line className="w-4 h-4 mr-2" />
				{chat?.name}
			</div>
			{chat?.type === "chat" && (
				<ChatWindow
					chat={chat}
					path={path}
					updateChat={updateChat as StorageUpdater<ChatEntry>}
				/>
			)}
		</div>
	);
}
