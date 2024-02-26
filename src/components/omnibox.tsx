"use client";

import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandInputIconLess,
	CommandItem,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "./ui/input";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Skeleton } from "./ui/skeleton";
import { CommandLoading } from "cmdk";

type OmniboxProps = {
	value: string;
	setValue: (value: string) => void;
	onShouldSubmit: (value: string) => void;
};

export const Omnibox: React.FC<OmniboxProps> = ({
	value,
	setValue,
	onShouldSubmit,
}) => {
	const [open, setOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const { data, isLoading, error } = useSWR(
		typeof window !== undefined && inputRef.current === document.activeElement
			? inputRef?.current?.value
			: null,
		(query: string) =>
			fetch("https://bare-server.akku1139.workers.dev/v3/", {
				headers: {
					"x-bare-url": `https://duckduckgo.com/ac/?q=${encodeURIComponent(
						query,
					)}`,
					"x-bare-headers": `{"accept":"application/json","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36","referer":"https://duckduckgo.com","Host":"duckduckgo.com"}`,
				},
			}).then((res) => res.json()),
	);
	console.log(data, isLoading, error);

	useEffect(() => {
		const click_handler = (e: MouseEvent) => {
			if (e.target instanceof HTMLElement) {
				if (!e.target.closest("[data-omnibox]")) {
					setOpen(false);
				}
			}
		};
		document.addEventListener("click", click_handler);
		return () => {
			document.removeEventListener("click", click_handler);
		};
	}, []);

	return (
		<div className="relative flex flex-grow" data-omnibox>
			<Command className="rounded-none">
				<CommandInputIconLess
					ref={inputRef}
					value={value}
					onValueChange={(e) => setValue(e)}
					onFocus={() => setOpen(true)}
					className="rounded-none border-x-0 border-t-0 border-b focus-visible:ring-0 focus-visible:border-b-ring font-mono flex-grow text-xs px-2"
					placeholder="Enter a URL or search the web"
					onKeyUp={(e) => {
						if (e.key === "Escape" || e.key === "Enter") {
							setOpen(false);
							onShouldSubmit(value);
							(e.target as HTMLInputElement).blur();
						}

						if ((e.target as HTMLInputElement) === document.activeElement) {
							setOpen(true);
						}
					}}
				/>

				<div
					className={cn(
						"absolute top-0 mt-[2.75rem] mx-1 z-50 w-full lg:w-2/3 rounded-md border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 slide-in-from-bottom-2",
						open ? "opacity-100" : "opacity-0 pointer-events-none -z-50",
					)}
					data-state={open ? "open" : "closed"}
				>
					<CommandGroup forceMount>
						{!value && (
							<CommandEmpty>
								<div className="text-xs text-foreground-muted">
									Enter a search query to see autocomplete results
								</div>
							</CommandEmpty>
						)}

						{data && data.length === 0 && (
							<CommandEmpty>
								<div className="text-xs text-foreground-muted">
									No results found
								</div>
							</CommandEmpty>
						)}

						{
							isLoading && [...Array(8)].map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							<CommandItem key={i} disabled>
								<Skeleton className="w-[150px] h-[1.25rem] rounded-sm" />
							</CommandItem>
						))}

						{!isLoading &&
							!error && value && 
							data?.map((item: { phrase: string }) => (
								<CommandItem
									key={item.phrase}
									value={item.phrase}
									onSelect={(currentValue) => {
										setValue(currentValue);
										onShouldSubmit(currentValue);
										setOpen(false);
									}}
								>
									{item.phrase}
								</CommandItem>
							))}
					</CommandGroup>
				</div>
			</Command>
		</div>
	);
};
