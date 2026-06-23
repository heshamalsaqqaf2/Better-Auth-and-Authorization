/** biome-ignore-all assist/source/organizeImports: <Ignored Sort Imports> */

import { container } from "./container";
import { registerAuthBindings } from "@/Modules/Authentication/Composition";

registerAuthBindings(container);

export { Container, container, getContainer } from "./container";
