"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogHeader, DialogFooter } from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	MingcuteArrowLeftUpLine,
	MingcuteArrowRightUpLine,
	MingcuteBlockquoteLine,
	MingcuteDelete2Line,
	MingcuteEdit2Line,
	MingcuteFolderLine,
	MingcuteMessage2Line,
	MingcutePencilLine,
} from "@/icons/Mingcute";
import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	ArrowRightIcon,
	CaretSortIcon,
	CheckIcon,
	PlusIcon,
} from "@radix-ui/react-icons";
import { Label } from "@/components/ui/label";
import { RefObject, Suspense, useRef, useState } from "react";
import { useLocalStorage } from "react-use";
import { Input } from "@/components/ui/input";
import { cn, generateShortUUID } from "@/lib/utils";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@/components/ui/popover";
import {
	Command,
	CommandInput,
	CommandEmpty,
	CommandGroup,
	CommandItem,
} from "@/components/ui/command";
import { modelAdapters } from "./models";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RootFolder, Folder } from "./shared";
import _NoSSR from "@/lib/NoSSR";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap = {
	chat: MingcuteMessage2Line,
	"structured-prompt": MingcuteEdit2Line,
	"instruct-prompt": MingcuteBlockquoteLine,
	folder: MingcuteFolderLine,
};
const nameMap = {
	chat: ["Chat", "Back and forth messages with the AI model."],
	"structured-prompt": [
		"Structured Prompt",
		"Prompt with a fixed message history, and a system prompt.",
	],
	"instruct-prompt": [
		"Instruct Prompt",
		"Prompt with a system prompt and an instruction, rather than a fixed message history.",
	],
	folder: [
		"Folder",
		"A collection of chats, or other folders. Also known as a directory (yeah, like in Windows Explorer...).",
	],
	closed: ["", ""],
};

