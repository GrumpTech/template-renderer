export interface IAsyncFactory<T> {
  createAsync: () => Promise<T>;
}
