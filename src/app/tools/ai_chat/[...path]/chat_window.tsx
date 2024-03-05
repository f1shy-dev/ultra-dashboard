"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatEntry, ChatStorage, Entry, StorageUpdater } from "../shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	MingcuteChat4Line,
	MingcuteSendFill,
	MingcuteUser1Line,
} from "@/icons/Mingcute";
import { Textarea } from "@/components/ui/textarea";
import { useMemo, useRef } from "react";
import { modelAdapters } from "../models";
import { cn, generateShortUUID } from "@/lib/utils";
import { useAtom, atom as atomFactory, useAtomValue } from "jotai";
import { modelConfigAtom } from "../atoms";

// million-ignore
export const ChatWindow: React.FC<{
	atom: ReturnType<
		typeof useAtom<
			ChatEntry,
			[newChat: (old: Entry | undefined) => ChatEntry],
			void
		>
	>;
	path: string[];
}> = ({ atom }) => {
	const [chat, setChat] = atom;
	const modelAdapter = useMemo(() => {
		return modelAdapters.find((m) => m.id === chat?.modelId);
	}, [chat?.modelId]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const _optsAtom = useMemo(() => {
		return atomFactory((get) => get(modelConfigAtom)[chat?.modelId]);
	}, [chat?.modelId]);
	const optsAtom = useAtomValue(_optsAtom);

	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	const send = async () => {
		if (!modelAdapter || !textAreaRef.current || !chat) return;
		const content = textAreaRef.current.value.trim();
		if (content === "") return;
		textAreaRef.current.value = "";

		const messages = [
			...(chat as ChatEntry).messages,
			{
				id: generateShortUUID(),
				content,
				status: "success" as const,
				timestamp: Date.now(),
				type: "user" as const,
			},
		];

		setChat((old) => ({
			...(old as ChatEntry),
			messages,
		}));

		console.log("chat.messages", chat.messages);
		const data = await modelAdapter.generate(
			messages,
			{},
			{ apiKey: optsAtom?.apiKey || "" },
			[],
		);

		setChat((old) => ({
			...(old as ChatEntry),
			messages: [
				...(old as ChatEntry).messages,
				{
					...data,
				},
			],
		}));
	};
	if (!modelAdapter) return <div>Internal error: Model not found</div>;
	if (!chat) return <div>Internal error: Chat not found</div>;

	return (
		<div className="h-full w-full relative flex flex-col items-center">
			<ScrollArea className="h-full w-full p-4 md:p-6 max-w-4xl">
				<div className="flex flex-col space-y-4">
					{chat.messages
						.filter((m) => m.type !== "tool-call")
						.map((m, i) => (
							<div key={m.id} className="flex text-left">
								<div className="border rounded-lg h-8 w-8 shrink-0 mr-2 flex items-center justify-center">
									{m.type === "user" ? (
										<MingcuteUser1Line className="w-4 h-4 shrink-0" />
									) : (
										<MingcuteChat4Line className="w-4 h-4 shrink-0" />
									)}
								</div>
								<span
									className={cn(
										"text-sm",
										m.status === "error" ? "text-red-500" : "",
									)}
								>
									{m.content as string}
								</span>
							</div>
						))}
				</div>
			</ScrollArea>

			<div className="absolute bottom-4 w-full px-4 md:max-w-2xl flex">
				<Textarea
					placeholder="Type a message"
					className="max-h-[200px]"
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							if (e.shiftKey) return;
							e.preventDefault();
							send();
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
