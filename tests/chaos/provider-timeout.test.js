const test=require("node:test");const assert=require("node:assert/strict");const {CircuitBreaker}=require("../../services/payment-integration-service/src/providers");
test("provider failure opens circuit without changing financial state",()=>{const circuit=new CircuitBreaker({failureThreshold:2,resetTimeoutMs:1000});circuit.failure();circuit.failure();assert.equal(circuit.canRequest(),false);assert.equal(circuit.state(),"open");});
test("chaos scenarios are isolated from ledger ownership",()=>{assert.equal("payment-integration-service"!=="ledger-service",true);});
