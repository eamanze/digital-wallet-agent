output "vpc_id" { value = module.vpc.vpc_id }
output "rds_endpoint" { value = module.rds.endpoint }
output "redis_endpoint" { value = module.redis.endpoint }
output "ecs_cluster" { value = module.ecs.cluster_name }
output "kyc_bucket" { value = module.s3_kyc.name }
