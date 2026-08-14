Create a NotificationService abstraction.

Support email notifications for:

Account verification
Password reset
Order confirmation
Payment confirmation
Order processing
Order shipped
Order delivered
Refund
Newsletter

Do not hard-code an email provider into business logic.

Create templates with reusable branding.

Store notification status:

pending
sent
failed

Log failures.

Make notification processing retry-safe.