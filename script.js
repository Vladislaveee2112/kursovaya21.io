const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('tasks');
const filterStatusSelect = document.getElementById('filter-status');
const filterCategorySelect = document.getElementById('filter-category');
const filterPrioritySelect = document.getElementById('filter-priority'); // Добавлен фильтр по приоритету
const filterDateSelect = document.getElementById('filter-date');

// Функция для получения данных из LocalStorage
function getTasksFromLocalStorage() {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  return tasks;
}

// Функция для сохранения данных в LocalStorage
function saveTasksToLocalStorage(tasks) {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Загружаем задачи из LocalStorage при загрузке страницы
let tasks = getTasksFromLocalStorage();
renderTasks();

// Функция для добавления задания
function addTask(event) {
  event.preventDefault();

  const taskName = document.getElementById('task-name').value;
  const taskDescription = document.getElementById('task-description').value;
  const taskDeadline = document.getElementById('task-deadline').value;
  const taskPriority = document.getElementById('task-priority').value;
  const taskCategory = document.getElementById('task-category').value; // Получаем категорию
  const taskFile = document.getElementById('task-file').files[0]; // Получаем файл

  const newTask = {
    id: Date.now(), // Используем уникальный идентификатор
    name: taskName,
    description: taskDescription,
    deadline: taskDeadline,
    priority: taskPriority,
    completed: false,
    category: taskCategory, // Добавляем категорию
    file: taskFile ? taskFile.name : null, // Сохраняем имя файла
  };

  tasks.push(newTask);
  saveTasksToLocalStorage(tasks);
  renderTasks();

  // Очищаем форму
  taskForm.reset();
  initCalendar();
}

// Функция для рендеринга заданий в список
function renderTasks() {
  taskList.innerHTML = ''; // Очищаем список
  tasks = getTasksFromLocalStorage(); // Обновляем задачи из LocalStorage

  // Фильтруем задачи перед отображением
  const filteredTasks = tasks
    .filter(task => filterTasksByStatus(filterStatusSelect.value, task)) // Фильтр по статусу
    .filter(task => filterTasksByCategory(filterCategorySelect.value, task)) // Фильтр по категории
    .filter(task => filterTasksByPriority(filterPrioritySelect.value, task)) // Фильтр по приоритету
    .filter(task => filterTasksByDate(filterDateSelect.value, task)); // Фильтр по дате

  filteredTasks.forEach(task => {
    const newTaskElement = document.createElement('li');
    newTaskElement.setAttribute('data-task-id', task.id); // Добавляем ID для идентификации

    // Определяем стиль приоритета
    let priorityClass = '';
    if (task.priority === 'высокий') {
      priorityClass = 'high-priority';
    } else if (task.priority === 'средний') {
      priorityClass = 'medium-priority';
    }

    // Добавляем кнопку "Завершить"
    newTaskElement.innerHTML = `
      <div>
        <h3 class="${priorityClass}">${task.name}</h3>
        <p>${task.description}</p>
        <p>Срок сдачи: ${task.deadline}</p>
        ${task.file ? `<p>Файл: <a href="${task.file}" download>${task.file}</a></p>` : ''}  
      </div>
      <div class="task-timer">
        <span class="timer-value"></span>
        <span class="timer-label">до</span>
      </div>
      <div>
        <button class="complete ${task.completed ? 'completed' : ''}">Завершить</button>
        <button class="delete">Удалить</button>
      </div>
    `;

    // Добавляем к элементу задания категорию:
    const categorySpan = document.createElement('span');
    categorySpan.classList.add('task-category');
    categorySpan.textContent = `(${task.category})`; 
    newTaskElement.querySelector('div').appendChild(categorySpan);

    // Обработчик для "Завершить"
    newTaskElement.querySelector('.complete').addEventListener('click', () => {
      toggleTaskCompletion(task.id);
      renderTasks();
    });

    // Обработчик для "Удалить"
    newTaskElement.querySelector('.delete').addEventListener('click', () => {
      deleteTask(task.id);
      renderTasks();
    });

    // Добавляем элемент в список
    taskList.appendChild(newTaskElement);

    // Запускаем таймер
    startTimer(newTaskElement, task.deadline);
  });

  // Обновляем список категорий для фильтрации
  updateCategoryFilterOptions();
}

// Функция для переключения статуса завершения задания
function toggleTaskCompletion(taskId) {
  tasks.forEach(task => {
    if (task.id === taskId) {
      task.completed = !task.completed;
    }
  });
  saveTasksToLocalStorage(tasks);
}

// Функция для удаления задания
function deleteTask(taskId) {
  tasks = tasks.filter(task => task.id !== taskId);
  saveTasksToLocalStorage(tasks);
}

// Функция для фильтрации заданий по статусу
function filterTasksByStatus(status, task) {
  if (status === 'all') {
    return true;
  } else if (status === 'completed' && task.completed) {
    return true;
  } else if (status === 'pending' && !task.completed) {
    return true;
  }
  return false;
}

// Функция для фильтрации заданий по категории
function filterTasksByCategory(category, task) {
  if (category === 'all') {
    return true;
  } else if (task.category === category) {
    return true;
  }
  return false;
}

// Функция для фильтрации заданий по приоритету
function filterTasksByPriority(priority, task) {
  if (priority === 'all') {
    return true;
  } else if (task.priority === priority) {
    return true;
  }
  return false;
}

// Функция для фильтрации заданий по дате
function filterTasksByDate(dateFilter, task) {
  if (dateFilter === 'all') {
    return true;
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  const nextWeekStart = new Date(today);
  nextWeekStart.setDate(today.getDate() - today.getDay() + 7);

  const taskDeadline = new Date(task.deadline);

  if (dateFilter === 'today' && taskDeadline.getDate() === today.getDate()) {
    return true;
  } else if (dateFilter === 'tomorrow' && taskDeadline.getDate() === tomorrow.getDate()) {
    return true;
  } else if (dateFilter === 'this-week' && taskDeadline >= thisWeekStart && taskDeadline < nextWeekStart) {
    return true;
  } else if (dateFilter === 'next-week' && taskDeadline >= nextWeekStart) {
    return true;
  }

  return false;
}

// Функция для обновления списка категорий в фильтре
function updateCategoryFilterOptions() {
  const uniqueCategories = new Set(tasks.map(task => task.category));
  filterCategorySelect.innerHTML = '<option value="all" selected>Все</option>';
  uniqueCategories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.text = category;
    filterCategorySelect.appendChild(option);
  });
}

