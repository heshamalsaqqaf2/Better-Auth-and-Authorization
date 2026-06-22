type Factory<T> = () => T;

interface Binding<T> {
  factory: Factory<T>;
  singleton: boolean;
  instance?: T;
}

export class Container {
  private readonly bindings = new Map<string, Binding<unknown>>();

  bind<T>(token: string, factory: Factory<T>, singleton = true): void {
    this.bindings.set(token, { factory, singleton });
  }

  resolve<T>(token: string): T {
    const binding = this.bindings.get(token);
    if (!binding) {
      throw new Error(`No binding registered for token: ${token}`);
    }
    if (binding.singleton) {
      if (!binding.instance) {
        binding.instance = binding.factory();
      }
      return binding.instance as T;
    }
    return binding.factory() as T;
  }

  isBound(token: string): boolean {
    return this.bindings.has(token);
  }
}

export const container = new Container();

export function getContainer(): Container {
  return container;
}
