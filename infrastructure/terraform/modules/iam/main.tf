variable "name" { type=string }
variable "tags" { type=map(string) default={} }
resource "aws_iam_role" "task" { name="${var.name}-task" assume_role_policy=jsonencode({Version="2012-10-17",Statement=[{Effect="Allow",Principal={Service="ecs-tasks.amazonaws.com"},Action="sts:AssumeRole"}]}) tags=var.tags }
resource "aws_iam_role_policy_attachment" "logs" { role=aws_iam_role.task.name policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" }
output "task_role_arn" { value=aws_iam_role.task.arn }
