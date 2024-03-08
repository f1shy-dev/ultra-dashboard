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
	MingcuteSettings1Line,
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
import { RefObject, Suspense, useMemo, useRef, useState } from "react";
// import { useLocalStorage } from "react-use";
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
import { Checkbox } from "@/components/ui/checkbox";

import { RootFolder, Folder, ChatStorage } from "./shared";
import { atom, useAtom } from "jotai";
import {
	chatFilesystemAtom,
	chatStorageAtom,
	generalConfigAtom,
	modelConfigAtom,
} from "@/app/tools/ai_chat/shared/atoms";
import { UserExposedOption } from "./shared/model_adapter";

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
	const [chatFS, setChatFS] = useAtom(chatFilesystemAtom);
	const [chatStorage, setChatStorage] = useAtom(chatStorageAtom);

	const [addDialogState, setAddDialogState] = useState<
		"closed" | "folder" | "chat" | "structured-prompt" | "instruct-prompt"
	>("closed");
	const [providerSettingDialogOpen, setProviderSettingDialogOpen] =
		useState(false);
	const [addDialogModel, setAddDialogModel] = useState("");
	const [path, setPath] = useState<string[]>([]);
	const [nameInputRef] = [useRef(null)] as RefObject<HTMLInputElement>[];
	const router = useRouter();

	let currentFolder = chatFS;
	for (const folderName of path) {
		currentFolder = (currentFolder as Folder[]).find(
			(folder) => folder.id === folderName,
		)?.entries as Folder[];
	}

	const create = () => {
		if (!nameInputRef.current || !nameInputRef.current.value) return;
		const id = generateShortUUID();

		const currentFS = currentFolder || chatFS || [];

		if (addDialogState === "folder") {
			currentFS.push({
				name: nameInputRef.current.value,
				type: "folder",
				id,
				entries: [],
			});
		} else if (addDialogState !== "closed") {
			currentFS.push({
				type: "pointer",
				refId: id,
				refType: addDialogState,
			});

			switch (addDialogState) {
				case "chat":
					setChatStorage((draft) => {
						draft[id] = {
							type: "chat",
							id,
							name: nameInputRef.current?.value || "Chat",
							modelId: addDialogModel,
							messages: [],
						};
					});
					break;
				case "structured-prompt":
					setChatStorage((draft) => {
						draft[id] = {
							type: "structured-prompt",
							id,
							name: nameInputRef.current?.value || "Structured Prompt",
							modelId: addDialogModel,
							prompts: [],
						};
					});
					break;
				case "instruct-prompt":
					setChatStorage((draft) => {
						draft[id] = {
							type: "instruct-prompt",
							id,
							name: nameInputRef.current?.value || "Instruct Prompt",
							modelId: addDialogModel,
							prompt: "",
						};
					});
					break;
			}

			if (path.length === 0) {
				setChatFS(currentFS);
			} else {
				const copy = chatFS || [];
				const pathCopy = [...path];
				const lastFolderId = pathCopy.pop();
				const lastFolder = copy?.find(
					(folder) => folder.type === "folder" && folder.id === lastFolderId,
				);
				if (lastFolder && lastFolder.type === "folder") {
					lastFolder.entries = currentFS;
					setChatFS(copy);
				}
			}
		}

		setAddDialogState("closed");
	};

	if (chatStorage === undefined) return <div>Loading...</div>;

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

			<ProviderSettingsDialog
				open={providerSettingDialogOpen}
				setOpen={setProviderSettingDialogOpen}
			/>

			<Card className="border-none sm:border-solid w-full relative max-w-lg sm:max-h-[32rem]">
				<DropdownMenu>
					{/* <DropdownMenuTrigger>Open</DropdownMenuTrigger> */}
					<div className="absolute top-4 right-4 flex">
						<Button
							variant="outline"
							size="icon"
							className="mr-1"
							onClick={() => setProviderSettingDialogOpen(true)}
						>
							<MingcuteSettings1Line className="w-5 h-5" />
						</Button>
						<DropdownMenuTrigger asChild>
							<Button variant="default" size="icon">
								<PlusIcon className="w-5 h-5" />
							</Button>
						</DropdownMenuTrigger>
					</div>
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
							const IconComp =
								iconMap["refId" in chat ? chat.refType : chat.type];
							const id = "refId" in chat ? chat.refId : chat.id;
							return (
								<ContextMenu key={id}>
									<ContextMenuTrigger asChild>
										<div
											onClick={() => {
												if (chat.type === "folder")
													return setPath([...path, chat.id]);
												router.push(
													`/tools/ai_chat/${[...path, id].join("/")}`,
												);
											}}
											onKeyDown={() => {
												if (chat.type === "folder")
													return setPath([...path, chat.id]);
												router.push(
													`/tools/ai_chat/${[...path, id].join("/")}`,
												);
											}}
											className="rounded-md transition-all px-3 py-2 hover:bg-muted/50 text-sm flex items-center"
										>
											<IconComp className="w-4.5 h-4.5 mr-2" />
											{"name" in chat ? chat.name : chatStorage[id]?.name}
											<div className="flex-grow" />
											<ArrowRightIcon className="w-4 h-4 text-muted-foreground" />
										</div>
									</ContextMenuTrigger>
									<ContextMenuContent>
										<ContextMenuItem
											onClick={() => {
												router.push(
													`/tools/ai_chat/${[...path, id].join("/")}`,
												);
											}}
										>
											<MingcuteArrowRightUpLine className="w-4 h-4 mr-2" /> Open
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
					</ScrollArea>
				</CardContent>
			</Card>
		</>
	);
}

