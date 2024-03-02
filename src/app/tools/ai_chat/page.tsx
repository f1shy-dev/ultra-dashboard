import { FileBrowser } from "@/components/filebrowser";

export default function Page() {
    return <div className="flex flex-col w-full h-[calc(100vh-8rem)] items-center justify-center">
        <FileBrowser />
    </div>
}