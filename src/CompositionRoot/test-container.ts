import { Container } from "inversify";

export function createTestContainer(): Container {
  return new Container({ defaultScope: "Transient" });
}

export function bindMock<T>(container: Container, token: symbol, mock: T): void {
  container.bind<T>(token).toConstantValue(mock);
}
