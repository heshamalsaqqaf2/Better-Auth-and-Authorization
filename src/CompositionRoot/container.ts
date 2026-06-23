type Factory<T> = () => T;

interface Binding<T> {
  factory: Factory<T>;
  singleton: boolean;
  instance?: T;
}

export class Container {
  private readonly bindings = new Map<symbol, Binding<unknown>>();

  bind<T>(token: symbol, factory: Factory<T>, singleton = false): void {
    this.bindings.set(token, { factory, singleton });
  }

  resolve<T>(token: symbol): T {
    const binding = this.bindings.get(token);
    if (!binding) {
      throw new Error(`No binding registered for token: ${token.description ?? String(token)}`);
    }
    if (binding.singleton) {
      if (!binding.instance) {
        binding.instance = binding.factory();
      }
      return binding.instance as T;
    }
    return binding.factory() as T;
  }

  isBound(token: symbol): boolean {
    return this.bindings.has(token);
  }
}

export const container = new Container();
export function getContainer(): Container {
  return container;
}
