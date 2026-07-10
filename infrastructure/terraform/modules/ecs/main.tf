variable "name" { type=string }
variable "subnet_ids" { type=list(string) }
variable "vpc_id" { type=string }
variable "task_role_arn" { type=string }
variable "log_group_name" { type=string }
variable "services" { type=map(object({ image=string port=number cpu=number memory=number desired_count=number })) }
variable "tags" { type=map(string) default={} }
resource "aws_ecs_cluster" "this" { name=var.name setting { name="containerInsights" value="enabled" } tags=var.tags }
resource "aws_security_group" "tasks" { name="${var.name}-tasks" vpc_id=var.vpc_id egress { from_port=0 to_port=0 protocol="-1" cidr_blocks=["0.0.0.0/0"] } tags=var.tags }
resource "aws_ecs_task_definition" "this" { for_each=var.services family="${var.name}-${each.key}" requires_compatibilities=["FARGATE"] network_mode="awsvpc" cpu=each.value.cpu memory=each.value.memory execution_role_arn=var.task_role_arn task_role_arn=var.task_role_arn container_definitions=jsonencode([{name=each.key,image=each.value.image,essential=true,portMappings=[{containerPort=each.value.port}],logConfiguration={logDriver="awslogs",options={"awslogs-group"=var.log_group_name,"awslogs-region"=data.aws_region.current.name,"awslogs-stream-prefix"=each.key}}}]) }
data "aws_region" "current" {}
resource "aws_ecs_service" "this" { for_each=var.services name=each.key cluster=aws_ecs_cluster.this.id task_definition=aws_ecs_task_definition.this[each.key].arn desired_count=each.value.desired_count launch_type="FARGATE" network_configuration { subnets=var.subnet_ids security_groups=[aws_security_group.tasks.id] assign_public_ip=false } deployment_minimum_healthy_percent=50 deployment_maximum_percent=200 tags=var.tags }
output "cluster_name" { value=aws_ecs_cluster.this.name }
output "task_security_group_id" { value=aws_security_group.tasks.id }
