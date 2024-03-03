"use client";

import useLocalStorage from "@/lib/useLocalStorage";
import { Entry, RootFolder } from "../shared";
import { useMemo, useState } from "react";
import { MingcuteMessage2Line } from "@/icons/Mingcute";
import { ChatWindow } from "./chat_window";

export default function Page({
	params: { path },
}: { params: { path: string[] } }) {
	const [chats, setChats] = useLocalStorage<RootFolder>("ai_chats", []);
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const chat = useMemo(() => {
		let current = chats;
		for (let i = 0; i < path.length; i++) {
			const current_path = path[i];
			if (i === path.length - 1) {
				return current.find((c) => c.id === current_path);
			}
			const folder = current.find((c) => c.id === current_path);
			if (!folder || folder.type !== "folder") {
				return undefined;
			}
			current = folder.entries;
		}
		return current;
	}, [chats, path]) as Entry | undefined;

	const updateChat = (newChat: Entry) => {
		let current = chats;
		for (let i = 0; i < path.length; i++) {
			const current_path = path[i];
			if (i === path.length - 1) {
				current = current.map((c) => (c.id === current_path ? newChat : c));
				break;
			}
			const folder = current.find((c) => c.id === current_path);
			if (!folder || folder.type !== "folder") {
				return;
			}
			current = folder.entries;
		}
	};

	return (
		<div className="flex flex-col w-full h-[calc(100vh-2.25rem)]">
			<div className="flex border-b px-3 py-1.5 text-sm items-center font-medium h-[2.25rem]">
				<MingcuteMessage2Line className="w-4 h-4 mr-2" />
				{chat?.name}
			</div>
			{chat?.type === "chat" && (
				<ChatWindow chat={chat} updateChat={updateChat} />
			)}
		</div>
	);
}
