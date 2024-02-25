"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

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
	}>({ client: false, config: false });
	const [swStatus, setSwStatus] = useState<string>("");

	useEffect(() => {
		if (!loadedScripts) setSwStatus("waiting for scripts to load");
		const { host, hostname, protocol } = window.location;

		console.log(protocol, hostname);
		if (
			// process.env.NODE_ENV !== "production" ||
			protocol !== "https:" ||
			hostname === "localhost" ||
			hostname === "127.0.0.1"
		) {
			setSwStatus("Service Worker not supported");
			return;
		}

		if (!navigator.serviceWorker) {
			setSwStatus("Service Worker not supported");
			return;
		}
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
				setSwStatus("Loaded!");
			} catch (e) {
				setSwStatus("Service Worker registration failed");
			}
		})();
	}, [loadedScripts]);

	return (
		<div>
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

			<h1>Client status: {loadedScripts.client ? "Loaded" : "Loading"}</h1>
			<h1>Config status: {loadedScripts.config ? "Loaded" : "Loading"}</h1>
			<h1>SW Client status: {swStatus}</h1>
		</div>
	);
}
