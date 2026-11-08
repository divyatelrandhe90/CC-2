/* Cloudflare Worker: frontend host and JSON REST API. */
const INDEX_HTML = __INDEX_HTML__;
const APP_CSS = __APP_CSS__;
const APP_JS = __APP_JS__;
const TASK_PREFIX = "task:";

addEventListener("fetch", (event) => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return handleApi(request, url);
  if (request.method !== "GET" && request.method !== "HEAD") return response({ error: "Method not allowed" }, 405);
  if (url.pathname === "/style.css") return new Response(APP_CSS, { headers: { "content-type": "text/css; charset=UTF-8", ...securityHeaders() } });
  if (url.pathname === "/script.js") return new Response(APP_JS, { headers: { "content-type": "application/javascript; charset=UTF-8", ...securityHeaders() } });
  if (url.pathname === "/" || url.pathname === "/index.html") return new Response(INDEX_HTML, { headers: { "content-type": "text/html; charset=UTF-8", ...securityHeaders() } });
  return response({ error: "Not found" }, 404);
}

async function handleApi(request, url) {
  const parts = url.pathname.split("/").filter(Boolean);
  const id = parts[2];
  try {
    if (parts[1] !== "tasks") return response({ error: "Not found" }, 404);
    if (!id && request.method === "GET") return listTasks(url);
    if (!id && request.method === "POST") return createTask(request);
    if (id && request.method === "GET") return getTask(id);
    if (id && request.method === "PUT") return updateTask(id, request);
    if (id && request.method === "DELETE") return deleteTask(id);
    return response({ error: "Method not allowed" }, 405);
  } catch (error) {
    console.error("Task API error", error);
    if (error.status) return response({ error: error.message }, error.status);
    return response({ error: "An unexpected server error occurred" }, 500);
  }
}

async function listTasks(url) {
  const listed = await TASKS_KV.list({ prefix: TASK_PREFIX });
  const tasks = (await Promise.all(listed.keys.map((key) => TASKS_KV.get(key.name, "json")))).filter(Boolean);
  const sort = url.searchParams.get("sort") || "createdAt:desc";
  const [field, direction] = sort.split(":");
  tasks.sort((a, b) => {
    const left = a[field] || ""; const right = b[field] || "";
    return direction === "asc" ? String(left).localeCompare(String(right)) : String(right).localeCompare(String(left));
  });
  return response({ tasks, count: tasks.length });
}

async function getTask(id) {
  const task = await TASKS_KV.get(TASK_PREFIX + id, "json");
  return task ? response({ task }) : response({ error: "Task not found" }, 404);
}

async function createTask(request) {
  const payload = await body(request);
  const validated = validate(payload);
  if (validated.error) return response({ error: validated.error }, 400);
  const now = new Date().toISOString();
  const task = { id: crypto.randomUUID(), ...validated.value, createdAt: now, updatedAt: now };
  await TASKS_KV.put(TASK_PREFIX + task.id, JSON.stringify(task));
  return response({ task }, 201);
}

async function updateTask(id, request) {
  const existing = await TASKS_KV.get(TASK_PREFIX + id, "json");
  if (!existing) return response({ error: "Task not found" }, 404);
  const payload = await body(request);
  const validated = validate({ ...existing, ...payload });
  if (validated.error) return response({ error: validated.error }, 400);
  const task = { ...existing, ...validated.value, id, updatedAt: new Date().toISOString() };
  await TASKS_KV.put(TASK_PREFIX + id, JSON.stringify(task));
  return response({ task });
}

async function deleteTask(id) {
  const existing = await TASKS_KV.get(TASK_PREFIX + id, "json");
  if (!existing) return response({ error: "Task not found" }, 404);
  await TASKS_KV.delete(TASK_PREFIX + id);
  return new Response(null, { status: 204, headers: securityHeaders() });
}

async function body(request) {
  try { return await request.json(); } catch {
    const error = new Error("Invalid JSON request body");
    error.status = 400;
    throw error;
  }
}

function validate(input) {
  const title = String(input.title || "").trim();
  const priority = input.priority || "Medium";
  const status = input.status || "To Do";
  const category = String(input.category || "General").trim().slice(0, 50) || "General";
  const dueDate = input.dueDate || null;
  if (!title || title.length > 140) return { error: "Title is required and must be 140 characters or fewer." };
  if (!["Low", "Medium", "High"].includes(priority)) return { error: "Priority must be Low, Medium, or High." };
  if (!["To Do", "In Progress", "Completed"].includes(status)) return { error: "Invalid task status." };
  if (dueDate && Number.isNaN(Date.parse(dueDate))) return { error: "Due date is invalid." };
  return { value: { title, priority, status, category, dueDate } };
}

function response(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=UTF-8", ...securityHeaders() } });
}

function securityHeaders() {
  return { "x-content-type-options": "nosniff", "x-frame-options": "DENY", "referrer-policy": "strict-origin-when-cross-origin", "cache-control": "no-store" };
}
