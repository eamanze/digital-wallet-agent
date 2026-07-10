function csvEscape(value){const text=value===null||value===undefined?"":String(value);return /[",\n]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;}
function toCsv(rows){if(!rows.length)return "";const headers=["exception_type","provider_reference","transaction_reference","amount_minor","currency","severity","resolution_status"];return [headers.join(","),...rows.map((row)=>headers.map((key)=>csvEscape(row[key])).join(","))].join("\n");}
module.exports={toCsv,csvEscape};
