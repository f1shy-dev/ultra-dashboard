"use client";

import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarTrigger,
} from "@/components/ui/menubar";

export function ModeToggle() {
	const { setTheme } = useTheme();

	return (
		<MenubarMenu>
			<MenubarTrigger>
				<SunIcon className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
				<MoonIcon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
				<span className="sr-only">Toggle theme</span>
			</MenubarTrigger>
			<MenubarContent>
				<MenubarItem onClick={() => setTheme("light")}>Light</MenubarItem>
				<MenubarItem onClick={() => setTheme("dark")}>Dark</MenubarItem>
				<MenubarItem onClick={() => setTheme("system")}>System</MenubarItem>
			</MenubarContent>
		</MenubarMenu>
	);
}
