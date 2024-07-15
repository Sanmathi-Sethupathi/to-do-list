document.addEventListener('DOMContentLoaded', function() {
    const taskForm = document.querySelector('.task-details');
    const tasksTable = document.querySelector('.tasks-table');
    const tasksList = document.querySelector('.tasks-list');
    const taskNameInput = document.getElementById('task-name');
    const taskDescriptionInput = document.getElementById('task-description');
    const taskListSelect = document.getElementById('task-list');
    const taskDueDateInput = document.getElementById('due-date');
    const saveTaskButton = document.getElementById('save-task');
    const personalListButton = document.getElementById('personal-list');
    const workListButton = document.getElementById('work-list');
    const allListButton = document.getElementById('all-list');
    const calendarButton = document.getElementById('calendar');
    const addListButton = document.getElementById('add-list');
    const selectedListSpan = document.getElementById('selected-list');

    // Load lists from local storage
    loadLists();

    // Function to load lists from local storage
    function loadLists() {
        let lists = JSON.parse(localStorage.getItem('lists')) || [];
        lists.forEach(function(list) {
            const newListElement = createListElement(list);
            document.querySelector('.lists ul').appendChild(newListElement);
        });

        // Update task list select options
        updateTaskListSelect(lists);
    }

    // Function to create a list element
    function createListElement(list) {
        const newListElement = document.createElement('li');
        newListElement.id = list.id;
        newListElement.innerHTML = `<i class="fas fa-list"></i> ${list.name}`;

        // Add event listener for list click
        newListElement.addEventListener('click', function() {
            currentFilter = list.id;
            selectedDate = null; // Reset selected date filter
            displayTasks();
        });

        // Add delete button to list element
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteButton.classList.add('delete-list');
        deleteButton.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent list click when deleting
            deleteList(list.id);
        });
        newListElement.appendChild(deleteButton);

        return newListElement;
    }

    // Function to delete a list
    function deleteList(listId) {
        if (confirm('Are you sure you want to delete this list? This action cannot be undone.')) {
            let lists = JSON.parse(localStorage.getItem('lists')) || [];
            lists = lists.filter(list => list.id !== listId);
            localStorage.setItem('lists', JSON.stringify(lists));

            // Remove from UI
            const listElement = document.getElementById(listId);
            if (listElement) {
                listElement.remove();
            }

            // Update select list for tasks
            updateTaskListSelect(lists);

            // Display tasks for current filter
            if (currentFilter === listId) {
                currentFilter = 'all';
            }
            displayTasks();
        }
    }

    addListButton.addEventListener('click', function() {
        const newListName = prompt('Enter the name of the new list:');
        if (newListName) {
            const newListId = newListName.toLowerCase().replace(' ', '-'); // Generate a unique ID for the list
            const newListElement = createListElement({ id: newListId, name: newListName });
            document.querySelector('.lists ul').appendChild(newListElement);

            // Save to local storage
            let lists = JSON.parse(localStorage.getItem('lists')) || [];
            lists.push({ id: newListId, name: newListName });
            localStorage.setItem('lists', JSON.stringify(lists));

            // Update the select list for tasks
            updateTaskListSelect(lists);
        }
    });

    // Function to update the select list for tasks
    function updateTaskListSelect(lists) {
        const taskListSelect = document.getElementById('task-list');
        taskListSelect.innerHTML = ''; // Clear existing options

        // Add default options
        const personalOption = document.createElement('option');
        personalOption.value = 'personal';
        personalOption.textContent = 'Personal';
        taskListSelect.appendChild(personalOption);

        const workOption = document.createElement('option');
        workOption.value = 'work';
        workOption.textContent = 'Work';
        taskListSelect.appendChild(workOption);

        // Add options from local storage
        lists.forEach(list => {
            const option = document.createElement('option');
            option.value = list.id;
            option.textContent = list.name;
            taskListSelect.appendChild(option);
        });
    }

    // Call the updateTaskListSelect function initially to populate the select list
    updateTaskListSelect([]);

    let currentFilter = 'all';
    let selectedDate = null;

    // Function to set minimum date for date input
    function setMinDate() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months start at 0!
        const dd = String(today.getDate()).padStart(2, '0');
        const minDate = `${yyyy}-${mm}-${dd}`;
        taskDueDateInput.setAttribute('min', minDate);
    }

    // Function to save task
    function saveTask() {
        const taskName = taskNameInput.value.trim();
        if (!taskName) {
            alert('Task name cannot be empty.');
            return;
        }

        const taskDescription = taskDescriptionInput.value;
        const taskList = taskListSelect.value;
        const taskDueDate = taskDueDateInput.value;

        if (new Date(taskDueDate) <= new Date()) {
            alert('Due date must be after today.');
            return;
        }

        const task = {
            name: taskName,
            description: taskDescription,
            list: taskList,
            dueDate: taskDueDate,
            completed: false
        };

        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.push(task);
        localStorage.setItem('tasks', JSON.stringify(tasks));

        displayTasks();
        resetForm();
    }

    // Function to Display tasks
    function displayTasks() {
        tasksList.innerHTML = '';

        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks = tasks.filter(task => !task.completed);

        tasks.forEach((task, index) => {
            if ((currentFilter === 'all' || task.list === currentFilter) &&
                (selectedDate === null || task.dueDate === selectedDate)) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${task.name}</td>
                    <td>${task.description}</td>
                    <td>${task.list}</td>
                    <td>${task.dueDate}</td>
                    <td>
                        <button class="edit-task" data-index="${index}"><i class="fas fa-edit"></i></button>
                        <button class="delete-task" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
                        <button class="complete-task" data-index="${index}"><i class="fas fa-check"></i></button>
                    </td>
                `;
                tasksList.appendChild(row);

                row.querySelector('.edit-task').addEventListener('click', editTask);
                row.querySelector('.delete-task').addEventListener('click', deleteTask);
                row.querySelector('.complete-task').addEventListener('click', completeTask);
            }
        });

        // Set the selected list text in the header
        const selectedList = getCurrentListName(currentFilter);
        selectedListSpan.textContent = selectedList ? selectedList : currentFilter;
    }

    // Function to get the current list name
    function getCurrentListName(listId) {
        const lists = JSON.parse(localStorage.getItem('lists')) || [];
        const list = lists.find(list => list.id === listId);
        return list ? list.name : null;
    }

    // Function to edit task
    function editTask(event) {
        const index = event.target.closest('button').dataset.index;
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const task = tasks[index];

        taskNameInput.value = task.name;
        taskDescriptionInput.value = task.description;
        taskListSelect.value = task.list;
        taskDueDateInput.value = task.dueDate;

        saveTaskButton.setAttribute('data-index', index);
    }

    // Function to save edited task
    function saveEditedTask() {
        const index = saveTaskButton.getAttribute('data-index');
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

        tasks[index].name = taskNameInput.value.trim();
        if (!tasks[index].name) {
            alert('Task name cannot be empty.');
            return;
        }

        tasks[index].description = taskDescriptionInput.value;
        tasks[index].list = taskListSelect.value;
        tasks[index].dueDate = taskDueDateInput.value;

        if (new Date(tasks[index].dueDate) <= new Date()) {
            alert('Due date must be after today.');
            return;
        }

        localStorage.setItem('tasks', JSON.stringify(tasks));
        displayTasks();
        resetForm();
    }

    // Function to delete task
    function deleteTask(event) {
        const index = event.target.closest('button').dataset.index;
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

        if (confirm('Are you sure you want to delete this task?')) {
            tasks.splice(index, 1);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            displayTasks();
        }
    }

    // Function to mark task as complete
    function completeTask(event) {
        const index = event.target.closest('button').dataset.index;
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

        tasks[index].completed = !tasks[index].completed;

        localStorage.setItem('tasks', JSON.stringify(tasks));
        displayTasks();
    }

    // Event listener for Save changes button
    saveTaskButton.addEventListener('click', function(event) {
        event.preventDefault();
        if (saveTaskButton.getAttribute('data-index')) {
            saveEditedTask();
        } else {
            saveTask();
        }
    });

    // Event listeners for list buttons
    personalListButton.addEventListener('click', function() {
        currentFilter = 'personal';
        selectedDate = null; // Reset selected date filter
        displayTasks();
    });

    workListButton.addEventListener('click', function() {
        currentFilter = 'work';
        selectedDate = null; // Reset selected date filter
        displayTasks();
    });

    allListButton.addEventListener('click', function() {
        currentFilter = 'all';
        selectedDate = null; // Reset selected date filter
        displayTasks();
    });

    calendarButton.addEventListener('click', function() {
        const selectedCalendarDate = prompt('Enter a date (YYYY-MM-DD):');
        selectedDate = selectedCalendarDate;
        displayTasks();
    });

    setMinDate(); // Set minimum date on page load
    displayTasks(); // Display tasks on initial load
});
