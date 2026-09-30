const STORAGE_KEY = "thiranex_tasks_v1";

let tasks = loadTasks();
let currentFilter = "all";

const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const taskCount = document.querySelector("#task-count");
const clearCompletedBtn = document.querySelector("#clear-completed");
const clearAllBtn = document.querySelector("#clear-all");
const filters = document.querySelector(".filters");

function loadTasks() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTask(text) {
    return {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        text: text.trim(),
        completed: false,
        createdAt: Date.now()
    };
}

function addTask(text) {
    const cleanText = text.trim();

    if (!cleanText) return;

    tasks.unshift(createTask(cleanText));
    saveTasks();
    render();
}

function updateTask(id, changes) {
    tasks = tasks.map(task =>
        task.id === id ? { ...task, ...changes } : task
    );
    saveTasks();
    render();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    render();
}

function clearCompleted() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    render();
}

function clearAll() {
    if (!tasks.length) return;

    const confirmed = window.confirm("Delete all tasks?");
    if (!confirmed) return;

    tasks = [];
    saveTasks();
    render();
}

function getFilteredTasks() {
    if (currentFilter === "active") {
        return tasks.filter(task => !task.completed);
    }

    if (currentFilter === "completed") {
        return tasks.filter(task => task.completed);
    }

    return tasks;
}

function render() {
    const visibleTasks = getFilteredTasks();

    taskList.innerHTML = "";

    visibleTasks.forEach(task => {
        const li = document.createElement("li");
        li.className = `task-item${task.completed ? " completed" : ""}`;
        li.dataset.id = task.id;

        li.innerHTML = `
            <input
                class="task-check"
                type="checkbox"
                data-action="toggle"
                ${task.completed ? "checked" : ""}
                aria-label="Mark task as ${task.completed ? "active" : "completed"}"
            >

            <span class="task-text">${escapeHTML(task.text)}</span>

            <div class="task-actions">
                <button
                    type="button"
                    class="icon-btn"
                    data-action="edit"
                    aria-label="Edit task"
                    title="Edit"
                >✏️</button>

                <button
                    type="button"
                    class="icon-btn delete-btn"
                    data-action="delete"
                    aria-label="Delete task"
                    title="Delete"
                >🗑️</button>
            </div>
        `;

        taskList.appendChild(li);
    });

    const activeCount = tasks.filter(task => !task.completed).length;
    taskCount.textContent = `${activeCount} ${activeCount === 1 ? "task" : "tasks"} left`;

    emptyState.hidden = visibleTasks.length !== 0;
}

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
}

function editTaskItem(li, task) {
    const textElement = li.querySelector(".task-text");
    const actions = li.querySelector(".task-actions");

    const input = document.createElement("input");
    input.className = "edit-input";
    input.type = "text";
    input.value = task.text;
    input.maxLength = 200;
    input.setAttribute("aria-label", "Edit task");

    textElement.replaceWith(input);

    actions.innerHTML = `
        <button type="button" class="icon-btn" data-action="save" aria-label="Save task" title="Save">💾</button>
        <button type="button" class="icon-btn" data-action="cancel" aria-label="Cancel editing" title="Cancel">✖️</button>
    `;

    input.focus();
    input.select();
}

function saveEditedTask(li) {
    const id = li.dataset.id;
    const input = li.querySelector(".edit-input");
    const newText = input.value.trim();

    if (newText) {
        updateTask(id, { text: newText });
    } else {
        deleteTask(id);
    }
}

taskForm.addEventListener("submit", event => {
    event.preventDefault();
    addTask(taskInput.value);
    taskInput.value = "";
    taskInput.focus();
});

filters.addEventListener("click", event => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;

    currentFilter = button.dataset.filter;

    document.querySelectorAll("[data-filter]").forEach(btn => {
        const active = btn === button;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", String(active));
    });

    render();
});

/*
    EVENT DELEGATION:
    One listener handles toggle, edit, save, cancel and delete
    actions for all dynamically-created task elements.
*/
taskList.addEventListener("click", event => {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;

    const li = actionButton.closest(".task-item");
    if (!li) return;

    const id = li.dataset.id;
    const task = tasks.find(item => item.id === id);
    if (!task) return;

    const action = actionButton.dataset.action;

    if (action === "edit") {
        editTaskItem(li, task);
    } else if (action === "save") {
        saveEditedTask(li);
    } else if (action === "cancel") {
        render();
    } else if (action === "delete") {
        deleteTask(id);
    }
});

taskList.addEventListener("change", event => {
    const checkbox = event.target.closest('[data-action="toggle"]');
    if (!checkbox) return;

    const li = checkbox.closest(".task-item");
    if (!li) return;

    updateTask(li.dataset.id, {
        completed: checkbox.checked
    });
});

taskList.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;

    const input = event.target.closest(".edit-input");
    if (!input) return;

    const li = input.closest(".task-item");
    if (li) saveEditedTask(li);
});

clearCompletedBtn.addEventListener("click", clearCompleted);
clearAllBtn.addEventListener("click", clearAll);

render();
