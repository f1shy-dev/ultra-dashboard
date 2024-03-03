"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatEntry } from "../shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MingcuteSendFill } from "@/icons/Mingcute";
import { Textarea } from "@/components/ui/textarea";
import { useMemo, useRef } from "react";
import { modelAdapters } from "../models";

export const ChatWindow: React.FC<{
	chat: ChatEntry;
	updateChat: (newChat: ChatEntry) => void;
}> = ({ chat, updateChat }) => {
	const modelAdapter = useMemo(() => {
		return modelAdapters.find((m) => m.id === chat.modelId);
	}, [chat.modelId]);
	const textAreaRef = useRef<HTMLTextAreaElement>(null);

	if (!modelAdapter) return <div>Internal error: Model not found</div>;

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
						if (!modelAdapter) return;
						if (textAreaRef.current) {
							const content = textAreaRef.current.value;
							textAreaRef.current.value = "";
							updateChat({
								...chat,
								messages: [
									...chat.messages,
									{
										id: Math.random().toString(),
										content,
										status: "success",
										timestamp: Date.now(),
										type: "user",
									},
								],
							});
							const data = await modelAdapter.generate(
								chat.messages,
								{},
								{ apiKey: "test" },
								[],
							);
							console.log(data);

							console.log({
								...chat,
								messages: [...chat.messages, data],
							});

							updateChat({
								...chat,
								messages: [...chat.messages, data],
							});
						}
					}}
				>
					<MingcuteSendFill className="w-5 h-5" />
				</Button>
			</div>
		</div>
	);
};
