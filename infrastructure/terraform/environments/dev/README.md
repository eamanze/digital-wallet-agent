# Dev environment

Copy `terraform.tfvars.example` to a local `.tfvars` file, provide `TF_VAR_db_password` from a secret manager, then run `terraform init`, `terraform validate`, and `terraform plan`. Dev uses smaller instances, two AZs, and no RDS deletion protection.
