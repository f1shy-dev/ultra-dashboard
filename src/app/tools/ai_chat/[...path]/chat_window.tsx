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
import { useEffect, useMemo, useRef, useState } from "react";
import { modelAdapters } from "../models";
import { cn, generateShortUUID } from "@/lib/utils";
import { useAtom, atom as atomFactory, useAtomValue } from "jotai";
import { generalConfigAtom, modelConfigAtom } from "../shared/atoms";
import { Skeleton } from "@/components/ui/skeleton";
import { BingSearchTool } from "../tools/bing_search";
import { ToolfulModelResponse } from "../shared/model_adapter";

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
	const config = useAtomValue(generalConfigAtom);
	const optsAtom = useAtomValue(_optsAtom);
	const [isGenerating, setIsGenerating] = useState(false);

	const textAreaRef = useRef<HTMLTextAreaElement>(null);
	const chatScrollAreaRef = useRef<HTMLDivElement>(null);
	const [isScrolling, setIsScrolling] = useState(false);

	const send = async () => {
		if (!modelAdapter || !textAreaRef.current || !chat || isGenerating) return;
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

		if (modelAdapter.streamGenerate && config.ai.useStream) {
			setIsGenerating(true);
			await modelAdapter.streamGenerate({
				messages,
				options: {},
				userOptions: {
					apiKey: optsAtom?.apiKey || "",
					useProxy: optsAtom?.useProxy,
				},
				tools: [BingSearchTool],
				onMessageUpdate(message) {
					setChat((old) => {
						const messages = [...(old as ChatEntry).messages].filter(
							(m) => m.id !== message.id,
						);
						messages.push(message);
						return {
							...(old as ChatEntry),
							messages,
						};
					});
				},
			});
			setIsScrolling(false);
			setTimeout(() => {
				chatScroll();
				setIsGenerating(false);
			}, 50);
		} else {
			setIsGenerating(true);
			const baseMessage = {
				id: `model-${generateShortUUID()}`,
				content: "",
				status: "success" as const,
				timestamp: Date.now(),
				type: "model" as const,
			};
			setChat((old) => ({
				...(old as ChatEntry),
				messages: [...(old as ChatEntry).messages, baseMessage],
			}));

			const data = await modelAdapter.generate({
				messages,
				options: {},
				userOptions: {
					apiKey: optsAtom?.apiKey || "",
					useProxy: optsAtom?.useProxy,
				},
				tools: [BingSearchTool],
			});

			setChat((old) => {
				const messages = [...(old as ChatEntry).messages].filter(
					(m) => m.id !== baseMessage.id,
				);
				if (
					modelAdapter.supportsTools &&
					(data as ToolfulModelResponse).toolCalls !== undefined
				) {
					// biome-ignore lint/correctness/noUnsafeOptionalChaining: <explanation>
					for (const toolCall of (data as ToolfulModelResponse)?.toolCalls) {
						messages.push({
							id: `tool-${generateShortUUID()}-${toolCall.callId}`,
							type: "tool-call",
							content: JSON.stringify(toolCall.data),
							status: "success",
							timestamp: Date.now(),
						});
					}
				}
				messages.push({
					...data,
					id: baseMessage.id,
				});
				return {
					...(old as ChatEntry),
					messages,
				};
			});
			setIsScrolling(false);
			setTimeout(() => {
				chatScroll();
				setIsGenerating(false);
			}, 50);
		}
	};

	const chatScroll = () => {
		if (chatScrollAreaRef.current && !isScrolling && isGenerating) {
			setIsScrolling(true);
			chatScrollAreaRef.current.scroll({
				top: chatScrollAreaRef.current.scrollHeight,
				behavior: "smooth",
			});
			setTimeout(() => {
				setIsScrolling(false);
			}, 50);
		}
	};
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(chatScroll, [chat?.messages]);

	if (!modelAdapter) return <div>Internal error: Model not found</div>;
	if (!chat) return <div>Internal error: Chat not found</div>;

	return (
		<div className="h-full w-full relative flex flex-col items-center">
			<ScrollArea
				className="w-full px-4 md:px-6 max-w-4xl h-[calc(100vh-4.6rem)]"
				viewportRef={chatScrollAreaRef}
			>
				<div className="flex flex-col space-y-4 first:mt-4 last:mb-28">
					{chat.messages
						.filter((m) => m.type !== "tool-call")
						.map((m, msg_idx) => {
							const _content = (m.content || "") as string;
							const split_content = _content.split(" ");

							const clampLen = modelAdapter.streamAnimationWordClamp || 8;
							const fadeClass =
								clampLen > 8
									? clampLen > 12
										? "animate-fade-in-1"
										: "animate-fade-in-2"
									: "animate-fade-in-4";

							const clamped_length =
								split_content.length > clampLen
									? clampLen
									: split_content.length;

							return (
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
											"text-sm w-full",
											m.status === "error" ? "text-red-500" : "",
										)}
									>
										{isGenerating &&
											msg_idx === chat.messages.length - 1 &&
											_content.trim().length === 0 && (
												<div className="flex flex-col space-y-2">
													<Skeleton className="w-3/4 h-4 rounded-md" />
													<Skeleton className="w-1/2 h-4 rounded-md" />
													<Skeleton className="w-[62.5%] h-4 rounded-md" />
												</div>
											)}

										{(msg_idx !== chat.messages.length - 1 ||
											m.isDoneStreaming !== false) &&
											_content}

										{msg_idx === chat.messages.length - 1 &&
											m.isDoneStreaming === false && (
												<>
													{split_content.slice(0, clamped_length).join(" ")}{" "}
													{split_content
														.slice(-1 * (split_content.length - clamped_length))
														.map((line, i) => (
															<>
																<span
																	key={`${i}-${line}`}
																	className={fadeClass}
																>
																	{line}
																</span>{" "}
															</>
														))}
												</>
											)}
									</span>
								</div>
							);
						})}
				</div>
			</ScrollArea>

			<div className="absolute bottom-0 w-full p-4 rounded-t-xl border md:max-w-2xl flex bg-background/50 backdrop-blur">
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
					disabled={isGenerating}
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
