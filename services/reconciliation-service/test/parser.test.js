const test=require("node:test");const assert=require("node:assert/strict");const {parseFile}=require("../src/parser");
test("parses CSV and normalizes provider fields",()=>{const result=parseFile("reference,transaction_reference,amount_minor,currency,status\np1,tx1,1000,ngn,successful\n");assert.equal(result[0].provider_reference,"p1");assert.equal(result[0].currency,"NGN");});
test("parses JSON settlement records",()=>assert.equal(parseFile([{provider_reference:"p1",amount_minor:1,currency:"NGN",status:"pending"}],"json").length,1));
