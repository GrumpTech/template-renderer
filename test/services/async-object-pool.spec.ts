import assert from "assert";
import { AsyncObjectPool } from "../../src/services/async-object-pool";

describe("Async object pool", function () {
  class TestClass {
    constructor(public value: number) {}
  }

  it("getAsync", async function () {
    const objectPool = getObjectPool(2);

    const res = await objectPool.getAsync();

    assert.equal(res.value, 2);
  });

  it("return", async function () {
    const objectPool = getObjectPool(2);
    objectPool.return(new TestClass(1));

    const res = await objectPool.getAsync();
    const res2 = await objectPool.getAsync();

    assert.equal(res.value, 1);
    assert.equal(res2.value, 2);
  });

  function getObjectPool(value: number): AsyncObjectPool<TestClass> {
    const factory = {
      createAsync: async () => {
        return new TestClass(value);
      },
    };
    return new AsyncObjectPool<TestClass>(factory);
  }
});
