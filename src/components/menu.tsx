import {
	Menubar,
	MenubarCheckboxItem,
	MenubarContent,
	MenubarItem,
	MenubarLabel,
	MenubarMenu,
	MenubarRadioGroup,
	MenubarRadioItem,
	MenubarSeparator,
	MenubarShortcut,
	MenubarSub,
	MenubarSubContent,
	MenubarSubTrigger,
	MenubarTrigger,
} from "@/components/ui/menubar";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { SheetMenu } from "./sheet-menu";
import { Sidebar } from "./sidebar";
import { ModeToggle } from "./theme-toggle";

export function Menu() {
	return (
		<Menubar className="rounded-none border-b border-none px-2 lg:px-4">
			<SheetMenu />
			<MenubarMenu>
				<MenubarTrigger className="font-bold">Dashboard Ultra</MenubarTrigger>
				<MenubarContent>
					<MenubarItem>About DBUltra</MenubarItem>
					<MenubarSeparator />
					<MenubarItem>
						Preferences... <MenubarShortcut>⌘,</MenubarShortcut>
					</MenubarItem>
					<MenubarSeparator />
					<MenubarItem>
						Hide Music... <MenubarShortcut>⌘H</MenubarShortcut>
					</MenubarItem>
					<MenubarItem>
						Hide Others... <MenubarShortcut>⇧⌘H</MenubarShortcut>
					</MenubarItem>
					<MenubarShortcut />
					<MenubarItem>
						Quit Music <MenubarShortcut>⌘Q</MenubarShortcut>
					</MenubarItem>
				</MenubarContent>
			</MenubarMenu>

			<div className="flex flex-grow" />

			<ModeToggle />
		</Menubar>
	);
}
