# Terraform infrastructure

This directory is the single source of truth for Cloudflare infrastructure. It creates one Workers KV namespace and one Worker script with the `TASKS_KV` binding.

## Prerequisites

- Terraform 1.5 or later
- A Cloudflare account ID
- An API token with **Account > Workers Scripts: Edit** and **Account > Workers KV Storage: Edit** permissions

## Deploy

```powershell
$env:CLOUDFLARE_API_TOKEN = "your-token"
Copy-Item terraform.tfvars.example terraform.tfvars
terraform init
terraform fmt
terraform validate
terraform plan
terraform apply
```

The `main.tf` configuration injects the versioned frontend files into `worker.js` at apply time. Keep the source files in `../application`; do not edit generated content in Cloudflare's dashboard.

