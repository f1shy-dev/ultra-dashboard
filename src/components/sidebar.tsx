"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
	ChatBubbleIcon,
	CursorArrowIcon,
	DesktopIcon,
	FaceIcon,
	LapTimerIcon,
	MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import type { IconProps } from "@radix-ui/react-icons/dist/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
	isMobile?: boolean;
	closeSidebar?: () => void;
}

export const SIDEBAR_SECTIONS = [
	{
		title: "Random Tools",
		items: [
			{
				icon: (p) => <MagnifyingGlassIcon {...p} />,
				label: "AppStore Banner",
				route: ["/tools/app_banner", "/tools/app_banner_view"],
			},
			{
				icon: (p) => <LapTimerIcon {...p} />,
				label: "GFN Queue",
				route: "/tools/gfn_queue",
			},
			{
				icon: (p) => <CursorArrowIcon {...p} />,
				label: "Proxy Browser",
				route: "/tools/uv_browser",
			},
			{
				icon: (p) => <ChatBubbleIcon {...p} />,
				label: "AI Chat",
				// biome-ignore lint/complexity/useRegexLiterals: <explanation>
				route: ["/tools/ai_chat", new RegExp("/tools/ai_chat/.+")],
			},
		],
	},
] as {
	title: string;
	items: {
		icon: React.ForwardRefExoticComponent<
			IconProps & React.RefAttributes<SVGSVGElement>
		>;
		label: string;
		route: string | string[];
	}[];
}[];

export function Sidebar({
	className,
	isMobile = false,
	closeSidebar,
}: SidebarProps) {
	const pathname = usePathname();
	return (
		<div
			className={cn(
				"pb-12",
				className,
				isMobile && "text-black dark:text-white",
			)}
		>
			<ScrollArea className={cn(!isMobile && "px-1 h-[calc(100vh-2rem)]")}>
				<div className={cn("space-y-4", !isMobile && "py-4")}>
					{SIDEBAR_SECTIONS.map((section) => (
						<div
							key={section.title}
							className={cn("py-2", !isMobile && "px-3")}
						>
							<span
								className={cn(
									"tracking-tight mb-2",
									isMobile ? "text-sm font-bold" : "text-lg font-semibold px-4",
								)}
							>
								{section.title}
							</span>
							<div className="space-y-1">
								{section.items.map((item) => {
									const Icon = item.icon;
									return (
										<Link
											href={
												typeof item.route === "string"
													? item.route
													: item.route[0]
											}
											key={item.label}
											onClick={closeSidebar}
											className="inline-flex w-full h-9"
										>
											<Button
												variant={
													typeof item.route === "string"
														? pathname === item.route
															? "secondary"
															: "ghost"
														: item.route.some((r) =>
																	typeof r === "string"
																		? r === pathname
																		: (r as RegExp).test(pathname || ""),
															  )
														  ? "secondary"
														  : "ghost"
												}
												className="w-full justify-start"
												key={item.label}
											>
												<Icon
													className="mr-2 h-4 w-4"
													stroke="currentColor"
													strokeWidth="0.2"
												/>
												{item.label}
											</Button>
										</Link>
									);
								})}
							</div>
						</div>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
