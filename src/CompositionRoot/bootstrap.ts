import "reflect-metadata";
import { Container } from "inversify";
import { AUTH_TOKENS, authContainerModule } from "@/Modules/Authentication/Composition";

let _container: Container | null = null;

const VALIDATION_TOKENS: symbol[] = [AUTH_TOKENS.BETTER_AUTH_SERVICE];

function getOrCreateContainer(): Container {
  if (!_container) {
    _container = new Container({ defaultScope: "Transient" });
    _container.load(authContainerModule);
    validateBindings(_container);
  }
  return _container;
}

function validateBindings(container: Container): void {
  for (const token of VALIDATION_TOKENS) {
    try {
      container.get(token);
    } catch (e) {
      throw new Error(
        `CompositionRoot: missing binding for ${token.description ?? String(token)}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}

export function resolve<T>(token: symbol): T {
  return getOrCreateContainer().get<T>(token);
}

export function initialize(): void {
  getOrCreateContainer();
}
