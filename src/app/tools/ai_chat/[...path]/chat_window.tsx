"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatEntry, ChatStorage, StorageUpdater } from "../shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MingcuteSendFill } from "@/icons/Mingcute";
import { Textarea } from "@/components/ui/textarea";
import { useMemo, useRef } from "react";
import { modelAdapters } from "../models";
import { generateShortUUID } from "@/lib/utils";
import useLocalStorage from "@/lib/useLocalStorage";

export const ChatWindow: React.FC<{
	chat: ChatEntry;
	updateChat: StorageUpdater<ChatEntry>;
	path: string[];
}> = ({ path }) => {
	const [chatStorage, setChatStorage, getCS] = useLocalStorage<ChatStorage>(
		"ai_chat_store",
		{},
	);

	const chat = chatStorage?.[path[path.length - 1]] as ChatEntry | undefined;

	const modelAdapter = useMemo(() => {
		return modelAdapters.find((m) => m.id === chat?.modelId);
	}, [chat?.modelId]);

	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	const send = async () => {
		if (!modelAdapter || !textAreaRef.current || !chat) return;
		const content = textAreaRef.current.value;
		textAreaRef.current.value = "";
		// updateChat((old) => ({
		// 	...old,
		// 	messages: [
		// 		...old.messages,
		// 		{
		// 			id: generateShortUUID(),
		// 			content,
		// 			status: "success",
		// 			timestamp: Date.now(),
		// 			type: "user",
		// 		},
		// 	],
		// }));

		setChatStorage({
			...chatStorage,
			[path[path.length - 1]]: {
				...chat,
				messages: [
					...chat.messages,
					{
						id: generateShortUUID(),
						content,
						status: "success",
						timestamp: Date.now(),
						type: "user",
					},
				],
			},
		});

		console.log("chat.messages", chat.messages, getCS());
		const data = await modelAdapter.generate(
			chat.messages,
			{},
			{ apiKey: "test" },
			[],
		);

		setChatStorage({
			...chatStorage,
			[path[path.length - 1]]: {
				...chat,
				messages: [
					...chat.messages,
					{
						id: generateShortUUID(),
						content: data.content,
						status: "success",
						timestamp: Date.now(),
						type: "model",
					},
				],
			},
		});
	};
	if (!modelAdapter) return <div>Internal error: Model not found</div>;
	if (!chat) return <div>Internal error: Chat not found</div>;

	return (
		<div className="h-full w-full relative flex flex-col items-center">
			<ScrollArea className="h-full w-full">
				{chat.messages
					.filter((m) => m.type !== "tool-call")
					.map((m, i) => (
						<div key={m.id} className="text-right">
							{m.content as string}
						</div>
					))}
			</ScrollArea>

			<div className="absolute bottom-4 w-full px-4 md:max-w-2xl flex">
				<Textarea
					placeholder="Type a message"
					className="max-h-[200px]"
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							if (e.shiftKey) return;
							e.preventDefault();
						}
					}}
					ref={textAreaRef}
				/>

				<Button
					className="ml-2 shrink-0"
					size="icon"
					onClick={async () => {
						send();
					}}
				>
					<MingcuteSendFill className="w-5 h-5" />
				</Button>
			</div>
		</div>
	);
};
