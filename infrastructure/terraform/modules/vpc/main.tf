variable "name" { type=string }
variable "cidr" { type=string }
variable "azs" { type=list(string) }
variable "tags" { type=map(string) default={} }
resource "aws_vpc" "this" { cidr_block=var.cidr enable_dns_support=true enable_dns_hostnames=true tags=merge(var.tags,{Name=var.name}) }
resource "aws_internet_gateway" "this" { vpc_id=aws_vpc.this.id tags=merge(var.tags,{Name="${var.name}-igw"}) }
resource "aws_subnet" "public" { count=length(var.azs) vpc_id=aws_vpc.this.id availability_zone=var.azs[count.index] cidr_block=cidrsubnet(var.cidr,4,count.index) map_public_ip_on_launch=true tags=merge(var.tags,{Name="${var.name}-public-${count.index+1}",Tier="public"}) }
resource "aws_subnet" "app" { count=length(var.azs) vpc_id=aws_vpc.this.id availability_zone=var.azs[count.index] cidr_block=cidrsubnet(var.cidr,4,length(var.azs)+count.index) tags=merge(var.tags,{Name="${var.name}-app-${count.index+1}",Tier="private-app"}) }
resource "aws_subnet" "data" { count=length(var.azs) vpc_id=aws_vpc.this.id availability_zone=var.azs[count.index] cidr_block=cidrsubnet(var.cidr,4,(2*length(var.azs))+count.index) tags=merge(var.tags,{Name="${var.name}-data-${count.index+1}",Tier="private-data"}) }
resource "aws_eip" "nat" { count=length(var.azs) domain="vpc" depends_on=[aws_internet_gateway.this] tags=merge(var.tags,{Name="${var.name}-nat-eip-${count.index+1}"}) }
resource "aws_nat_gateway" "this" { count=length(var.azs) allocation_id=aws_eip.nat[count.index].id subnet_id=aws_subnet.public[count.index].id tags=merge(var.tags,{Name="${var.name}-nat-${count.index+1}"}) }
resource "aws_route_table" "public" { vpc_id=aws_vpc.this.id route { cidr_block="0.0.0.0/0" gateway_id=aws_internet_gateway.this.id } tags=merge(var.tags,{Name="${var.name}-public-rt"}) }
resource "aws_route_table_association" "public" { count=length(var.azs) subnet_id=aws_subnet.public[count.index].id route_table_id=aws_route_table.public.id }
resource "aws_route_table" "private" { count=length(var.azs) vpc_id=aws_vpc.this.id route { cidr_block="0.0.0.0/0" nat_gateway_id=aws_nat_gateway.this[count.index].id } tags=merge(var.tags,{Name="${var.name}-private-rt-${count.index+1}"}) }
resource "aws_route_table_association" "app" { count=length(var.azs) subnet_id=aws_subnet.app[count.index].id route_table_id=aws_route_table.private[count.index].id }
resource "aws_route_table_association" "data" { count=length(var.azs) subnet_id=aws_subnet.data[count.index].id route_table_id=aws_route_table.private[count.index].id }
output "vpc_id" { value=aws_vpc.this.id }
output "public_subnet_ids" { value=aws_subnet.public[*].id }
output "app_subnet_ids" { value=aws_subnet.app[*].id }
output "data_subnet_ids" { value=aws_subnet.data[*].id }
