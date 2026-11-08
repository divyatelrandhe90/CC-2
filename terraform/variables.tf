variable "cloudflare_api_token" {
  description = "Cloudflare API token with Workers Scripts and Workers KV Storage edit permissions. Prefer CLOUDFLARE_API_TOKEN environment variable."
  type        = string
  sensitive   = true
  default     = null
}

variable "account_id" {
  description = "Cloudflare account ID where the Worker and KV namespace will be created."
  type        = string
}

variable "worker_name" {
  description = "Unique name for the Cloudflare Worker."
  type        = string
  default     = "student-task-manager"
}

variable "kv_namespace_name" {
  description = "Title for the Workers KV namespace used to persist tasks."
  type        = string
  default     = "student-task-manager-tasks"
}

variable "environment" {
  description = "Deployment environment label, for example development, staging, or production."
  type        = string
  default     = "development"
}

