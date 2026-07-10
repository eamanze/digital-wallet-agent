const { randomUUID, createHash } = require("crypto");

function hashAuditEvent(event, previousHash) {
  return createHash("sha256")
    .update(JSON.stringify({ event, previousHash: previousHash || null }))
    .digest("hex");
}

async function writeAudit(client, event) {
  const auditReference = event.audit_reference || `AUD-${randomUUID()}`;
  const previous = await client.query(
    "SELECT event_hash FROM audit.audit_logs ORDER BY created_at DESC LIMIT 1"
  );
  const previousHash = previous.rows[0]?.event_hash || null;
  const eventHash = hashAuditEvent(event, previousHash);

  await client.query(
    `INSERT INTO audit.audit_logs (
      audit_reference, actor_type, actor_id, action, resource_type, resource_id,
      result, reason, correlation_id, request_id, ip_address_hash, device_id,
      before_metadata, after_metadata, metadata, previous_hash, event_hash
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [
      auditReference,
      event.actor_type,
      event.actor_id || null,
      event.action,
      event.resource_type,
      event.resource_id || null,
      event.result,
      event.reason || null,
      event.correlation_id || null,
      event.request_id || null,
      event.ip_address_hash || null,
      event.device_id || null,
      event.before_metadata || null,
      event.after_metadata || null,
      event.metadata || {},
      previousHash,
      eventHash
    ]
  );
}

module.exports = { writeAudit };

