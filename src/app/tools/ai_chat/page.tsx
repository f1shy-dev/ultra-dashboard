import dynamic from "next/dynamic";
import FileBrowser from "./filebrowser";

// const FileBrowser = dynamic(() => import("@/app/tools/ai_chat/filebrowser"), {
// 	ssr: false,
// });

export default function Page() {
	return (
		<div className="flex flex-col w-full h-[calc(100vh-8rem)] items-center sm:justify-center">
			<FileBrowser />
		</div>
	);
}
