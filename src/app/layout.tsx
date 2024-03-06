import { Menu } from "@/components/menu";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { SWRConfig } from "swr";
import "./globals.css";
import { Provider } from "jotai";

const fontSans = FontSans({
	subsets: ["latin"],
	variable: "--font-sans",
});

export const metadata: Metadata = {
	title: "DB Ultra",
	description: "The dashboard to end them all.",
	appleWebApp: {
		capable: true,
		title: "DB Ultra",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={cn(
					"min-h-screen bg-background font-sans antialiased overflow-y-hidden",
					fontSans.variable,
				)}
			>
				<Provider>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<div>
							<Menu />
							<div className="border-t">
								<div className="bg-background">
									<div className="grid lg:grid-cols-5">
										<Sidebar className="hidden lg:block" />
										<div className="col-span-3 lg:col-span-4 lg:border-l">
											{children}
										</div>
									</div>
								</div>
							</div>
						</div>
					</ThemeProvider>
				</Provider>
			</body>
		</html>
	);
}
