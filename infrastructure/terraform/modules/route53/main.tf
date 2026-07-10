variable "zone_name" { type=string }
variable "tags" { type=map(string) default={} }
resource "aws_route53_zone" "this" { name=var.zone_name tags=var.tags }
output "zone_id" { value=aws_route53_zone.this.zone_id }
output "name_servers" { value=aws_route53_zone.this.name_servers }
