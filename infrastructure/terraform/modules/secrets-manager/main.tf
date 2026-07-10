variable "name" { type=string }
variable "kms_key_id" { type=string }
variable "tags" { type=map(string) default={} }
resource "aws_secretsmanager_secret" "this" { name=var.name kms_key_id=var.kms_key_id recovery_window_in_days=30 tags=var.tags }
output "arn" { value=aws_secretsmanager_secret.this.arn }
