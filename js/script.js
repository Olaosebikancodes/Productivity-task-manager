        class TaskManager {
            constructor() {
                this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
                this.currentId = this.tasks.length > 0 ? Math.max(...this.tasks.map(t => t.id)) + 1 : 1;
                
                // Initialize
                this.init();
            }
            
            init() {
                this.cacheElements();
                this.setupEventListeners();
                this.renderTasks();
                this.updateStats();
            }
            
            cacheElements() {
                this.taskForm = document.getElementById('task-form');
                this.taskContainers = {
                    'todo': document.getElementById('todo-tasks-container'),
                    'in-progress': document.getElementById('in-progress-tasks-container'),
                    'review': document.getElementById('review-tasks-container'),
                    'done': document.getElementById('done-tasks-container')
                };
            }
            
            setupEventListeners() {
                // Form submission
                this.taskForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.addTaskFromForm();
                });
                
                // Setup drag and drop for columns
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
            }
            
            addTaskFromForm() {
                const title = document.getElementById('title').value;
                const description = document.getElementById('description').value;
                const category = document.getElementById('category').value;
                const priority = document.getElementById('priority').value;
                
                this.addTask(title, description, category, priority, 'todo');
                
                // Reset form
                this.taskForm.reset();
            }
            
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
            
            updateTaskStatus(taskId, newStatus) {
                const task = this.tasks.find(t => t.id === taskId);
                if (task) {
                    task.status = newStatus;
                    this.saveTasks();
                    this.renderTasks();
                    this.updateStats();
                }
            }
            
            deleteTask(taskId) {
                this.tasks = this.tasks.filter(task => task.id !== taskId);
                this.saveTasks();
                this.renderTasks();
                this.updateStats();
            }
            
            saveTasks() {
                localStorage.setItem('tasks', JSON.stringify(this.tasks));
            }
            
            renderTasks() {
                // Clear all containers first
                Object.values(this.taskContainers).forEach(container => {
                    container.innerHTML = '';
                });
                
                if (this.tasks.length === 0) {
                    this.taskContainers.todo.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <p>No tasks here yet</p>
                        </div>
                    `;
                    return;
                }
                
                // Group tasks by status
                const tasksByStatus = {
                    'todo': [],
                    'in-progress': [],
                    'review': [],
                    'done': []
                };
                
                this.tasks.forEach(task => {
                    tasksByStatus[task.status].push(task);
                });
                
                // Render tasks for each status
                Object.keys(tasksByStatus).forEach(status => {
                    const container = this.taskContainers[status];
                    const tasks = tasksByStatus[status];
                    
                    // Update task count
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
            
            createTaskElement(task) {
                const taskElement = document.createElement('div');
                taskElement.className = `task task-${task.priority}`;
                taskElement.draggable = true;
                taskElement.dataset.id = task.id;
                
                // Drag event handlers
                taskElement.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', task.id);
                    setTimeout(() => {
                        taskElement.classList.add('dragging');
                    }, 0);
                });
                
                taskElement.addEventListener('dragend', () => {
                    taskElement.classList.remove('dragging');
                });
                
                taskElement.innerHTML = `
                    <div class="task-header">
                        <h4 class="task-title">${task.title}</h4>
                        <span class="task-category">${task.category}</span>
                    </div>
                    <p class="task-description">${task.description || 'No description provided'}</p>
                    <div class="task-footer">
                        <span class="task-priority priority-${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                        <div class="task-actions">
                            <button class="delete-btn" data-id="${task.id}" title="Delete task">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `;
                
                // Add delete event listener
                const deleteBtn = taskElement.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', () => {
                    this.deleteTask(task.id);
                });
                
                return taskElement;
            }
            
            updateStats() {
                document.getElementById('total-tasks').textContent = this.tasks.length;
                document.getElementById('todo-tasks').textContent = this.tasks.filter(t => t.status === 'todo').length;
                document.getElementById('inprogress-tasks').textContent = this.tasks.filter(t => t.status === 'in-progress').length;
                document.getElementById('review-tasks').textContent = this.tasks.filter(t => t.status === 'review').length;
                document.getElementById('done-tasks').textContent = this.tasks.filter(t => t.status === 'done').length;
            }
            
            getEmptyStateIcon(status) {
                const icons = {
                    'todo': 'fa-inbox',
                    'in-progress': 'fa-cogs',
                    'review': 'fa-eye',
                    'done': 'fa-trophy'
                };
                return icons[status] || 'fa-inbox';
            }
            
            getEmptyStateText(status) {
                const texts = {
                    'todo': 'No tasks here yet',
                    'in-progress': 'No tasks in progress',
                    'review': 'No tasks to review',
                    'done': 'No tasks completed yet'
                };
                return texts[status] || 'No tasks';
            }
        }

        // Initialize the task manager when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            const taskManager = new TaskManager();
        });