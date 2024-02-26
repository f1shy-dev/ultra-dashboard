"use client";

import { Omnibox } from "@/components/omnibox";
import { Button } from "@/components/ui/button";
import {
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarSeparator,
	MenubarShortcut,
	MenubarTrigger,
} from "@/components/ui/menubar";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	DotsHorizontalIcon,
	ReloadIcon,
} from "@radix-ui/react-icons";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type UVEncode = (encoded: string) => string;
type UVDecode = (encoded: string) => string;

interface UVConfig {
	bare: string;
	prefix: string;
	handler: string;
	bundle: string;
	config: string;
	sw: string;
	encodeUrl: UVEncode;
	decodeUrl: UVDecode;
}

// declare const __rapidengine$config: UVConfig;
declare global {
	interface Window {
		__rapidengine$config: UVConfig;
	}
}

export default function Page() {
	const [loadedScripts, setLoadedScripts] = useState<{
		client: boolean;
		config: boolean;
		sw: "loading" | "loaded" | "error";
		swError: string;
	}>({ client: false, config: false, sw: "loading", swError: "" });
	const [src, setSrc] = useState<string>("");
	const [omniboxValue, setOmniboxValue] = useState<string>("");
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [history, setHistory] = useState<{ back: boolean; forward: boolean }>({
		back: false,
		forward: false,
	});

	useEffect(() => {
		if (loadedScripts.sw === "loaded") return;
		if (!loadedScripts || !window.__rapidengine$config) return;
		const { host, hostname, protocol } = window.location;

		console.log(protocol, hostname);
		if (
			// process.env.NODE_ENV !== "production" ||
			protocol !== "https:" ||
			hostname === "localhost" ||
			hostname === "127.0.0.1"
		) {
			setLoadedScripts({
				...loadedScripts,
				sw: "error",
				swError: "Not in production",
			});
			return;
		}

		if (!navigator.serviceWorker) {
			setLoadedScripts({
				...loadedScripts,
				sw: "error",
				swError: "Service Worker not supported",
			});
			return;
		}
		window.__rapidengine$config.bare = "https://bare-server.akku1139.workers.dev/";
		const config = window.__rapidengine$config;
		console.log(config);
		(async () => {
			try {
				const res = await navigator.serviceWorker.register(
					"/rdll_kit/rdll_sinvoke.js",
					{
						scope: "/rdll_kit/anti_tamper/",
						updateViaCache: "none",
					},
				);
				console.log(res);
				setLoadedScripts({ ...loadedScripts, sw: "loaded" });
			} catch (e) {
				setLoadedScripts({
					...loadedScripts,
					sw: "error",
					swError: "An error occurred while registering the service worker",
				});
			}
		})();
	}, [loadedScripts]);

	const onShouldSubmit = (value: string) => {
		if (value === "") return setSrc("");
		if (!window.__rapidengine$config) return;
		if (value.startsWith("http://") || value.startsWith("https://")) {
			const url =
				window.__rapidengine$config.prefix +
				window.__rapidengine$config.encodeUrl(value);
			return setSrc(url);
		}

		if (
			value.match(
				/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
			)
		) {
			const url =
				window.__rapidengine$config.prefix +
				window.__rapidengine$config.encodeUrl(`https://${value}`);
			return setSrc(url);
		}

		const url =
			window.__rapidengine$config.prefix +
			window.__rapidengine$config.encodeUrl(
				`https://www.google.com/search?q=${value}`,
			);
		setSrc(url);
	};

	return (
		<div className="flex flex-col w-full h-full">
			<div className="flex w-full flex-grow">
				<div className="flex border-b h-full items-center">
					<Button
						variant="ghost"
						size="icon"
						className="rounded-none border-0 w-9 h-full"
						onClick={() => iframeRef.current?.contentWindow?.history.back()}
						disabled={!history.back}
					>
						<ArrowLeftIcon />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="rounded-none border-0 w-9 h-full"
						onClick={() => iframeRef.current?.contentWindow?.history.forward()}
						disabled={!history.forward}
					>
						<ArrowRightIcon />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="rounded-none border-0 w-9 h-full"
						onClick={() => iframeRef.current?.contentWindow?.location.reload()}
					>
						<ReloadIcon />
					</Button>
				</div>
				<Omnibox
					value={omniboxValue}
					setValue={setOmniboxValue}
					onShouldSubmit={onShouldSubmit}
				/>
				<Menubar className="rounded-none border-b border-x-0 border-t-0 px-2 lg:px-4">
					<MenubarMenu>
						<MenubarTrigger className="font-bold">
							<DotsHorizontalIcon />
						</MenubarTrigger>
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
				</Menubar>
			</div>
			<Script
				src="/rdll_kit/rdll_client_bpack.js"
				onReady={() => setLoadedScripts({ ...loadedScripts, client: true })}
			/>
			{loadedScripts.client && (
				<Script
					src="/rdll_kit/global_rdll_config.js"
					onReady={() => setLoadedScripts({ ...loadedScripts, config: true })}
				/>
			)}

			<div className="w-full h-full flex">
				{src.split("/").join("/").trim() !== "" && (
					<iframe
						ref={iframeRef}
						src={src}
						className="w-full h-[calc(100vh-4.5rem)]"
						title="page"
						onLoad={(e) => {
							const frame = e.target as HTMLIFrameElement;
							const _framedoc = frame.contentDocument;
							if (window.__rapidengine$config && _framedoc) {
								const url = new URL(_framedoc.location.href);
								console.log(_framedoc.location.href);
								const decoded = window.__rapidengine$config.decodeUrl(
									url.pathname
										.replace(window.__rapidengine$config.prefix, "")
										.split("/")
										.join("/")
										.trim(),
								);
								setOmniboxValue(decoded);

								setHistory({
									back: (frame.contentWindow?.history.length || 0) > 1,
									forward: (frame.contentWindow?.history.length || 0) > 1,
								});
							}
						}}
					/>
				)}
			</div>
		</div>
	);
}
