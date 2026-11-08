# Setup and deployment guide

Follow these steps in order. Commands below use PowerShell and are run from the project root unless stated otherwise.

## 1. Install Terraform

Install Terraform version 1.5 or later from [developer.hashicorp.com/terraform/install](https://developer.hashicorp.com/terraform/install). Confirm it is available:

```powershell
terraform -version
```

## 2. Install Git

Install Git from [git-scm.com](https://git-scm.com/downloads), then verify it:

```powershell
git --version
```

## 3. Create a Cloudflare account

Sign up at [dash.cloudflare.com](https://dash.cloudflare.com). In the Cloudflare dashboard, copy the Account ID. If needed, activate a `workers.dev` subdomain so the deployed Worker can be opened in a browser.

## 4. Create an API token

Go to **My Profile → API Tokens → Create Token → Create Custom Token**. Scope it to the target account and give it these permissions:

- Account / Workers Scripts / Edit
- Account / Workers KV Storage / Edit

Copy the token once. Treat it like a password and never commit it.

## 5. Configure environment variables

Set the API token for the current PowerShell session and make a local variables file:

```powershell
$env:CLOUDFLARE_API_TOKEN = "paste-your-token-here"
Copy-Item terraform/terraform.tfvars.example terraform/terraform.tfvars
```

Edit `terraform/terraform.tfvars` and replace `your_cloudflare_account_id`. This file is ignored by Git.

## 6. Run terraform init

```powershell
cd terraform
terraform init
```

This downloads the locked Cloudflare Terraform provider.

## 7. Run terraform fmt

```powershell
terraform fmt
```

This standardizes Terraform formatting.

## 8. Run terraform validate

```powershell
terraform validate
```

Correct any configuration errors before deployment.

## 9. Run terraform plan

```powershell
terraform plan
```

Review the plan. It should create a Workers KV namespace and Worker script with the `TASKS_KV` binding.

## 10. Run terraform apply

```powershell
terraform apply
```

Type `yes` when prompted. Terraform deploys the frontend, API Worker and persistent KV storage. Open the workers.dev URL using the name from the Terraform output and your Cloudflare workers.dev subdomain.

## 11. Test CRUD

Use the web UI to create a task, edit it, mark it complete and delete it. You can also test the API:

```powershell
$base = "https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev"
Invoke-RestMethod -Method Post -Uri "$base/api/tasks" -ContentType "application/json" -Body '{"title":"Test KV task","priority":"High","status":"To Do","category":"Lab","dueDate":"2026-10-01"}'
Invoke-RestMethod -Uri "$base/api/tasks"
```

Verify that a task remains after refreshing the page; that confirms Workers KV persistence.

## 12. Modify infrastructure

Make a deliberate Terraform change, such as changing `environment` in `terraform.tfvars`. Then run:

```powershell
terraform plan
terraform apply
```

Terraform will show exactly what will change before applying it.

## 13. Run terraform destroy

When demonstrating cleanup, remove the managed resources:

```powershell
terraform destroy
```

Type `yes` only after confirming the namespace and Worker are the intended resources. This deletes all persisted task data in that namespace.

## 14. Run terraform apply again

Recreate the infrastructure from the same version-controlled configuration:

```powershell
terraform apply
```

The Worker and a new empty KV namespace are provisioned again entirely through Terraform.

