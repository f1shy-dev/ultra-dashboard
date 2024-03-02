export default function Page({ params }: { params: { path: string[] } }) {
	return <div>My Post: {params.path.join("/")}</div>;
}
