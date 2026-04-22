export interface UnitOfWorkPort {
  run<T>(fn: () => Promise<T>): Promise<T>;
}

