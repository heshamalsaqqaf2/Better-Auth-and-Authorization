import { registerAuthBindings } from "@/Modules/Authentication/Composition";
import { container } from "./container";

registerAuthBindings(container);

export { Container, container, getContainer } from "./container";
