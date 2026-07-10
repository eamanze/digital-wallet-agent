variable "name" { type=string }
variable "subnet_ids" { type=list(string) }
variable "vpc_id" { type=string }
variable "node_type" { type=string }
variable "kms_key_arn" { type=string }
variable "tags" { type=map(string) default={} }
resource "aws_elasticache_subnet_group" "this" { name=var.name subnet_ids=var.subnet_ids }
resource "aws_security_group" "this" { name="${var.name}-redis" vpc_id=var.vpc_id egress { from_port=0 to_port=0 protocol="-1" cidr_blocks=["0.0.0.0/0"] } tags=var.tags }
resource "aws_elasticache_replication_group" "this" { replication_group_id=var.name description="Wallet Redis" node_type=var.node_type num_cache_clusters=2 engine="redis" at_rest_encryption_enabled=true transit_encryption_enabled=true kms_key_id=var.kms_key_arn subnet_group_name=aws_elasticache_subnet_group.this.name security_group_ids=[aws_security_group.this.id] automatic_failover_enabled=true multi_az_enabled=true }
output "endpoint" { value=aws_elasticache_replication_group.this.primary_endpoint_address }
output "security_group_id" { value=aws_security_group.this.id }
