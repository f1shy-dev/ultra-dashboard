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
import { useAtom } from "jotai";
import { singleChatAtom } from "@/app/tools/ai_chat/shared/atoms";

export default function Page({
	params: { path },
}: { params: { path: string[] } }) {
	const [chat, setChat] = useAtom(useMemo(() => singleChatAtom(path), [path]));

	return (
		<div className="flex flex-col w-full h-[calc(100vh-2.25rem)]">
			<div className="flex border-b px-3 py-1.5 text-sm items-center font-medium h-[2.25rem]">
				<MingcuteMessage2Line className="w-4 h-4 mr-2" />
				{chat?.name || ""}
			</div>
			{chat?.type === "chat" && (
				<ChatWindow atom={[chat, setChat]} path={path} />
			)}
		</div>
	);
}