// Функция для запуска таймера
function startTimer(taskElement, deadline) {
  const timerElement = taskElement.querySelector('.timer-value');
  const deadlineDate = new Date(deadline);
  const taskId = taskElement.getAttribute('data-task-id'); // Получаем ID задания

  // Проверяем, завершена ли задача до начала отсчета
  if (tasks.find(task => task.id === parseInt(taskId) && task.completed)) {
    timerElement.textContent = 'Задание выполнено!';
    return; // Прекращаем выполнение функции
  }

  let timerInterval = setInterval(() => {
    // Проверяем, завершена ли задача в процессе отсчета
    if (tasks.find(task => task.id === parseInt(taskId) && task.completed)) {
      clearInterval(timerInterval);
      timerElement.textContent = 'Задание выполнено!';
      return;
    }

    const now = new Date();
    const timeLeft = deadlineDate - now;

    if (timeLeft < 0) {
      clearInterval(timerInterval);
      timerElement.textContent = 'Просрочено!';
      return;
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    timerElement.textContent = `${days}д ${hours}ч ${minutes}м ${seconds}с`;
  }, 1000);
}

// Функция для инициализации календаря
function initCalendar() {
  const calendarEl = document.getElementById('calendar');

  // Инициализация FullCalendar
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    events: function(fetchInfo, successCallback, failureCallback) {
      const events = tasks.map(task => ({
        title: task.name,
        start: task.deadline,
        id: task.id, // Добавляем ID для идентификации событий
        category: task.category // Добавляем категорию для события
      }));
      successCallback(events);
    },
    eventClick: function(info) {
      // Открываем модальное окно с деталями задания
      // (например, с именем задания, описанием, сроком)
      console.log('Event Clicked:', info.event);
    },
    eventDidMount: function(info) {
      // Добавляем классы для стилизации событий по категориям:
      const eventEl = info.el;
      const category = info.event.extendedProps.category;
      if (category) {
        eventEl.classList.add(`category-${category.replace(/\s+/g, '-').toLowerCase()}`); // Удаляем пробелы и преобразуем в нижний регистр
      }
    }
  });

  calendar.render();
}

// Вызываем функцию initCalendar при загрузке страницы
initCalendar();

// Привязываем функции к событиям
taskForm.addEventListener('submit', addTask);
filterStatusSelect.addEventListener('change', renderTasks);
filterCategorySelect.addEventListener('change', renderTasks);
filterPrioritySelect.addEventListener('change', renderTasks); // Добавлен обработчик для фильтра по приоритету
filterDateSelect.addEventListener('change', renderTasks);