"use client";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { swrFetcher } from "@/lib/utils";
import useSWR from "swr";
import dayjs from "dayjs";
import RelativeTime from "dayjs/plugin/relativeTime";
import {
	GFN_SERVERID_TO_REGION_MAPPING,
	GFN_SERVER_DATA,
} from "@/lib/gfn_server_data";
dayjs.extend(RelativeTime);

type GFNQueueObject = {
	QueuePosition: number;
	"Last Updated": number;
	Region: string;
};

type GFNQueue = {
	[key: string]: GFNQueueObject;
};

export default function Page() {
	const { data, isLoading, error } = useSWR<GFNQueue>(
		"https://api.printedwaste.com/gfn/queue/cors",
		swrFetcher,
		{
			refreshInterval: 1500,
		},
	);
	const regions = [
		...new Set(Object.values(data || {}).flatMap((v) => v.Region)),
	];
	console.log(regions);

	return (
		<div className="space-y-6">
			{isLoading && (
				<div>
					<Skeleton className="h-[25px] w-[100px] rounded-md mb-4" />
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3">
						{[...Array(10)].map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							<Skeleton className="h-[80px] rounded-xl" key={i} />
						))}
					</div>
				</div>
			)}
			{data &&
				regions.map((region) => (
					<div key={region}>
						<h2 className="font-semibold text-lg mb-2">{region} Region</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3">
							{Object.entries(data)
								.filter(([_, data]) => data.Region === region)
								.map(([server, data]) => [
									server,
									data,
									GFN_SERVERID_TO_REGION_MAPPING[server] || null,
								])
								.sort((a, b) => a[1].QueuePosition - b[1].QueuePosition)
								.map((elements) => {
									const [server, data, serverData]: [
										string,
										GFNQueueObject,
										{ region: string; is4080Server: boolean } | null,
									] = elements as never;
									return (
										<Card key={server} className="relative">
											<Badge
												className="absolute right-4 top-4"
												variant={
													data.QueuePosition > 100
														? "destructive"
														: data.QueuePosition > 50
														  ? "yellow"
														  : "green"
												}
											>
												{data.QueuePosition}
											</Badge>
											<CardHeader>
												<CardTitle>
													{serverData != null ? serverData.region : server}
												</CardTitle>
												<CardDescription className="text-xs">
													<span className="font-mono">{server}</span> {"• "}
													{dayjs(data["Last Updated"] * 1000).fromNow()}
												</CardDescription>
											</CardHeader>
										</Card>
									);
								})}
						</div>
					</div>
				))}
		</div>
	);
}
