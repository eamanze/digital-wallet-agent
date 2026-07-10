variable "name" { type=string }
variable "kms_key_arn" { type=string }
variable "tags" { type=map(string) default={} }
resource "aws_sqs_queue" "dlq" { name="${var.name}-dlq" kms_master_key_id=var.kms_key_arn message_retention_seconds=1209600 tags=var.tags }
resource "aws_sqs_queue" "this" { name=var.name kms_master_key_id=var.kms_key_arn visibility_timeout_seconds=60 redrive_policy=jsonencode({deadLetterTargetArn=aws_sqs_queue.dlq.arn,maxReceiveCount=5}) tags=var.tags }
output "arn" { value=aws_sqs_queue.this.arn }
output "url" { value=aws_sqs_queue.this.url }
output "dlq_arn" { value=aws_sqs_queue.dlq.arn }
