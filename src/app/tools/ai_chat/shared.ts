export type Entry = {
	name: string;
	type: "chat" | "structured-prompt" | "instruct-prompt";
	id: string;
};

export type Folder = {
	name: string;
	type: "folder";
	id: string;
	entries: (Entry | Folder)[];
};
export type RootFolder = (Entry | Folder)[];
