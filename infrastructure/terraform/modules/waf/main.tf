variable "name" { type=string }
variable "tags" { type=map(string) default={} }
resource "aws_wafv2_web_acl" "this" { name=var.name scope="REGIONAL" default_action { allow {} } visibility_config { cloudwatch_metrics_enabled=true metric_name=var.name sampled_requests_enabled=true } rule { name="AWSManagedCommonRules" priority=1 override_action { none {} } statement { managed_rule_group_statement { name="AWSManagedRulesCommonRuleSet" vendor_name="AWS" } } visibility_config { cloudwatch_metrics_enabled=true metric_name="${var.name}-common" sampled_requests_enabled=true } } tags=var.tags }
output "arn" { value=aws_wafv2_web_acl.this.arn }
