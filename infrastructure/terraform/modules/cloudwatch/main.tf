variable "name" { type=string }
variable "tags" { type=map(string) default={} }
resource "aws_cloudwatch_log_group" "this" { name="/wallet/${var.name}" retention_in_days=90 tags=var.tags }
resource "aws_cloudwatch_dashboard" "this" { dashboard_name="${var.name}-dashboard" dashboard_body=jsonencode({widgets=[]}) }
output "log_group_name" { value=aws_cloudwatch_log_group.this.name }
