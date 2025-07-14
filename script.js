        // TaskManager class handles all task CRUD operations and UI updates
        class TaskManager {
            constructor() {
                // Load tasks from localStorage or initialize empty array
                this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
                // Set currentId to next available id
                this.currentId = this.tasks.length > 0 ? Math.max(...this.tasks.map(t => t.id)) + 1 : 1;
                this.init();
            }

            // Initialize the app: cache DOM elements, set up events, render tasks, update stats
            init() {
                this.cacheElements();
                this.setupEventListeners();
                this.renderTasks();
                this.updateStats();
            }

            // Cache frequently used DOM elements for performance
            cacheElements() {
                this.taskForm = document.getElementById('task-form');
                this.taskIdInput = document.getElementById('task-id');
                this.submitBtn = document.getElementById('submit-btn');
                this.cancelBtn = document.getElementById('cancel-btn');

                // Containers for each task status column
                this.taskContainers = {
                    'todo': document.getElementById('todo-tasks-container'),
                    'in-progress': document.getElementById('in-progress-tasks-container'),
                    'review': document.getElementById('review-tasks-container'),
                    'done': document.getElementById('done-tasks-container')
                };

                // Modal elements for editing tasks
                this.editModal = document.getElementById('edit-modal');
                this.editForm = document.getElementById('edit-form');
                this.closeModal = document.getElementById('close-modal');
            }

            // Set up all event listeners for forms, buttons, drag-and-drop, and modals
            setupEventListeners() {
                // Handle main task form submission
                this.taskForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.addTaskFromForm();
                });

                // Handle cancel button in the form
                this.cancelBtn.addEventListener('click', () => {
                    this.resetForm();
                });

                // Set up drag and drop for each status column
                Object.keys(this.taskContainers).forEach(status => {
                    const container = this.taskContainers[status];

                    container.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        container.classList.add('drag-over');
                    });

                    container.addEventListener('dragleave', () => {
                        container.classList.remove('drag-over');
                    });

                    container.addEventListener('drop', (e) => {
                        e.preventDefault();
                        container.classList.remove('drag-over');
                        const taskId = parseInt(e.dataTransfer.getData('text/plain'));
                        this.updateTaskStatus(taskId, status);
                    });
                });

                // Handle edit modal form submission
                this.editForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.updateTaskFromForm();
                });

                // Handle close modal button
                this.closeModal.addEventListener('click', () => {
                    this.editModal.style.display = 'none';
                });

                // Close modal when clicking outside the modal content
                window.addEventListener('click', (e) => {
                    if (e.target === this.editModal) {
                        this.editModal.style.display = 'none';
                    }
                });
            }

            // Add or update a task from the main form
            addTaskFromForm() {
                const title = document.getElementById('title').value.trim();
                const description = document.getElementById('description').value;
                const category = document.getElementById('category').value;
                const priority = document.getElementById('priority').value;

                // Validate title
                if (!title) {
                    this.showNotification('Task title cannot be empty!', 'error');
                    return;
                }

                // If editing, update the task; otherwise, add new
                if (this.taskIdInput.value) {
                    this.updateTaskFromForm();
                } else {
                    this.addTask(title, description, category, priority, 'todo');
                    this.taskForm.reset();
                    this.showNotification('Task added successfully!', 'success');
                }
            }

            // Update a task from the main form (edit mode)
            updateTaskFromForm() {
                const taskId = parseInt(this.taskIdInput.value);
                const title = document.getElementById('title').value.trim();
                const description = document.getElementById('description').value;
                const category = document.getElementById('category').value;
                const priority = document.getElementById('priority').value;

                // Validate title
                if (!title) {
                    this.showNotification('Task title cannot be empty!', 'error');
                    return;
                }

                // Find and update the task
                const task = this.tasks.find(t => t.id === taskId);
                if (task) {
                    task.title = title;
                    task.description = description;
                    task.category = category;
                    task.priority = priority;

                    this.saveTasks();
                    this.renderTasks();
                    this.updateStats();
                    this.resetForm();
                    this.showNotification('Task updated successfully!', 'success');
                }
            }

            // Add a new task to the list
            addTask(title, description, category, priority, status = 'todo') {
                const task = {
                    id: this.currentId++,
                    title,
                    description,
                    category,
                    priority,
                    status,
                    createdAt: new Date().toISOString()
                };

                this.tasks.push(task);
                this.saveTasks();
                this.renderTasks();
                this.updateStats();

                return task;
            }

            // Change the status of a task (e.g., via drag-and-drop)
            updateTaskStatus(taskId, newStatus) {
                const task = this.tasks.find(t => t.id === taskId);
                if (task) {
                    task.status = newStatus;
                    this.saveTasks();
                    this.renderTasks();
                    this.updateStats();
                    this.showNotification(`Task moved to ${this.getStatusName(newStatus)}!`, 'info');
                }
            }

            // Delete a task by id, with confirmation
            deleteTask(taskId) {
                if (confirm("Are you sure you want to delete this task?")) {
                    this.tasks = this.tasks.filter(task => task.id !== taskId);
                    this.saveTasks();
                    this.renderTasks();
                    this.updateStats();
                    this.showNotification('Task deleted successfully!', 'info');
                }
            }

            // Open the edit modal and populate it with task data
            editTask(taskId) {
                const task = this.tasks.find(t => t.id === taskId);
                if (task) {
                    document.getElementById('edit-task-id').value = task.id;
                    document.getElementById('edit-title').value = task.title;
                    document.getElementById('edit-description').value = task.description || '';
                    document.getElementById('edit-category').value = task.category;
                    document.getElementById('edit-priority').value = task.priority;
                    document.getElementById('edit-status').value = task.status;
                    this.editModal.style.display = 'flex';
                }
            }

            // Update a task from the edit modal form
            updateTaskFromModal() {
                const taskId = parseInt(document.getElementById('edit-task-id').value);
                const title = document.getElementById('edit-title').value.trim();
                const description = document.getElementById('edit-description').value;
                const category = document.getElementById('edit-category').value;
                const priority = document.getElementById('edit-priority').value;
                const status = document.getElementById('edit-status').value;

                // Validate title
                if (!title) {
                    this.showNotification('Task title cannot be empty!', 'error');
                    return;
                }

                // Find and update the task
                const task = this.tasks.find(t => t.id === taskId);
                if (task) {
                    task.title = title;
                    task.description = description;
                    task.category = category;
                    task.priority = priority;
                    task.status = status;

                    this.saveTasks();
                    this.renderTasks();
                    this.updateStats();
                    this.editModal.style.display = 'none';
                    this.showNotification('Task updated successfully!', 'success');
                }
            }

            // Save tasks to localStorage
            saveTasks() {
                localStorage.setItem('tasks', JSON.stringify(this.tasks));
            }

            // Reset the main form to its default state
            resetForm() {
                this.taskForm.reset();
                this.taskIdInput.value = '';
                this.cancelBtn.style.display = 'none';
                this.submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';
            }

            // Render all tasks into their respective columns
            renderTasks() {
                // Clear all columns
                Object.values(this.taskContainers).forEach(container => {
                    container.innerHTML = '';
                });

                // Show empty state if no tasks
                if (this.tasks.length === 0) {
                    this.taskContainers.todo.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <p>No tasks here yet</p>
                        </div>
                    `;
                    return;
                }

                // Sort tasks by creation date (newest first)
                const sortedTasks = [...this.tasks].sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                );

                // Group tasks by status
                const tasksByStatus = {
                    'todo': [],
                    'in-progress': [],
                    'review': [],
                    'done': []
                };

                sortedTasks.forEach(task => {
                    tasksByStatus[task.status].push(task);
                });

                // Render tasks for each status column
                Object.keys(tasksByStatus).forEach(status => {
                    const container = this.taskContainers[status];
                    const tasks = tasksByStatus[status];

                    // Update column task count
                    const columnHeader = container.closest('.column').querySelector('.task-count');
                    columnHeader.textContent = tasks.length;

                    if (tasks.length === 0) {
                        container.innerHTML = `
                            <div class="empty-state">
                                <i class="fas ${this.getEmptyStateIcon(status)}"></i>
                                <p>${this.getEmptyStateText(status)}</p>
                            </div>
                        `;
                    } else {
                        tasks.forEach(task => {
                            container.appendChild(this.createTaskElement(task));
                        });
                    }
                });
            }

            // Create a DOM element for a single task card
            createTaskElement(task) {
                const taskElement = document.createElement('div');
                taskElement.className = `task task-${task.priority}`;
                taskElement.draggable = true;
                taskElement.dataset.id = task.id;

                // Format creation date
                const date = new Date(task.createdAt);
                const formattedDate = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });

                // Drag event handlers for moving tasks between columns
                taskElement.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', task.id);
                    setTimeout(() => {
                        taskElement.classList.add('dragging');
                    }, 0);
                });

                taskElement.addEventListener('dragend', () => {
                    taskElement.classList.remove('dragging');
                });

                // Task card HTML structure
                taskElement.innerHTML = `
                    <div class="task-header">
                        <h4 class="task-title">${task.title}</h4>
                        <span class="task-category">${task.category}</span>
                    </div>
                    <p class="task-description">${task.description || 'No description provided'}</p>
                    <div class="task-date">
                        <i class="far fa-calendar"></i> ${formattedDate}
                    </div>
                    <div class="task-footer">
                        <span class="task-priority priority-${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                        <div class="task-actions">
                            <button class="edit-btn" data-id="${task.id}" title="Edit task">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-btn" data-id="${task.id}" title="Delete task">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `;

                // Delete button event
                const deleteBtn = taskElement.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', () => {
                    this.deleteTask(task.id);
                });

                // Edit button event
                const editBtn = taskElement.querySelector('.edit-btn');
                editBtn.addEventListener('click', () => {
                    this.editTask(task.id);
                });

                // Clicking the title also opens edit modal
                const titleElement = taskElement.querySelector('.task-title');
                titleElement.addEventListener('click', () => {
                    this.editTask(task.id);
                });

                return taskElement;
            }

            // Update dashboard stats (total, per status)
            updateStats() {
                document.getElementById('total-tasks').textContent = this.tasks.length;
                document.getElementById('todo-tasks').textContent = this.tasks.filter(t => t.status === 'todo').length;
                document.getElementById('inprogress-tasks').textContent = this.tasks.filter(t => t.status === 'in-progress').length;
                document.getElementById('review-tasks').textContent = this.tasks.filter(t => t.status === 'review').length;
                document.getElementById('done-tasks').textContent = this.tasks.filter(t => t.status === 'done').length;
            }

            // Get icon class for empty state by status
            getEmptyStateIcon(status) {
                const icons = {
                    'todo': 'fa-inbox',
                    'in-progress': 'fa-cogs',
                    'review': 'fa-eye',
                    'done': 'fa-trophy'
                };
                return icons[status] || 'fa-inbox';
            }

            // Get empty state text by status
            getEmptyStateText(status) {
                const texts = {
                    'todo': 'No tasks here yet',
                    'in-progress': 'No tasks in progress',
                    'review': 'No tasks to review',
                    'done': 'No tasks completed yet'
                };
                return texts[status] || 'No tasks';
            }

            // Get display name for a status
            getStatusName(status) {
                const names = {
                    'todo': 'To Do',
                    'in-progress': 'In Progress',
                    'review': 'Review',
                    'done': 'Done'
                };
                return names[status] || status;
            }

            // Show a notification message (info, success, error)
            showNotification(message, type = 'info') {
                // Remove existing notifications
                const existing = document.querySelector('.notification');
                if (existing) existing.remove();

                // Create notification element
                const notification = document.createElement('div');
                notification.className = `notification ${type}`;
                notification.innerHTML = `
                    <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
                    ${message}
                `;

                document.body.appendChild(notification);

                // Auto remove after 3 seconds
                setTimeout(() => {
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                }, 3000);
            }
        }

        // Initialize the TaskManager when the DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            const taskManager = new TaskManager();

            // Handle edit modal form submission
            document.getElementById('edit-form').addEventListener('submit', (e) => {
                e.preventDefault();
                taskManager.updateTaskFromModal();
            });
        });