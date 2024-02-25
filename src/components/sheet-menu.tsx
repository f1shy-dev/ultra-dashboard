"use client";

import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import {
	Sheet,
	SheetTrigger,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";

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
					<SheetDescription>
						<Sidebar isMobile closeSidebar={() => setOpen(false)} />
					</SheetDescription>
				</SheetHeader>
			</SheetContent>
		</Sheet>
	);
};
