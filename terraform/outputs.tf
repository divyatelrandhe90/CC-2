output "worker_name" {
  description = "Name of the deployed Worker script."
  value       = cloudflare_worker_script.student_task_manager.name
}

output "kv_namespace_id" {
  description = "ID of the provisioned Workers KV namespace."
  value       = cloudflare_workers_kv_namespace.tasks.id
}

output "worker_url" {
  description = "Default workers.dev URL after enabling a workers.dev subdomain for the account."
  value       = "https://${cloudflare_worker_script.student_task_manager.name}.YOUR_SUBDOMAIN.workers.dev"
}

