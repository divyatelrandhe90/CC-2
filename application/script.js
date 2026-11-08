const state = { tasks: [], filtered: [] };
const $ = (selector) => document.querySelector(selector);
const list = $("#taskList"), empty = $("#emptyState"), modal = $("#taskModal"), form = $("#taskForm");

document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  $("#addTaskButton").addEventListener("click", () => openModal());
  $("#emptyAddButton").addEventListener("click", () => openModal());
  $("#closeModal").addEventListener("click", closeModal); $("#cancelModal").addEventListener("click", closeModal);
  form.addEventListener("submit", saveTask);
  ["#searchInput", "#priorityFilter", "#statusFilter", "#sortSelect"].forEach((id) => $(id).addEventListener("input", render));
});

async function api(path = "", options = {}) {
  const response = await fetch(`/api/tasks${path}`, { headers: { "content-type": "application/json" }, ...options });
  if (response.status === 204) return null;
  const data = await response.json(); if (!response.ok) throw new Error(data.error || "Request failed"); return data;
}
async function loadTasks() { try { state.tasks = (await api()).tasks; render(); } catch (error) { toast(error.message, true); $("#taskSummary").textContent = "Could not load tasks"; } }
function render() {
  const query = $("#searchInput").value.toLowerCase().trim(), priority = $("#priorityFilter").value, status = $("#statusFilter").value;
  const [sortKey, sortDirection] = $("#sortSelect").value.split(":");
  state.filtered = state.tasks.filter((task) => (!query || `${task.title} ${task.category}`.toLowerCase().includes(query)) && (!priority || task.priority === priority) && (!status || task.status === status)).sort((a,b) => { const x = a[sortKey] || "9999-12-31", y = b[sortKey] || "9999-12-31"; return sortDirection === "asc" ? String(x).localeCompare(String(y)) : String(y).localeCompare(String(x)); });
  list.replaceChildren(...state.filtered.map(taskElement)); empty.hidden = state.filtered.length > 0; $("#taskSummary").textContent = `${state.filtered.length} of ${state.tasks.length} task${state.tasks.length === 1 ? "" : "s"} shown`;
  updateStats();
}
function taskElement(task) {
  const node = $("#taskTemplate").content.firstElementChild.cloneNode(true), done = task.status === "Completed";
  node.classList.toggle("is-done", done); node.querySelector("h3").textContent = task.title;
  const priority = node.querySelector(".priority-badge"); priority.textContent = task.priority; priority.classList.add(task.priority.toLowerCase());
  node.querySelector(".status-badge").textContent = task.status; node.querySelector(".status-badge").classList.add(task.status.toLowerCase().replaceAll(" ", "-"));
  node.querySelector(".category").textContent = `▣ ${task.category}`; node.querySelector(".due-date").textContent = task.dueDate ? `◷ Due ${formatDate(task.dueDate)}` : "No due date"; node.querySelector(".created-date").textContent = `Created ${formatDate(task.createdAt)}`;
  node.querySelector(".complete-button").textContent = done ? "✓" : ""; node.querySelector(".complete-button").addEventListener("click", () => toggleComplete(task)); node.querySelector(".edit-button").addEventListener("click", () => openModal(task)); node.querySelector(".delete-button").addEventListener("click", () => removeTask(task)); return node;
}
function updateStats() { const total = state.tasks.length, completed = state.tasks.filter(t=>t.status==="Completed").length; $("#totalCount").textContent=total; $("#progressCount").textContent=state.tasks.filter(t=>t.status==="In Progress").length; $("#completedCount").textContent=completed; $("#highCount").textContent=state.tasks.filter(t=>t.priority==="High").length; const percent=total?Math.round(completed/total*100):0; $("#completionPercent").textContent=`${percent}%`; $("#completionRing").style.setProperty("--progress", `${percent * 3.6}deg`); }
function openModal(task) { form.reset(); $("#taskId").value=task?.id||""; $("#modalTitle").textContent=task?"Edit task":"Create a task"; if(task) ["title","priority","status","category","dueDate"].forEach(k=>$("#"+k).value=task[k]||""); modal.showModal(); $("#title").focus(); }
function closeModal() { modal.close(); }
async function saveTask(event) { event.preventDefault(); const id=$("#taskId").value, button=$("#saveButton"); const payload=Object.fromEntries(new FormData(form)); button.disabled=true; button.textContent="Saving…"; try { const result=await api(id?`/${id}`:"", {method:id?"PUT":"POST",body:JSON.stringify(payload)}); state.tasks=id?state.tasks.map(t=>t.id===id?result.task:t):[result.task,...state.tasks]; closeModal(); render(); toast(id?"Task updated":"Task created"); } catch(error) { toast(error.message,true); } finally { button.disabled=false; button.textContent="Save task"; } }
async function toggleComplete(task) { try { const status=task.status==="Completed"?"To Do":"Completed", result=await api(`/${task.id}`,{method:"PUT",body:JSON.stringify({...task,status})}); state.tasks=state.tasks.map(t=>t.id===task.id?result.task:t); render(); toast(status==="Completed"?"Task completed":"Task reopened"); } catch(error) { toast(error.message,true); } }
async function removeTask(task) { if(!confirm(`Delete “${task.title}”? This cannot be undone.`)) return; try { await api(`/${task.id}`,{method:"DELETE"}); state.tasks=state.tasks.filter(t=>t.id!==task.id); render(); toast("Task deleted"); } catch(error) { toast(error.message,true); } }
function formatDate(value) { return new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric",year:"numeric"}).format(new Date(value)); }
let toastTimer; function toast(message, error=false) { const el=$("#toast"); el.textContent=message; el.className=`toast show ${error?"error":""}`; clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.className="toast",3200); }