export default function FileBrowser() {
	const [chats, setChats] = useLocalStorage<RootFolder>("ai_chats", []);
	const [addDialogState, setAddDialogState] = useState<
		"closed" | "folder" | "chat" | "structured-prompt" | "instruct-prompt"
	>("closed");
	const [addDialogModel, setAddDialogModel] = useState("");
	const [path, setPath] = useState<string[]>([]);
	const [nameInputRef] = [useRef(null)] as RefObject<HTMLInputElement>[];
	const router = useRouter();

	let currentFolder = chats;
	for (const folderName of path) {
		currentFolder = (currentFolder as Folder[]).find(
			(folder) => folder.id === folderName,
		)?.entries as Folder[];
	}

	const create = () => {
		if (!nameInputRef.current?.value) return;
		const cf_copy = currentFolder || chats || [];
		if (addDialogState === "folder") {
			cf_copy.push({
				name: nameInputRef.current.value,
				type: "folder",
				id: generateShortUUID(),
				entries: [],
			});
		}
		if (addDialogState !== "folder" && addDialogState !== "closed") {
			cf_copy.push({
				name: nameInputRef.current.value,
				type: addDialogState,
				id: generateShortUUID(),
			});
		}

		if (path.length === 0) {
			setChats(cf_copy);
		} else {
			const pathCopy = [...path];
			const lastFolderId = pathCopy.pop();
			const lastFolder = chats?.find((folder) => folder.id === lastFolderId);
			if (lastFolder && lastFolder.type === "folder") {
				lastFolder.entries = cf_copy;
				setChats(chats);
			}
		}

		setAddDialogState("closed");
	};

	const NoSSR = _NoSSR({
		loading: () => (
			<div className="*:my-4 *:mx-3 *:h-4">
				<Skeleton className="w-3/4" />
				<Skeleton className="w-3/4" />
				<Skeleton className="w-2/3" />
			</div>
		),
	});

	return (
		<>
			<Dialog
				open={addDialogState !== "closed"}
				onOpenChange={(open) => !open && setAddDialogState("closed")}
			>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>
							New {nameMap[addDialogState as keyof typeof nameMap][0]}
						</DialogTitle>
						<DialogDescription>
							{nameMap[addDialogState as keyof typeof nameMap][1]}{" "}
							{addDialogState !== "folder" &&
								"You can change these settings later."}
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="name" className="text-right">
								Name
							</Label>
							<Input id="name" className="col-span-3" ref={nameInputRef} />
						</div>

						{addDialogState !== "folder" && (
							<div className="grid grid-cols-4 items-center gap-4">
								<Label htmlFor="username" className="text-right">
									Model
								</Label>
								<ModelPickerCombobox
									value={addDialogModel}
									setValue={setAddDialogModel}
								/>
							</div>
						)}
					</div>
					<DialogFooter>
						<Button onClick={create} onKeyDown={create}>
							Create
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Card className="border-none sm:border-solid w-full relative max-w-lg sm:max-h-[32rem]">
				<DropdownMenu>
					{/* <DropdownMenuTrigger>Open</DropdownMenuTrigger> */}
					<DropdownMenuTrigger asChild>
						<Button
							className="absolute top-4 right-4"
							variant="default"
							size="icon"
						>
							<PlusIcon className="w-5 h-5" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuLabel>New</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => setAddDialogState("folder")}>
							<MingcuteFolderLine className="w-4 h-4 mr-1.5" /> Folder
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setAddDialogState("chat")}>
							<MingcuteMessage2Line className="w-4 h-4 mr-1.5" /> Chat
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => setAddDialogState("structured-prompt")}
						>
							<MingcuteEdit2Line className="w-4 h-4 mr-1.5" /> Structured Prompt
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => setAddDialogState("instruct-prompt")}
						>
							<MingcuteBlockquoteLine className="w-4 h-4 mr-1.5" /> Instruct
							Prompt
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<CardHeader>
					<CardTitle className="">Your Chats</CardTitle>
				</CardHeader>

				<CardContent>
					<ScrollArea className="h-[calc(100vh-6.4rem)] sm:h-[26rem]">
						<NoSSR>
							{path.length > 0 && (
								<div
									onClick={() => {
										setPath(path.slice(0, path.length - 1));
									}}
									onKeyDown={() => {
										setPath(path.slice(0, path.length - 1));
									}}
									className="rounded-md transition-all px-3 py-2 hover:bg-muted/50 text-sm flex items-center text-muted-foreground"
								>
									<MingcuteArrowLeftUpLine className="w-4.5 h-4.5 mr-2" />
									Back
								</div>
							)}
							{currentFolder?.map((chat) => {
								const IconComp = iconMap[chat.type];
								return (
									<ContextMenu key={chat.id}>
										<ContextMenuTrigger asChild>
											<div
												onClick={() => {
													if (chat.type === "folder")
														return setPath([...path, chat.id]);
													router.push(
														`/tools/ai_chat/${[...path, chat.id].join("/")}`,
													);
												}}
												onKeyDown={() => {
													if (chat.type === "folder")
														return setPath([...path, chat.id]);
													router.push(
														`/tools/ai_chat/${[...path, chat.id].join("/")}`,
													);
												}}
												className="rounded-md transition-all px-3 py-2 hover:bg-muted/50 text-sm flex items-center"
											>
												<IconComp className="w-4.5 h-4.5 mr-2" />
												{chat.name}
												<div className="flex-grow" />
												<ArrowRightIcon className="w-4 h-4 text-muted-foreground" />
											</div>
										</ContextMenuTrigger>
										<ContextMenuContent>
											<ContextMenuItem
												onClick={() => {
													router.push(
														`/tools/ai_chat/${[...path, chat.id].join("/")}`,
													);
												}}
											>
												<MingcuteArrowRightUpLine className="w-4 h-4 mr-2" />{" "}
												Open
											</ContextMenuItem>
											<ContextMenuItem onClick={() => {}}>
												<MingcutePencilLine className="w-4 h-4 mr-2" /> Rename
											</ContextMenuItem>
											<ContextMenuItem
												onClick={() => {}}
												className="text-red-500 focus:text-red-500"
											>
												<MingcuteDelete2Line className="w-4 h-4 mr-2" /> Delete
											</ContextMenuItem>
										</ContextMenuContent>
									</ContextMenu>
								);
							})}

							{currentFolder?.length === 0 && (
								<div
									className={cn(
										"text-muted-foreground text-sm flex items-center",
										path.length > 0 && "py-2",
									)}
								>
									No chats to see here... Click{" "}
									<PlusIcon className="w-4 h-4 mx-0.5" /> to add one.
								</div>
							)}
						</NoSSR>
					</ScrollArea>
				</CardContent>
			</Card>
		</>
	);
}

const ModelPickerCombobox = ({
	value,
	setValue,
}: { value: string; setValue: (value: string) => void }) => {
	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-[200px] justify-between col-span-3"
				>
					{value
						? modelAdapters.find((ad) => ad.id === value)?.name
						: "Select model..."}
					<CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0">
				<Command>
					<CommandInput placeholder="Search models..." className="h-9" />
					<CommandEmpty>No models found.</CommandEmpty>
					<CommandGroup>
						{modelAdapters.map((ad) => (
							<CommandItem
								key={ad.id}
								value={ad.id}
								onSelect={(currentValue) => {
									setValue(currentValue === value ? "" : currentValue);
									setOpen(false);
								}}
							>
								{ad.name}
								<CheckIcon
									className={cn(
										"ml-auto h-4 w-4",
										value === ad.id ? "opacity-100" : "opacity-0",
									)}
								/>
							</CommandItem>
						))}
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	);
};
