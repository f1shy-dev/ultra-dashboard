import dynamic, { DynamicOptionsLoadingProps } from "next/dynamic";
import React, { ReactElement } from "react";

const NoSSR = (props: { children: React.ReactNode }) => <>{props.children}</>;

const fn = ({
	loading,
}: { loading?: (loadingProps: DynamicOptionsLoadingProps) => JSX.Element }) =>
	dynamic(() => Promise.resolve(NoSSR), {
		ssr: false,
		loading,
	});

export default fn;
