Object.fromEntries(
	[
		...document.querySelectorAll(
			"body > div.layout-content.status.status-index.starter > div.container > div.components-section.font-regular > div.components-container.one-column > div.component-container.border-color.is-group",
		),
	].map((group) => {
		const gname = group.querySelector(".name").innerText.trim();
		const subservers = [
			...group.querySelectorAll(".child-components-container > div > .name"),
		].map((x) => ({
			id: x.innerText.replace("[RTX 4080]", "").trim(),
			is4080Server: x.innerText.includes("[RTX 4080]"),
		}));
		const is4080Ready = gname.includes("[RTX 4080 Ready]");
		const isAlliance = gname.includes("- Alliance Partner");
		const clean_name = gname
			.replace("- Alliance Partner", "")
			.replace("[RTX 4080 Ready]", "")
			.trim();
		return [
			clean_name,
			{
				isAlliance,
				is4080Ready,
				subservers,
			},
		];
	}),
);
