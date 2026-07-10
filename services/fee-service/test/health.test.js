const test=require("node:test");const assert=require("node:assert/strict");const {createApp}=require("../src/app");const {inject}=require("../../../tests/helpers/inject-express");const {signAccessToken}=require("@wallet/common");
test("fee-service live health returns ok",async()=>{const {app}=createApp({config:{serviceName:"fee-service",jwtAccessSecret:"x",jwtRefreshSecret:"x"},pool:{query:async()=>({rows:[]})},logger:{warn(){},error(){}}});const response=await inject(app,{method:"GET",path:"/health/live"});assert.equal(response.status,200);assert.equal(response.body.status,"ok");});

test("admin fee configuration change writes an audit record",async()=>{
  const calls=[];const config={serviceName:"fee-service",jwtAccessSecret:"test-access-secret",jwtRefreshSecret:"test-refresh",accessTokenTtlSeconds:60};
  const client={async query(sql){calls.push(sql);if(sql.includes("MAX(version)"))return{rows:[{version:2}]};if(sql.includes("INSERT INTO risk.fee_config_versions"))return{rows:[{id:"10000000-0000-0000-0000-000000000001",version:2,status:"active"}]};if(sql.includes("FROM risk.fee_config_versions WHERE status"))return{rows:[{id:"10000000-0000-0000-0000-000000000001",version:2,status:"active"}]};if(sql.includes("FROM risk.fee_rules WHERE"))return{rows:[{fee_code:"TEST",transaction_type:"wallet_transfer",channel:"*",currency:"NGN"}]};if(sql.includes("SELECT event_hash"))return{rows:[]};return{rows:[]};},release(){}};
  let loggedError;const pool={connect:async()=>client,query:client.query.bind(client)};const {app}=createApp({config,pool,logger:{warn(){},error(value){loggedError=value.err;}}});
  const token=signAccessToken(config,{sub:"20000000-0000-0000-0000-000000000001",roles:["finance_admin"]});
  const response=await inject(app,{method:"POST",path:"/fees/config",headers:{authorization:`Bearer ${token}`},body:{description:"new fees",reason:"approved pricing update",rules:[{fee_code:"TEST",transaction_type:"wallet_transfer",channel:"*",currency:"NGN",fixed_amount_minor:100}]}});
  assert.equal(response.status,201,loggedError?.stack||"configuration request failed");assert.ok(calls.some(sql=>sql.includes("INSERT INTO audit.audit_logs")));
});
