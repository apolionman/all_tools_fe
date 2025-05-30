declare module "*.svg?react" {
	import * as React from "react";
	const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
	export default ReactComponent;
}

declare module "*.scss";
declare module "*.png";
declare module "*.jpg";
declare module "*.svg";
