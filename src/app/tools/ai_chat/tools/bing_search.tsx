import { Tool } from "../shared/model_adapter";

type Input = {
	queries: string[];
};

type Link = { link: string; title: string };

interface Result {
	type: "web";
	title: string;
	website?: string;
	links: Link[];
	snippet: string;
}

type Output = {
	results: Result[];
	relatedSearches: string[];
};
export const BingSearchTool: Tool<Input, Output> = {
	name: "search_web",
	description:
		"Use this to search the web when the user's query requires it, or when you are unsure of information, such as those related to current events.",
	run: (input) => {
		console.log("input", input);
		return fetch(
			"https://bing_websearch_proxy.f1shylabs.workers.dev/web_search",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(input),
			},
		).then((res) => res.json());
	},
	schema: {
		type: "object",
		properties: {
			queries: {
				type: "array",
				items: {
					type: "string",
				},
			},
		},
		required: ["queries"],
	},
};
