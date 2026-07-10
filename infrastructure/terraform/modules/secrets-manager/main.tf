variable "name" { type=string }
variable "tags" { type=map(string) default={} }
resource "aws_secretsmanager_secret" "this" { name=var.name kms_key_id=null recovery_window_in_days=30 tags=var.tags }
output "arn" { value=aws_secretsmanager_secret.this.arn }