const ProviderSettingsDialog = ({
	open,
	setOpen,
}: { open: boolean; setOpen: (open: boolean) => void }) => {
	const [model, setModel] = useState("");
	const [config, setConfig] = useAtom(generalConfigAtom);
	const adapter = modelAdapters.find((ad) => ad.id === model);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Settings</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col">
					<div className="flex items-center space-x-2">
						<Checkbox
							id="enable-streamed-model-cb"
							checked={config.ai.useStream}
							onCheckedChange={(e) =>
								setConfig({
									...config,
									ai: { ...config.ai, useStream: e === true },
								})
							}
						/>
						<label
							htmlFor="enable-streamed-model-cb"
							className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>
							Enable streamed model responses
						</label>
					</div>

					<span className="font-semibold text-sm mt-4">Per-Model Settings</span>
					<DialogDescription className="mb-2">
						Change the global default settings for each AI model. These can also
						be changed per chat.
					</DialogDescription>
					<ModelPickerCombobox
						value={model}
						setValue={setModel}
						btnClassName="w-full"
					/>
					<div className="mt-4 flex flex-col space-y-2">
						{adapter?.userExposedOptions !== undefined ? (
							Object.keys(adapter.userExposedOptions).map((key) => {
								const option =
									// biome-ignore lint/style/noNonNullAssertion: <explanation>
									adapter.userExposedOptions![
										key as keyof typeof adapter.userExposedOptions
									];

								return (
									<ModelSettingElemnt
										optKey={key}
										option={option}
										model={model}
										key={`${model}-${key}`}
									/>
								);
							})
						) : (
							<div className="text-muted-foreground text-sm">
								No settings available for this model.
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

const ModelSettingElemnt = ({
	option,
	model,
	optKey,
}: {
	option: UserExposedOption;
	model: string;
	optKey: string;
}) => {
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const _atom = useMemo(
		() =>
			atom(
				(get) =>
					[
						get(modelConfigAtom)[model]?.[optKey],
						option.value,
						option.default,
					].filter((v) => v !== undefined)[0],
				(get, set, newVal: string | number | boolean) => {
					set(modelConfigAtom, (draft) => {
						draft[model] = draft[model] || {};
						draft[model][optKey] = newVal;
					});
				},
			),
		[model, optKey, option],
	);
	const [val, setVal] = useAtom(_atom);

	return (
		<div
			className={cn(
				"flex flex-col items-start",
				typeof val === "boolean" && "flex-row-reverse items-center gap-x-2",
			)}
		>
			<Label htmlFor={option.name} className="flex flex-col flex-grow">
				<span className="text-sm font-bold">{option.name}</span>
				<span className="text-xs mt-0.5 font-medium text-muted-foreground mb-1.5">
					{option.description}
				</span>
			</Label>
			{typeof val === "boolean" ? (
				<Checkbox
					id={option.name}
					checked={val === true}
					onCheckedChange={(e) => setVal(e === true)}
				/>
			) : (
				<Input
					id={option.name}
					value={val}
					onChange={(e) => setVal(e.target.value)}
					placeholder={option.placeholder}
				/>
			)}
		</div>
	);
};

const ModelPickerCombobox = ({
	value,
	setValue,
	btnClassName,
}: {
	value: string;
	setValue: (value: string) => void;
	btnClassName?: string;
}) => {
	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn("w-[200px] justify-between col-span-3", btnClassName)}
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
