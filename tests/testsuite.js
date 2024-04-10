class TestSuite {
  constructor() {
    this.tests = [];
  }
  testGroup(name, tests, disabled = false) {
    console.group(name);
    if (disabled) {
      console.log("Tests disabled");
      console.groupEnd();
      return;
    }
    const passed = this.runTests(tests);
    console.groupEnd();
    console.log(
      `${passed === tests.length ? "👌" : "❌"} ${name}  |  ${passed}/${
        tests.length
      } passed`
    );
  }
  makeTest(name, expected, fn) {
    const test = {
      name,
      expected,
      run() {
        const result = fn();
        if (result !== expected) {
          throw new Error(`expected ${expected} but got ${result}`);
        }
      },
    };
    return test;
  }
  runTests(tests = this.tests) {
    console.log("Running tests...");
    let passedNum = 0;
    tests.forEach((test) => {
      if (typeof test === "function") {
        test();
        return;
      }
      try {
        const start = performance.now();
        test.run();
        const end = performance.now();
        console.log(`✅ ${test.name} | ${(end - start).toFixed(2)}ms`);
        passedNum++;
      } catch (e) {
        console.log(`❌ ${test.name} | ${e.message}`);
      }
    });
    return passedNum;
  }
}

const tests = new TestSuite();
export default tests;
// export default TestSuite;
