"use client";

import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { Sidebar } from "./sidebar";

export const SheetMenu = () => {
	const [open, setOpen] = useState(false);

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger className="lg:hidden font-bold ml-2">
				<HamburgerMenuIcon />
			</SheetTrigger>
			<SheetContent side={"left-full"}>
				<SheetHeader className="text-left">
					<SheetTitle>Dashboard Ultra</SheetTitle>
				</SheetHeader>
				<Sidebar isMobile closeSidebar={() => setOpen(false)} />
			</SheetContent>
		</Sheet>
	);
};
