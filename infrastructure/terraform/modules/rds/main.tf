variable "name" { type=string }
variable "subnet_ids" { type=list(string) }
variable "vpc_id" { type=string }
variable "kms_key_arn" { type=string }
variable "instance_class" { type=string }
variable "multi_az" { type=bool }
variable "deletion_protection" { type=bool }
variable "password" { type=string sensitive=true }
variable "tags" { type=map(string) default={} }
resource "aws_db_subnet_group" "this" { name=var.name subnet_ids=var.subnet_ids tags=var.tags }
resource "aws_security_group" "this" { name="${var.name}-db" description="Private PostgreSQL" vpc_id=var.vpc_id tags=var.tags ingress { from_port=5432 to_port=5432 protocol="tcp" cidr_blocks=[] } egress { from_port=0 to_port=0 protocol="-1" cidr_blocks=["0.0.0.0/0"] } }
resource "aws_db_instance" "this" { identifier=var.name engine="postgres" engine_version="16" instance_class=var.instance_class allocated_storage=100 max_allocated_storage=500 storage_encrypted=true kms_key_id=var.kms_key_arn multi_az=var.multi_az db_subnet_group_name=aws_db_subnet_group.this.name vpc_security_group_ids=[aws_security_group.this.id] username="wallet" password=var.password db_name="wallet" backup_retention_period=7 deletion_protection=var.deletion_protection publicly_accessible=false skip_final_snapshot=false final_snapshot_identifier="${var.name}-final" tags=var.tags }
output "endpoint" { value=aws_db_instance.this.address }
output "port" { value=aws_db_instance.this.port }
output "security_group_id" { value=aws_security_group.this.id }
