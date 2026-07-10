variable "name" { type=string }
variable "tags" { type=map(string) default={} }
resource "aws_kms_key" "this" { description="${var.name} encryption key" enable_key_rotation=true deletion_window_in_days=30 tags=var.tags }
resource "aws_kms_alias" "this" { name="alias/${var.name}" target_key_id=aws_kms_key.this.key_id }
output "arn" { value=aws_kms_key.this.arn }
output "id" { value=aws_kms_key.this.id }
