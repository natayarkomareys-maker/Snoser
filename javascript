// Переменные для отслеживания состояния
let currentForm = 'accounts';
let currentComplaint = null;
let attackInterval = null;
let sentCount = 0;
let totalSenders = 0;

// Загружаем количество отправителей при загрузке
document.addEventListener('DOMContentLoaded', function() {
    loadSenderCount();
    showForm('accounts');
    
    // Добавляем обработчики для опций жалоб
    document.querySelectorAll('.complaint-option').forEach(option => {
        option.addEventListener('click', function() {
            selectComplaint(this);
        });
    });
});

// Загрузка количества отправителей
function loadSenderCount() {
    fetch('php/config.php?action=get_count')
        .then(response => response.json())
        .then(data => {
            totalSenders = data.count;
            document.getElementById('emails-left').textContent = totalSenders;
        })
        .catch(error => console.error('Error:', error));
}

// Показать форму
function showForm(formType) {
    // Скрываем все формы
    document.querySelectorAll('.form-section').forEach(form => {
        form.classList.remove('active');
    });
    
    // Убираем активный класс у всех меню
    document.querySelectorAll('.menu-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Показываем выбранную форму
    document.getElementById(`form-${formType}`).classList.add('active');
    document.getElementById(`menu-${formType}`).classList.add('active');
    
    currentForm = formType;
    currentComplaint = null;
}

// Выбор пункта жалобы
function selectComplaint(element) {
    // Убираем выделение у всех опций в текущей форме
    const currentFormElement = document.getElementById(`form-${currentForm}`);
    if (currentFormElement) {
        currentFormElement.querySelectorAll('.complaint-option').forEach(opt => {
            opt.classList.remove('selected');
        });
    }
    
    // Выделяем выбранную опцию
    element.classList.add('selected');
    currentComplaint = element.getAttribute('data-value');
    
    // Показываем/скрываем дополнительные поля в зависимости от выбора
    if (currentForm === 'accounts') {
        const chatGroup = document.getElementById('acc-chat-group');
        const violationGroup = document.getElementById('acc-violation-group');
        
        if (currentComplaint === '18' || currentComplaint === '19' || 
            currentComplaint === '20' || currentComplaint === '21') {
            chatGroup.style.display = 'none';
            violationGroup.style.display = 'none';
        } else {
            chatGroup.style.display = 'block';
            violationGroup.style.display = 'block';
        }
    }
    
    if (currentForm === 'chats') {
        const violationGroup = document.getElementById('chat-violation-group');
        if (currentComplaint === '6') {
            violationGroup.style.display = 'block';
        } else {
            violationGroup.style.display = 'none';
        }
    }
}

// Сброс формы
function resetForm(formType) {
    const form = document.getElementById(`form-${formType}`);
    form.querySelectorAll('input').forEach(field => {
        field.value = '';
    });
    form.querySelectorAll('.complaint-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    currentComplaint = null;
    
    // Показываем скрытые поля по умолчанию
    if (formType === 'accounts') {
        document.getElementById('acc-chat-group').style.display = 'block';
        document.getElementById('acc-violation-group').style.display = 'block';
    }
}

// Запуск атаки
function startAttack(type) {
    if (!currentComplaint) {
        alert('Пожалуйста, выберите тип нарушения!');
        return;
    }
    
    // Собираем данные формы
    const formData = new FormData();
    formData.append('type', type);
    formData.append('complaint', currentComplaint);
    
    // Добавляем поля в зависимости от типа
    if (type === 'accounts') {
        const username = document.getElementById('acc-username').value;
        const id = document.getElementById('acc-id').value;
        const chat = document.getElementById('acc-chat').value;
        const violation = document.getElementById('acc-violation').value;
        
        if (!username || !id) {
            alert('Заполните обязательные поля!');
            return;
        }
        
        formData.append('username', username);
        formData.append('id', id);
        if (chat) formData.append('chat_link', chat);
        if (violation) formData.append('violation_link', violation);
    }
    else if (type === 'channels') {
        const link = document.getElementById('ch-link').value;
        const violation = document.getElementById('ch-violation').value;
        
        if (!link) {
            alert('Введите ссылку на канал!');
            return;
        }
        
        formData.append('channel_link', link);
        if (violation) formData.append('violation_link', violation);
    }
    else if (type === 'bots') {
        const username = document.getElementById('bot-username').value;
        
        if (!username) {
            alert('Введите username бота!');
            return;
        }
        
        formData.append('bot_username', username);
    }
    else if (type === 'chats') {
        const link = document.getElementById('chat-link').value;
        const id = document.getElementById('chat-id').value;
        const violation = document.getElementById('chat-violation').value;
        
        if (!link || !id) {
            alert('Заполните обязательные поля!');
            return;
        }
        
        formData.append('chat_link', link);
        formData.append('chat_id', id);
        if (violation) formData.append('violation_link', violation);
    }
    
    // Показываем статус атаки
    const statusDiv = document.getElementById('attack-status');
    statusDiv.classList.add('active');
    
    // Сброс счетчиков
    sentCount = 0;
    document.getElementById('sent-count').textContent = sentCount;
    document.getElementById('success-rate').textContent = '0%';
    document.getElementById('progress-fill').style.width = '0%';
    
    // Очищаем лог
    const logContainer = document.getElementById('log-container');
    logContainer.innerHTML = '<div class="log-entry">[SYSTEM] Инициализация атаки...</div>';
    
    // Отправляем запрос на сервер
    fetch('php/send_complaint.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Запускаем мониторинг отправки
            monitorAttack(data.attack_id);
        } else {
            addLogEntry(`[ERROR] ${data.message}`, 'error');
        }
    })
    .catch(error => {
        addLogEntry(`[ERROR] ${error.message}`, 'error');
    });
}

// Мониторинг атаки
function monitorAttack(attackId) {
    if (attackInterval) clearInterval(attackInterval);
    
    attackInterval = setInterval(() => {
        fetch(`php/send_complaint.php?action=status&id=${attackId}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'completed') {
                    clearInterval(attackInterval);
                    document.querySelector('.status-title').textContent = '⚠ АТАКА ЗАВЕРШЕНА ⚠';
                }
                
                // Обновляем статистику
                sentCount = data.sent || 0;
                document.getElementById('sent-count').textContent = sentCount;
                
                const progress = (sentCount / totalSenders) * 100;
                document.getElementById('progress-fill').style.width = progress + '%';
                
                const successRate = data.success_rate || 0;
                document.getElementById('success-rate').textContent = successRate + '%';
                document.getElementById('emails-left').textContent = totalSenders - sentCount;
                
                // Добавляем новые записи в лог
                if (data.logs && data.logs.length > 0) {
                    data.logs.forEach(log => addLogEntry(log));
                }
            })
            .catch(error => {
                addLogEntry(`[ERROR] ${error.message}`, 'error');
            });
    }, 1000);
}

// Добавление записи в лог
function addLogEntry(message, type = 'success') {
    const logContainer = document.getElementById('log-container');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    logContainer.insertBefore(logEntry, logContainer.firstChild);
    
    // Ограничиваем количество записей
    if (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.lastChild);
    }
}
