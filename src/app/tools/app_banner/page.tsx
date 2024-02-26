"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useRef, useState } from "react";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
	params: { id: string };
	searchParams: { [key: string]: string | string[] | undefined };
};

const patchURL = (url: string, width: number, height: number) =>
	url
		.replace("{w}", width.toString())
		.replace("{h}", height.toString())
		.replace("{c}", "bb")
		.replace("{f}", "png");

type AppleAPILogo = {
	width: number;
	height: number;
	url: string;
	bgColor: string;
	textColor1: string;
	textColor2: string;
	textColor3: string;
	textColor4: string;
};
export type AppleAppSearchAPIApp = {
	id: string;
	type: string;
	href: string;
	attributes: {
		contentRatingsBySystem: {
			appsApple: {
				name: string;
				value: number;
				rank: number;
				advisories: string[];
			};
		};
		deviceFamilies: string[];
		chartPositions: {
			appStore: {
				position: number;
				genreName: string;
				genre: number;
				chart: string;
				chartLink: string;
			};
		};
		supportsStreamlinedBuy: boolean;
		url: string;
		usesLocationBackgroundMode: boolean;
		userRating: {
			value: number;
			ratingCount: number;
			ratingCountList: number[];
			ariaLabelForRatings: string;
		};
		firstVersionSupportingInAppPurchaseApi: string;
		name: string;
		genreDisplayName: string;
		isPreorder: boolean;
		artistName: string;
		reviewsRestricted: boolean;
		sellerLabel: string;
		hasEula: boolean;
		platformAttributes: {
			ios: {
				seller: string;
				minimumMacOSVersion: string;
				isStandaloneWithCompanionForWatchOS: boolean;
				is32bitOnly: boolean;
				isAppleWatchSupported: boolean;
				languageList: string[];
				releaseDate: string;
				minimumOSVersion: string;
				hasInAppPurchases: boolean;
				bundleId: string;
				hasMessagesExtension: boolean;
				supportsGameController: boolean;
				artwork: AppleAPILogo;
				hasFamilyShareableInAppPurchases: boolean;
				isStandaloneForWatchOS: boolean;
				isHiddenFromSpringboard: boolean;
				isDeliveredInIOSAppForWatchOS: boolean;
				hasPrivacyPolicyText: boolean;
				editorialArtwork: {
					contentIconTrimmedMonochrome: AppleAPILogo;
					contentIconTrimmed: AppleAPILogo;
					brandLogo: AppleAPILogo;
				};
				subtitle: string;
				requirementsString: string;
				externalVersionId: number;
			};
		};
	};
	relationships: {
		genres: {
			href: string;
			data: {
				id: string;
				type: string;
				href: string;
				attributes: {
					parentName: string;
					name: string;
					parentId: string;
					url: string;
				};
			}[];
		};
		developer: {
			href: string;
			data: {
				id: string;
				type: string;
				href: string;
			}[];
		};
	};
};
type AppleAppSearchAPIResponse = {
	apps: {
		href: string;
		data: AppleAppSearchAPIApp[];
	};
};

export default function AppBannerTool({ params, searchParams }: Props) {
	const [apps, setApps] = useState<AppleAppSearchAPIResponse>();
	const [loading, setLoading] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const { toast } = useToast();
	const router = useRouter();
	return (
		<ScrollArea className="h-full max-h-[calc(100vh-2rem)]">

		<div className="h-full px-4 py-6 lg:px-8">
			<div className="flex flex-col items-center w-full">
				<div className="flex justify-center w-full">
					<div className="grid flex-grow max-w-lg items-center gap-1.5">
						<Label htmlFor="appname">App Name</Label>
						<div className="flex items-center w-full  space-x-2 mt-1.5">
							<Input
								type="text"
								id="appname"
								placeholder="ChatGPT"
								ref={inputRef}
								value={searchParams.appname as string}
							/>
							<Button
								type="submit"
								disabled={loading}
								onClick={async () => {
									setLoading(true);
									const query = inputRef.current?.value;
									if (!query) {
										toast({
											title: "Error",
											description: "Please enter an app name first...",
										});
										return setLoading(false);
									}
									const res = await fetch(
										`https://worker-holy-king-306a.f1shylabs.workers.dev/search_app?limit=10&query=${query}`,
									);
									if (res.status !== 200) {
										toast({
											title: "Error",
											description: "Something went wrong, please try again.",
										});
										return setLoading(false);
									}
									const data = await res.json();
									console.log(data);
									setApps(data);
									setLoading(false);
								}}
							>
								{loading ? "Loading..." : "Search"}
							</Button>
						</div>
					</div>
				</div>

				<div className="grid w-full max-w-lg grid-cols-1 gap-4 mt-4 md:max-w-5xl md:grid-cols-2 lg:grid-cols-3">
					{apps?.apps.data.map((app) => (
						<>
							<Card>
								<CardHeader>
									<Image
										src={patchURL(
											app.attributes.platformAttributes.ios.artwork.url,
											300,
											300,
										)}
										alt={app.attributes.name}
										className="mb-2 rounded-lg"
										width={64}
										height={64}
									/>
									<CardTitle>{app.attributes.name}</CardTitle>
									<CardDescription>
										<p>
											{app.attributes.platformAttributes.ios.subtitle}
											<br />
											<p className="md:hidden">
												by {app.attributes.artistName}
											</p>
											<p className="hidden md:block">
												by &quot;
												{app.attributes.artistName.length > 25
													? `${app.attributes.artistName.slice(0, 25)}...`
													: app.attributes.artistName}
												&quot;
											</p>
										</p>
									</CardDescription>
								</CardHeader>
								<CardFooter>
									<Button
										onClick={() => {
											// add an element to page
											// <meta name="apple-itunes-app" content="app-id=id<app id from json>">
											// and remove old one if exists
											router.push(
												`/tools/app_banner_view?appData=${encodeURIComponent(
													JSON.stringify({
														attributes: {
															name: app.attributes.name,
														},
														id: app.id,
													}),
												)}`,
											);
											router.refresh();
											// window.location.reload();
											toast({
												title: "Success",
												description: "Banner has been loaded.",
											});
										}}
									>
										Load Banner
									</Button>
								</CardFooter>
							</Card>
						</>
					))}
				</div>
			</div>
		</div>
		</ScrollArea>
	);
}
