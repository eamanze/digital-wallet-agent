import { Card } from "@/components/ui/Card";

const notifications = [
  ["Transfer successful", "Your transfer to Tunde Balogun was completed."],
  ["KYC approved", "Your account is now on Tier 2 limits."],
  ["Security reminder", "Never share OTP or transaction PIN with anyone."]
];

export default function NotificationsPage() {
  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Sensitive information must be masked in SMS, email and push messages.</p>
        </div>
      </header>
      <div className="grid">
        {notifications.map(([title, message]) => <Card key={title} title={title} meta={message}><span /></Card>)}
      </div>
    </>
  );
}
