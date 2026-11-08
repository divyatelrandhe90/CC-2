locals {
  worker_source = replace(
    replace(
      replace(
        file("${path.module}/../application/worker.js"),
        "__INDEX_HTML__",
        jsonencode(file("${path.module}/../application/index.html"))
      ),
      "__APP_CSS__",
      jsonencode(file("${path.module}/../application/style.css"))
    ),
    "__APP_JS__",
    jsonencode(file("${path.module}/../application/script.js"))
  )
}

resource "cloudflare_workers_kv_namespace" "tasks" {
  account_id = var.account_id
  title      = "${var.kv_namespace_name}-${var.environment}"
}

# The frontend source is injected at deployment time so one Worker serves both
# the browser application and its REST API. No Cloudflare resource is created
# outside Terraform.
resource "cloudflare_worker_script" "student_task_manager" {
  account_id = var.account_id
  name       = "${var.worker_name}-${var.environment}"
  content    = local.worker_source

  kv_namespace_binding {
    name         = "TASKS_KV"
    namespace_id = cloudflare_workers_kv_namespace.tasks.id
  }
}

