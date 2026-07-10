class MockEmailProvider { async send(input) { return { status: "sent", provider_message_id: `email-${input.notification_id}` }; } }
class MockSmsProvider { async send(input) { return { status: "sent", provider_message_id: `sms-${input.notification_id}` }; } }
class MockPushProvider { async send(input) { return { status: "sent", provider_message_id: `push-${input.notification_id}` }; } }
module.exports = { MockEmailProvider, MockSmsProvider, MockPushProvider };
