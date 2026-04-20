import assert from "assert";
import { Mutex } from "../../src/services/mutex";

describe("Mutex", function () {
  const errorMessage = new RegExp(
    "^Failed releasing mutex. Mutex was not locked.$",
  );

  it("lockAsync", async function () {
    const mutex = new Mutex();

    await mutex.lockAsync();
    mutex.unlock();
  });

  it("unlock should trow error", async function () {
    const mutex = new Mutex();

    assert.throws(() => mutex.unlock(), errorMessage);
  });

  it("lockAsync and unlock twice", async function () {
    const mutex = new Mutex();

    await mutex.lockAsync();
    mutex.unlock();
    await mutex.lockAsync();
    mutex.unlock();
  });

  it("lockAsync and then unlock twice should throw error", async function () {
    const mutex = new Mutex();

    await mutex.lockAsync();
    mutex.unlock();

    assert.throws(() => mutex.unlock(), errorMessage);
  });

  it("lockAsync and unlock twice", async function () {
    const mutex = new Mutex();

    mutex.lockAsync();
    const promise = mutex.lockAsync();
    mutex.unlock();
    mutex.unlock();

    await promise;
  });

  it("lockAsync and unlock three times", async function () {
    const mutex = new Mutex();

    mutex.lockAsync();
    const promise = mutex.lockAsync();
    const promise2 = mutex.lockAsync();
    mutex.unlock();
    mutex.unlock();
    mutex.unlock();

    await promise;
    await promise2;
  });

  it("isLocked", async function () {
    const mutex = new Mutex();

    assert.equal(mutex.isLocked(), false);

    await mutex.lockAsync();
    assert.equal(mutex.isLocked(), true);

    mutex.unlock();
    assert.equal(mutex.isLocked(), false);
  });

  it("lockAsync waits until mutex is unlocked", async function () {
    const mutex = new Mutex();
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(resolve, 100, true);
    });

    mutex.lockAsync();
    mutex.lockAsync();
    const promise = mutex.lockAsync();
    mutex.unlock();

    Promise.race([promise, timeoutPromise]).then((value) => {
      assert.equal(value, true); // timeoutPromise finishes first passing the value true
    });
    assert.equal(mutex.isLocked(), true);

    mutex.unlock();
    Promise.race([promise, timeoutPromise]).then((value) => {
      assert.equal(value, undefined); // promise finishes first passing the value undefined
    });
    assert.equal(mutex.isLocked(), true);

    mutex.unlock();
    assert.equal(mutex.isLocked(), false);
  });
});
