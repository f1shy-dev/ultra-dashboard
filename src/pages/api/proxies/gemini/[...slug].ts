import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = Partial<{
	[key: string]: unknown | Record<string, unknown>;
}>;

const BASE = "https://generativelanguage.googleapis.com";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<ResponseData>,
) {
	const { slug } = req.query;
	const req_url = new URL(
		req.url || "",
		"https://generativelanguage.googleapis.com",
	);
	const url = `${BASE}/${[slug].flat().join("/")}${req_url.search}`;
	const _headers = { ...req.headers };

	_headers.host = "generativelanguage.googleapis.com";
	_headers.origin = "https://generativelanguage.googleapis.com";
	_headers.referer = "https://generativelanguage.googleapis.com";
	_headers["sec-fetch-dest"] && (_headers["sec-fetch-dest"] = undefined);
	_headers["sec-fetch-mode"] && (_headers["sec-fetch-mode"] = undefined);
	_headers["sec-fetch-site"] && (_headers["sec-fetch-site"] = undefined);
	_headers["accept-encoding"] && (_headers["accept-encoding"] = undefined);

	// console.log({ _headers });
	const gemini_res = await fetch(url, {
		method: req.method,
		body: typeof req.body === "string" ? req.body : JSON.stringify(req.body),
	});

	const data = await gemini_res.json();
	// console.log({ data, url });

	res.status(gemini_res.status).json(data);
	// res.status(200).json({ message: "Hello from Next.js!", url, req });
}
