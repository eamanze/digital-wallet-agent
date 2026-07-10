const test=require("node:test");const assert=require("node:assert/strict");
const base=process.env.E2E_BASE_URL;
test("E2E health smoke test",{skip:!base},async()=>{const response=await fetch(`${base}/health/live`);assert.equal(response.ok,true);});
test("E2E critical journey is enabled only with an explicit environment",{skip:!process.env.RUN_E2E},()=>assert.ok(process.env.E2E_BASE_URL));
