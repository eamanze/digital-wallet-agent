const test=require("node:test"); const assert=require("node:assert/strict"); const {redact}=require("../src/redaction"); const {eventHash}=require("../src/repository");
test("redacts secrets recursively",()=>{const value=redact({password:"x",nested:{otp:"123456",amount_minor:100}});assert.equal(value.password,"[REDACTED]");assert.equal(value.nested.otp,"[REDACTED]");assert.equal(value.nested.amount_minor,100);});
test("hash chain changes when event or previous hash changes",()=>{const event={action:"login",result:"success"};assert.notEqual(eventHash(event,"a"),eventHash(event,"b"));});
