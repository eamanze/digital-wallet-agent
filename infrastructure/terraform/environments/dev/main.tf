terraform { required_version=">= 1.6.0"
required_providers { aws={source="hashicorp/aws",version="~> 5.0"} } }
provider "aws" { region=var.aws_region }
locals { tags={Project="digital-wallet",Environment=var.environment,ManagedBy="terraform",Owner="platform",CostCenter="wallet-platform",DataClassification="internal"} }
module "vpc" { source="../../modules/vpc" name="${var.name}-vpc" cidr=var.vpc_cidr azs=var.azs tags=local.tags }
module "kms" { source="../../modules/kms" name="${var.name}" tags=local.tags }
module "rds" { source="../../modules/rds" name="${var.name}-postgres" subnet_ids=module.vpc.data_subnet_ids vpc_id=module.vpc.vpc_id kms_key_arn=module.kms.arn instance_class=var.db_instance_class multi_az=var.multi_az deletion_protection=var.deletion_protection password=var.db_password tags=local.tags }
module "redis" { source="../../modules/redis" name="${var.name}-redis" subnet_ids=module.vpc.data_subnet_ids vpc_id=module.vpc.vpc_id node_type=var.redis_node_type kms_key_arn=module.kms.arn tags=local.tags }
module "logs" { source="../../modules/cloudwatch" name=var.name tags=local.tags }
module "iam" { source="../../modules/iam" name=var.name tags=local.tags }
module "ecr" { for_each=var.services source="../../modules/ecr" name="${var.name}/${each.key}" tags=local.tags }
module "ecs" { source="../../modules/ecs" name=var.name subnet_ids=module.vpc.app_subnet_ids vpc_id=module.vpc.vpc_id task_role_arn=module.iam.task_role_arn log_group_name=module.logs.log_group_name services=var.services tags=local.tags }
module "waf" { source="../../modules/waf" name="${var.name}-waf" tags=local.tags }
module "s3_kyc" { source="../../modules/s3" name="${var.name}-kyc-documents" kms_key_arn=module.kms.arn tags=local.tags }
module "s3_reports" { source="../../modules/s3" name="${var.name}-reconciliation-reports" kms_key_arn=module.kms.arn tags=local.tags }
module "sqs" { for_each=var.queues source="../../modules/sqs" name="${var.name}-${each.key}" kms_key_arn=module.kms.arn tags=local.tags }
