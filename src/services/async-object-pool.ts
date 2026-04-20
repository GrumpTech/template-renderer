import { IAsyncFactory } from "../interfaces/async-factory";

export class AsyncObjectPool<T> {
  private readonly objects: T[] = [];

  constructor(private factory: IAsyncFactory<T>) {}

  public async getAsync(): Promise<T> {
    return this.objects.pop() ?? this.factory.createAsync();
  }

  public return(item: T) {
    this.objects.push(item);
  }
}
