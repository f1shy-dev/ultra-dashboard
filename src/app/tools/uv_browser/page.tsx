"use client";

import { Omnibox } from "@/app/tools/uv_browser/omnibox";
import { Button } from "@/components/ui/button";
import {
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarSeparator,
	MenubarShortcut,
	MenubarSub,
	MenubarSubContent,
	MenubarSubTrigger,
	MenubarTrigger,
	MenubarCheckboxItem,
} from "@/components/ui/menubar";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	DotsHorizontalIcon,
	ReloadIcon,
} from "@radix-ui/react-icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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

interface DynamicConfig {
	prefix: string;
	encoding: string;
	mode: string;
	logLevel: number;
	bare: {
		version: string;
		path: string;
	};
	tab: {
		title: string;
		icon: null;
		ua: string;
	};
	assets: {
		prefix: string;
		files: {
			[key: string]: string;
		};
	};
	block: string[];
}

// declare const __rapidengine$config: UVConfig;
declare global {
	interface Window {
		__rapidengine$config: UVConfig;
		__dynamic$config: DynamicConfig;
	}
}

export default function Page() {
	const [proxyEngine, setProxyEngine] = useState<"ultraviolet" | "dynamic">(
		"dynamic",
	);

	const [log, setLog] = useState<string[]>([]);
	const [loadedScripts, setLoadedScripts] = useState<{
		client: boolean;
		config: boolean;
	}>({ client: false, config: false });
	const [swStatus, setSwStatus] = useState<"loading" | "loaded" | "error">(
		"loading",
	);
	const [src, setSrc] = useState<string>("");
	const [omniboxValue, setOmniboxValue] = useState<string>("");
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [history, setHistory] = useState<{ back: boolean; forward: boolean }>({
		back: false,
		forward: false,
	});

	useEffect(() => {
		setSwStatus("loading");
		setLog((l) => [...l, `Proxy engine changed to ${proxyEngine}`]);
		setLoadedScripts({ client: false, config: false });
		// window.location.reload();
		// onShouldSubmit(omniboxValue);
		setSrc("");
		setOmniboxValue("");
	
	}, [proxyEngine]);

	useEffect(() => {
		if (swStatus === "loaded") return;
		if (proxyEngine === "ultraviolet" && !loadedScripts) return;
		if (proxyEngine === "ultraviolet" && !window.__rapidengine$config) return;
		const { host, hostname, protocol } = window.location;

		console.log(protocol, hostname);
		if (
			// process.env.NODE_ENV !== "production" ||
			protocol !== "https:" ||
			hostname === "localhost" ||
			hostname === "127.0.0.1"
		) {
			setSwStatus("error");

			setLog((l) => [...l, "Error loading service worker - not in production"]);
			return;
		}

		if (!navigator.serviceWorker) {
			setSwStatus("error");
			setLog((l) => [...l, "Error loading service worker - not supported"]);
			return;
		}

		if (proxyEngine === "ultraviolet") {
			window.__rapidengine$config.bare = "https://bare-server.akku1139.workers.dev/";
		}

		(async () => {
			try {
				const res = await navigator.serviceWorker.register(
					// "/rdll_kit/rdll_sinvoke.js",
					proxyEngine === "ultraviolet"
						? "/rdll_kit/rdll_sinvoke.js"
						: "/dynamic_bootsw.js",
					{
						scope:
							proxyEngine === "ultraviolet"
								? "/rdll_kit/anti_tamper/"
								: "/dynserv_engine/",
						updateViaCache: "none",
					},
				);
				console.log(res);
				setLog((l) => [...l, "🎉 Service worker loaded sucessfully!"]);
				setSwStatus("loaded");
			} catch (e) {
				setSwStatus("error");
				setLog((l) => [...l, "Error loading service worker"]);
			}
		})();
	}, [loadedScripts, proxyEngine, swStatus]);

	const onShouldSubmit = (value: string) => {
		if (value === "") return setSrc("");

		const encode = (value: string) => {
			if (proxyEngine === "ultraviolet") {
				return (
					window.__rapidengine$config.prefix +
					window.__rapidengine$config.encodeUrl(value)
				);
			}

			return `/dynserv_engine/route?url=${encodeURIComponent(value)}`;
		};

		if (value.startsWith("http://") || value.startsWith("https://")) {
			return setSrc(encode(value));
		}

		if (
			value.match(
				/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
			)
		)
			return setSrc(encode(`https://${value}`));

		setSrc(
			encode(`https://www.duckduckgo.com/?q=${encodeURIComponent(value)}`),
		);
	};

	return (
		<>
			{proxyEngine === "ultraviolet" && (
				<>
					<Script
						src="/rdll_kit/rdll_client_bpack.js"
						onReady={() => {
							setLoadedScripts({ ...loadedScripts, client: true });
							setLog((l) => [...l, "Loaded client script"]);
						}}
					/>
					{loadedScripts.client && (
						<Script
							src="/rdll_kit/global_rdll_config.js"
							onReady={() => {
								setLoadedScripts({ ...loadedScripts, config: true });
								setLog((l) => [...l, "Loaded global configuration"]);
								setLog((l) => [
									...l,
									`Bare: ${window.__rapidengine$config.bare}`,
								]);
							}}
						/>
					)}
				</>
			)}
			<div className="flex flex-col w-full h-full">
				<div className="flex w-full flex-grow">
					<div
						className={cn(
							"flex h-full border-b items-center",
							swStatus !== "loaded" && "border-b border-[#181818]",
						)}
					>
						<Button
							variant="ghost"
							size="icon"
							className="rounded-none border-0 w-9 h-full"
							onClick={() => iframeRef.current?.contentWindow?.history.back()}
							disabled={swStatus !== "loaded" || !history.back}
						>
							<ArrowLeftIcon />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="rounded-none border-0 w-9 h-full"
							onClick={() =>
								iframeRef.current?.contentWindow?.history.forward()
							}
							disabled={swStatus !== "loaded" || !history.forward}
						>
							<ArrowRightIcon />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="rounded-none order-0 w-9 h-full"
							onClick={() =>
								iframeRef.current?.contentWindow?.location.reload()
							}
							disabled={swStatus !== "loaded"}
						>
							<ReloadIcon />
						</Button>
					</div>
					<Omnibox
						value={omniboxValue}
						setValue={setOmniboxValue}
						onShouldSubmit={onShouldSubmit}
						disabled={swStatus !== "loaded"}
					/>
					<Menubar className="rounded-none border-b border-x-0 border-t-0 has-[:disabled]:opacity-50">
						<MenubarMenu>
							<MenubarTrigger
								className="font-bold"
								disabled={swStatus !== "loaded"}
							>
								<DotsHorizontalIcon />
							</MenubarTrigger>
							<MenubarContent>
								<MenubarSub>
									<MenubarSubTrigger>Proxy Engine</MenubarSubTrigger>
									<MenubarSubContent>
										<MenubarCheckboxItem
											checked={proxyEngine === "ultraviolet"}
											onCheckedChange={(ck) =>
												ck && setProxyEngine("ultraviolet")
											}
										>
											Ultraviolet
										</MenubarCheckboxItem>
										<MenubarCheckboxItem
											checked={proxyEngine === "dynamic"}
											onCheckedChange={(ck) => ck && setProxyEngine("dynamic")}
										>
											Dynamic
										</MenubarCheckboxItem>
									</MenubarSubContent>
								</MenubarSub>
							</MenubarContent>
						</MenubarMenu>
					</Menubar>
				</div>

				<div className="w-full h-full flex">
					{src.split("/").join("/").trim() !== "" && swStatus === "loaded" ? (
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
									const prefix =
										proxyEngine === "ultraviolet"
											? window.__rapidengine$config.prefix
											: "/dynserv_engine/";
									const decoded = window.__rapidengine$config.decodeUrl(
										url.pathname
											.replace(prefix, "")
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
					) : (
						<div className="w-full flex items-center justify-center h-[calc(100vh-4.5rem)]">
							<ScrollArea className="h-64 w-full max-w-lg rounded-md border">
								<div className="p-4">
									<h4 className="mb-2 text-sm font-bold leading-none">Logs</h4>
									{log.map((log, i) => (
										<div
											key={`${i}-${log}`}
											className="text-sm font-mono animate-in slide-in-from-bottom-2"
										>
											{log}
										</div>
									))}
								</div>
							</ScrollArea>
						</div>
					)}
				</div>
			</div>
		</>
	);
}
