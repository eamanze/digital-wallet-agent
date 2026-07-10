const { randomUUID } = require("crypto");

async function publishOutboxEvent(client, event) {
  await client.query(
    `INSERT INTO platform.outbox_events (
      id, event_type, event_version, producer, correlation_id, causation_id, payload
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      event.id || randomUUID(),
      event.event_type,
      event.event_version || "1.0",
      event.producer,
      event.correlation_id || null,
      event.causation_id || null,
      event.payload || {}
    ]
  );
}

module.exports = { publishOutboxEvent };

