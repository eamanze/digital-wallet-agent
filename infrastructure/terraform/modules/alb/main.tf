variable "name" { type=string }
variable "vpc_id" { type=string }
variable "subnet_ids" { type=list(string) }
variable "tags" { type=map(string) default={} }
resource "aws_security_group" "this" { name="${var.name}-alb" vpc_id=var.vpc_id ingress { from_port=80 to_port=80 protocol="tcp" cidr_blocks=["0.0.0.0/0"] } ingress { from_port=443 to_port=443 protocol="tcp" cidr_blocks=["0.0.0.0/0"] } egress { from_port=0 to_port=0 protocol="-1" cidr_blocks=["0.0.0.0/0"] } tags=var.tags }
resource "aws_lb" "this" { name=var.name load_balancer_type="application" internal=false subnets=var.subnet_ids security_groups=[aws_security_group.this.id] tags=var.tags }
output "arn" { value=aws_lb.this.arn }
output "dns_name" { value=aws_lb.this.dns_name }
