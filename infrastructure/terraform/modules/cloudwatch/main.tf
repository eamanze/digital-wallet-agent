variable "name" { type=string }
variable "tags" { type=map(string) default={} }
resource "aws_cloudwatch_log_group" "this" { name="/wallet/${var.name}" retention_in_days=90 tags=var.tags }
resource "aws_cloudwatch_dashboard" "this" { dashboard_name="${var.name}-dashboard" dashboard_body=jsonencode({widgets=[{type="metric",x=0,y=0,width=12,height=6,properties={title="API request rate/errors",view="timeSeries",region=data.aws_region.current.name,metrics=[["Wallet/Application","http_requests_total",{stat="Sum"}],["Wallet/Application","http_server_errors_total",{stat="Sum"}]]}},{type="metric",x=12,y=0,width=12,height=6,properties={title="Infrastructure CPU",view="timeSeries",region=data.aws_region.current.name,metrics=[["AWS/ECS","CPUUtilization",{stat="Average"}],["AWS/RDS","CPUUtilization",{stat="Average"}]]}},{type="metric",x=0,y=6,width=12,height=6,properties={title="Queue depth and DLQ",view="timeSeries",region=data.aws_region.current.name,metrics=[["AWS/SQS","ApproximateNumberOfMessagesVisible",{stat="Maximum"}]]}}]}) }
data "aws_region" "current" {}
output "log_group_name" { value=aws_cloudwatch_log_group.this.name }
variable "runbook_base_url" { type=string default="https://github.com/example/digital-wallet-agent/tree/main/docs/runbooks" }
variable "alarm_topic_arn" { type=string default=null }
variable "service_names" { type=set(string) default=[] }
variable "monthly_budget_usd" { type=number default=0 }
variable "billing_alarm_email" { type=string default=null }

resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  for_each=var.service_names
  alarm_name="${var.name}-${each.key}-api-5xx"
  namespace="Wallet/Application"
  metric_name="http_server_errors_total"
  dimensions={Service=each.key,Environment=var.name}
  statistic="Sum"
  period=300
  evaluation_periods=2
  threshold=5
  comparison_operator="GreaterThanOrEqualToThreshold"
  alarm_description="5xx spike. Runbook: ${var.runbook_base_url}/api-errors.md"
  treat_missing_data="notBreaching"
  alarm_actions=var.alarm_topic_arn==null?[]:[var.alarm_topic_arn]
}
resource "aws_cloudwatch_metric_alarm" "dlq" {
  for_each=var.service_names
  alarm_name="${var.name}-${each.key}-dlq"
  namespace="AWS/SQS"
  metric_name="ApproximateNumberOfMessagesVisible"
  dimensions={QueueName="${var.name}-${each.key}-dlq"}
  statistic="Maximum"
  period=300
  evaluation_periods=1
  threshold=1
  comparison_operator="GreaterThanOrEqualToThreshold"
  alarm_description="Dead-letter message detected. Runbook: ${var.runbook_base_url}/dlq-financial-messages.md"
  treat_missing_data="notBreaching"
  alarm_actions=var.alarm_topic_arn==null?[]:[var.alarm_topic_arn]
}
resource "aws_cloudwatch_metric_alarm" "rds_cpu" { alarm_name="${var.name}-rds-cpu" namespace="AWS/RDS" metric_name="CPUUtilization" statistic="Average" period=300 evaluation_periods=3 threshold=80 comparison_operator="GreaterThanThreshold" alarm_description="RDS CPU high. Runbook: ${var.runbook_base_url}/rds-connection-exhaustion.md" treat_missing_data="notBreaching" alarm_actions=var.alarm_topic_arn==null?[]:[var.alarm_topic_arn] }
resource "aws_cloudwatch_metric_alarm" "rds_storage" { alarm_name="${var.name}-rds-storage" namespace="AWS/RDS" metric_name="FreeStorageSpace" statistic="Minimum" period=300 evaluation_periods=2 threshold=10737418240 comparison_operator="LessThanThreshold" alarm_description="RDS storage pressure. Runbook: ${var.runbook_base_url}/rds-storage-pressure.md" treat_missing_data="breaching" alarm_actions=var.alarm_topic_arn==null?[]:[var.alarm_topic_arn] }
resource "aws_cloudwatch_metric_alarm" "estimated_charges" {
  count=var.monthly_budget_usd>0?1:0
  alarm_name="${var.name}-estimated-charges"
  namespace="AWS/Billing"
  metric_name="EstimatedCharges"
  dimensions={Currency="USD"}
  statistic="Maximum"
  period=21600
  evaluation_periods=1
  threshold=var.monthly_budget_usd
  comparison_operator="GreaterThanOrEqualToThreshold"
  alarm_description="Estimated AWS charges exceeded budget. Review FinOps report and remove unused resources."
  treat_missing_data="notBreaching"
  alarm_actions=var.alarm_topic_arn==null?[]:[var.alarm_topic_arn]
}
