export class Mutex {
  private locked = false;
  private promiseQueue: PromiseWithResolvers<void>[] = [];

  // wait until mutex lock is acquired; if not directly available, queue a promise.
  public async lockAsync(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    const promise = Promise.withResolvers<void>();
    this.promiseQueue.push(promise);
    return await promise.promise;
  }

  // unlock mutex once
  public unlock() {
    if (this.locked == false) {
      throw "Failed releasing mutex. Mutex was not locked.";
    }
    const promise = this.promiseQueue.shift();
    if (promise) {
      this.resolvePromise(promise);
    } else {
      this.locked = false;
    }
  }

  public isLocked() {
    return this.locked;
  }

  private resolvePromise(promise: PromiseWithResolvers<void>): void {
    setImmediate(() => {
      promise.resolve();
    });
  }
}
