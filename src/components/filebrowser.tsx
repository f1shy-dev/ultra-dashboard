"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChatBubbleIcon,
  FileIcon,
  FileTextIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MingcuteArrowLeftUpLine,
  MingcuteBlockquoteLine,
  MingcuteEdit2Line,
  MingcuteFolderLine,
  MingcuteMessage2Line,
} from "@/icons/MingcuteFolderLine";
import { useState } from "react";

type Entry = {
  name: string;
  type: "chat" | "structured-prompt" | "instruct-prompt";
  id: string;
};

type Folder = {
  name: string;
  type: "folder";
  id: string;
  entries: (Entry | Folder)[];
};
type RootFolder = (Entry | Folder)[];

const chats: RootFolder = [
  {
    name: "Folder 1",
    type: "folder",
    id: "meow-2",
    entries: [
      { name: "Chat 1", type: "chat", id: "1abfe34" },
      { name: "Chat 2", type: "chat", id: "1abfe34" },
      { name: "Chat 3", type: "chat", id: "13abfe34" },
      { name: "Chat 4", type: "chat", id: "132abfe34" },
      { name: "Chat 5", type: "chat", id: "1ab3221fe34" },
      { name: "Chat 6", type: "chat", id: "1abfe312334" },
    ],
  },
  { name: "Chat 1", type: "chat", id: "9abdfe34" },
  { name: "Chat 2", type: "chat", id: "9abdfde34" },
];

const iconMap = {
  chat: MingcuteMessage2Line,
  "structured-prompt": MingcuteEdit2Line,
  "instruct-prompt": MingcuteBlockquoteLine,
  folder: MingcuteFolderLine,
};

export function FileBrowser() {
  const [path, setPath] = useState<string[]>([]);

  let currentFolder = chats;
  for (const folderName of path) {

    currentFolder = (currentFolder as Folder[]).find(
      (folder) => folder.id === folderName
    )?.entries as Folder[];
  }

  return (
    <Card className="max-w-lg w-full relative">
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
          <DropdownMenuItem>
            <MingcuteFolderLine className="w-4 h-4 mr-1.5" /> Folder
          </DropdownMenuItem>
          <DropdownMenuItem>
            <MingcuteMessage2Line className="w-4 h-4 mr-1.5" /> Chat
          </DropdownMenuItem>
          <DropdownMenuItem>
            <MingcuteEdit2Line className="w-4 h-4 mr-1.5" /> Structured Prompt
          </DropdownMenuItem>
          <DropdownMenuItem>
            <MingcuteBlockquoteLine className="w-4 h-4 mr-1.5" /> Instruct
            Prompt
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CardHeader>
        <CardTitle className="">Your Chats</CardTitle>
      </CardHeader>

      <CardContent>
        {path.length > 0 && (
          <div
            onClick={() => {
              setPath(path.slice(0, path.length - 1));
            }}
            className="rounded-md transition-all px-3 py-2 hover:bg-muted/50 text-sm flex items-center text-muted-foreground"
          >
            <MingcuteArrowLeftUpLine className="w-4.5 h-4.5 mr-2" />
            Back
          </div>
        )}
        {currentFolder.map((chat) => {
          const IconComp = iconMap[chat.type];
          return (
            <div
              key={chat.name}
              onClick={() => {
                if (chat.type === "folder") {
                  setPath([...path, chat.id]);
                }
              }}
              className="rounded-md transition-all px-3 py-2 hover:bg-muted/50 text-sm flex items-center"
            >
              <IconComp className="w-4.5 h-4.5 mr-2" />
              {chat.name}
              <div className="flex-grow"></div>
              <ArrowRightIcon className="w-4 h-4 text-muted-foreground" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
