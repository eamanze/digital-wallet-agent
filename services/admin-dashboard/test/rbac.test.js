const test=require("node:test");const assert=require("node:assert/strict");const {hasPermission,canApprove}=require("../src/rbac");
test("roles have least-privilege permissions",()=>{assert.equal(hasPermission(["support_agent"],"users:read"),true);assert.equal(hasPermission(["support_agent"],"ledger:read"),false);assert.equal(hasPermission(["auditor"],"audit:read"),true);});
test("checker permissions are role controlled",()=>{assert.equal(canApprove(["compliance_officer"],"kyc_decision"),true);assert.equal(canApprove(["support_agent"],"manual_reversal"),false);});
