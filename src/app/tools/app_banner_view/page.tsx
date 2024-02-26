import Head from "next/head";
import { Metadata, ResolvingMetadata } from "next";
import { AppleAppSearchAPIApp } from "../app_banner/page";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
	params: { id: string };
	searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
	{ params, searchParams }: Props,
	parent: ResolvingMetadata,
): Promise<Metadata> {
	if (!searchParams.appData) return {};
	const app: AppleAppSearchAPIApp = JSON.parse(searchParams.appData as string);

	return {
		itunes: {
			appId: app.id,
		},
	};
}
export default function Page({
	params,
	searchParams,
}: {
	params: { slug: string };
	searchParams: { [key: string]: string | string[] | undefined };
}) {
	if (!searchParams.appData) return <>missing appdata</>;
	const app: AppleAppSearchAPIApp = JSON.parse(searchParams.appData as string);
	return (
		<ScrollArea className="h-full max-h-[calc(100vh-2rem)]">

		<div className="h-full px-4 py-6 lg:px-8">

			<h1>{app.attributes.name}</h1>
			<Link href={"/tools/app_banner"}>
				<Button>Back</Button>
			</Link>
		</div>
		</ScrollArea>
	);
}
