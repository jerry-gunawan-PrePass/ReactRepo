import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './assets/calendar.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SideNav from './components/SideNav';
import UserView from './components/UserView';

import { ThemeProvider } from './contexts/ThemeContext';
import MonthYearPicker from './components/MonthYearPicker';
import KidProfile from "./pages/KidProfile";

// Define interfaces for data structures
interface TeamMember {
    name: string;
    phone: string;    // Phone number for notifications
    color: string;    // Color used for task indicators
}

// Predefined team members with their contact info and colors
const TEAM_MEMBERS: TeamMember[] = [
    { name: 'Jerry', phone: '+1234567890', color: '#FF6B6B' },
    { name: 'Mike', phone: '6232398834@tmomail.net', color: '#4ECDC4' },
    { name: 'Abe', phone: '+1234567892', color: '#45B7D1' },
    { name: 'Rick', phone: '+1234567893', color: '#96CEB4' }
];

// Pattern for recurring tasks
interface RecurrencePattern {
    type: 'daily' | 'weekly' | 'monthly';
    occurrences: number;  // Number of times the task should repeat
}

// Main task data structure
interface Task {
    id: string;           // Unique identifier
    text: string;         // Task description
    timestamp: number;    // Creation time
    assignedTo: string;   // Team member name
    assigneePhone: string;// For notifications
    dueDate: string;      // YYYY-MM-DD format
    dueTime: string;      // HH:MM format
    color: string;        // Visual indicator color
    completed: boolean;   // Task completion status
    recurrence?: RecurrencePattern;  // Optional recurrence info
}

interface NotificationPermission {
    granted: boolean;
    error?: string;
}

function App() {
    // State for managing tasks grouped by date
    const [tasks, setTasks] = useState<Record<string, Task[]>>({});
    
    // Calendar navigation and task creation states
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [newTask, setNewTask] = useState('');
    const [dueTime, setDueTime] = useState('12:00');
    
    // Task editing states
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    // Recurrence handling states
    const [recurrenceType, setRecurrenceType] = useState<RecurrencePattern['type'] | ''>('');
    const [recurrenceCount, setRecurrenceCount] = useState<number>(1);
    const [selectedAssignee, setSelectedAssignee] = useState<TeamMember>(TEAM_MEMBERS[0]);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>({ granted: false });
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        show: boolean;
        taskId: string;
        dateString: string;
    } | null>(null);

    // Add state for closed tasks
    const [closedTasks, setClosedTasks] = useState<Record<string, boolean>>({});

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = Array.from({ length: 10 }, (_, i) => selectedDate.getFullYear() - 5 + i);

    // Calendar helper functions
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    // Generate array of days for calendar display
    const generateCalendarDays = () => {
        const daysInMonth = getDaysInMonth(selectedDate);
        const firstDay = getFirstDayOfMonth(selectedDate);
        const days = [];

        // Fill in empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    // Handle calendar day selection
    const handleDateClick = (day: number) => {
        setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day));
    };

    // Generate recurring dates based on pattern
    const generateRecurringDates = (startDate: string, pattern: RecurrencePattern): string[] => {
        const dates: string[] = [];
        let current = new Date(startDate + 'T00:00:00');
        let count = 0;

        // Add first occurrence
        dates.push(startDate);
        count++;

        // Generate subsequent dates based on recurrence type
        while (count < pattern.occurrences) {
            switch (pattern.type) {
                case 'daily':
                    current.setDate(current.getDate() + 1);
                    break;
                case 'weekly':
                    current.setDate(current.getDate() + 7);
                    break;
                case 'monthly':
                    current.setMonth(current.getMonth() + 1);
                    break;
            }
            dates.push(current.toISOString().split('T')[0]);
            count++;
        }
        return dates;
    };

    // Handle task addition and editing
    const handleAddTask = useCallback((event: React.FormEvent) => {
        event.preventDefault();
        if (newTask.trim() === '') return;

        if (isEditing && editingTaskId) {
            // Update existing task
            setTasks(prevTasks => {
                const newTasks = { ...prevTasks };
                Object.keys(newTasks).forEach(dateString => {
                    newTasks[dateString] = newTasks[dateString].map(task =>
                        task.id === editingTaskId
                            ? {
                                ...task,
                                text: newTask,
                                assignedTo: selectedAssignee.name,
                                dueTime: dueTime,
                                color: selectedAssignee.color
                            }
                            : task
                    );
                });
                return newTasks;
            });
        } else {
            // Create new task(s) with recurrence if specified
            const recurrence: RecurrencePattern | undefined = recurrenceType !== '' ? {
                type: recurrenceType as RecurrencePattern['type'],
                occurrences: recurrenceCount
            } : undefined;

            const startDate = selectedDate;

            const baseTask: Omit<Task, 'id' | 'dueDate'> = {
                text: newTask,
                timestamp: Date.now(),
                assignedTo: selectedAssignee.name,
                assigneePhone: selectedAssignee.phone,
                dueTime,
                color: selectedAssignee.color,
                completed: false,
                recurrence
            };

            if (recurrence) {
                const dates = generateRecurringDates(
                    startDate.toISOString().split('T')[0],
                    recurrence
                );

                setTasks(prevTasks => {
                    const newTasks = { ...prevTasks };
                    dates.forEach((date, index) => {
                        const dateString = new Date(date).toDateString();
                        const task: Task = {
                            ...baseTask,
                            id: uuidv4(),
                            dueDate: date,
                            text: `${newTask} (${index + 1}/${recurrence.occurrences})`
                        };
                        newTasks[dateString] = [...(newTasks[dateString] || []), task];
                        scheduleNotification(task);
                    });
                    return newTasks;
                });
            } else {
                const dateString = startDate.toDateString();
                const task: Task = {
                    ...baseTask,
                    id: uuidv4(),
                    dueDate: startDate.toISOString().split('T')[0]
                };

                setTasks(prevTasks => ({
                    ...prevTasks,
                    [dateString]: [...(prevTasks[dateString] || []), task]
                }));
                
                scheduleNotification(task);
            }
        }

        // Clear form
        setNewTask('');
    }, [selectedDate, newTask, selectedAssignee, dueTime, recurrenceType, recurrenceCount, isEditing, editingTaskId]);

    const handleDeleteTask = (dateString: string, taskId: string) => {
        setTasks(prevTasks => {
            const newTasks = { ...prevTasks };
            // Find and remove the task from the correct date
            Object.keys(newTasks).forEach(date => {
                newTasks[date] = newTasks[date].filter(task => task.id !== taskId);
                // Remove empty date arrays
                if (newTasks[date].length === 0) {
                    delete newTasks[date];
                }
            });
            return newTasks;
        });
        setDeleteConfirmation(null);
    };

    // Get tasks for a specific date
    const getTasksForSelectedDate = (selectedDay: Date) => {
        // Create a date string that matches how we store tasks
        const selectedDateString = selectedDay.toISOString().split('T')[0];
        
        // Get all tasks and filter for the selected date
        const allTasks = Object.values(tasks).flat();
        return allTasks.filter(task => task.dueDate === selectedDateString);
    };

    // Handle task editing
    const handleEditTask = (task: Task) => {
        setIsEditing(true);
        setEditingTaskId(task.id);
        // Populate form with existing task values
        setNewTask(task.text);
        setDueTime(task.dueTime);
        setSelectedAssignee(TEAM_MEMBERS.find(member => member.name === task.assignedTo) || TEAM_MEMBERS[0]);
    };

    // Handle month navigation in calendar
    const changeMonth = (offset: number) => {
        setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + offset, 1));
    };

    const handleMonthChange = (month: number) => {
        setSelectedDate(new Date(selectedDate.getFullYear(), month, 1));
    };

    const handleYearChange = (year: number) => {
        setSelectedDate(new Date(year, selectedDate.getMonth(), 1));
    };

    // Render task indicator dots on calendar
    const renderTaskDots = (day: number) => {
        // Convert calendar day to ISO date string for comparison
        const taskDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
        const dateString = taskDate.toISOString().split('T')[0];
        
        // Find all tasks for this date
        const allTasks = Object.values(tasks).flat();
        const matchingTasks = allTasks.filter(task => task.dueDate === dateString);
        
        return (
            <div className="task-dots">
                {matchingTasks.map((task, index) => (
                    <span
                        key={`${task.id}-${index}`}
                        className="task-dot"
                        style={{ backgroundColor: task.color }}
                    />
                ))}
            </div>
        );
    };

    // Check if a day is the current day
    const isCurrentDay = (day: number | null) => {
        if (!day) return false;
        const today = new Date();
        return (
            today.getDate() === day &&
            today.getMonth() === selectedDate.getMonth() &&
            today.getFullYear() === selectedDate.getFullYear()
        );
    };

    // Check if a task is past its due date
    const isTaskOverdue = (task: Task) => {
        if (task.completed) return false;
        const now = new Date();
        const taskDate = new Date(`${task.dueDate}T${task.dueTime}`);
        return now > taskDate;
    };

    // Handle task completion toggling
    const toggleTaskCompletion = (taskId: string) => {
        setTasks(prevTasks => {
            const newTasks = { ...prevTasks };
            // Search all dates for the task
            for (const dateString in newTasks) {
                const taskIndex = newTasks[dateString].findIndex(task => task.id === taskId);
                if (taskIndex !== -1) {
                    // Update task completion status
                    newTasks[dateString] = [...newTasks[dateString]];
                    newTasks[dateString][taskIndex] = {
                        ...newTasks[dateString][taskIndex],
                        completed: !newTasks[dateString][taskIndex].completed
                    };
                    break;
                }
            }
            return newTasks;
        });
    };

    // Show confirmation dialog before deleting a task
    const showDeleteConfirmation = (dateString: string, taskId: string) => {
        setDeleteConfirmation({ show: true, taskId, dateString });
    };

    // Add function to toggle closed state
    const toggleTaskClosed = (taskId: string) => {
        setClosedTasks(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    // Initialize notifications when component mounts
    useEffect(() => {
        setupNotifications();
    }, []);

    // Set up browser notifications and service worker
    const setupNotifications = async () => {
        try {
            // Check if browser supports notifications
            if (!('Notification' in window)) {
                throw new Error('This browser does not support notifications');
            }

            // Request permission from user
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                // Register service worker for background notifications
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                setNotificationPermission({ granted: true });
                return registration;
            } else {
                throw new Error('Notification permission denied');
            }
        } catch (error) {
            const err = error as Error;
            setNotificationPermission({ granted: false, error: err.message });
        }
    };

    // Schedule notification for a task
    const scheduleNotification = async (task: Task) => {
        if (!notificationPermission.granted) return;

        const taskDate = new Date(`${task.dueDate}T${task.dueTime}`);
        const now = new Date();
        
        // Schedule notification 15 minutes before due time
        const notificationTime = new Date(taskDate.getTime() - 15 * 60000);
        
        if (notificationTime > now) {
            try {
                const registration = await navigator.serviceWorker.ready;
                
                // Show notification with task details
                await registration.showNotification('Task Reminder', {
                    body: `Task "${task.text}" is due in 15 minutes`,
                    icon: '/icon.png',
                    badge: '/badge.png',
                    tag: task.id,
                    data: {
                        taskId: task.id,
                        dueDate: task.dueDate,
                        dueTime: task.dueTime,
                        phone: task.assigneePhone
                    }
                });
            } catch (error) {
                console.error('Error scheduling notification:', error);
            }
        }
    };

    // Send SMS notification using Twilio
    const sendSMSNotification = async (task: Task) => {
        try {
            const response = await fetch('/api/send-sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: task.assigneePhone,
                    message: `Reminder: Task "${task.text}" is due on ${task.dueDate} at ${task.dueTime}`,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send SMS notification');
            }
        } catch (error) {
            console.error('Error sending SMS:', error);
        }
    };

    // Admin view component with full task management capabilities
    const adminView = (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">Taskboard</h1>
            <div className="calendar-container">
                <div className="calendar-header">
                    <button onClick={() => changeMonth(-1)} className="calendar-nav-button">&lt;</button>
                    <h2 className="calendar-month-title">{months[selectedDate.getMonth()]} {selectedDate.getFullYear()}</h2>
                    <button onClick={() => changeMonth(1)} className="calendar-nav-button">&gt;</button>
                </div>
                <div className="calendar-grid">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="calendar-day-header">{day}</div>
                    ))}
                    {generateCalendarDays().map((day, index) => (
                        <div
                            key={index}
                            className={`calendar-day ${!day ? 'empty' : ''} ${
                                day && selectedDate.getDate() === day ? 'selected' : ''
                            } ${isCurrentDay(day) ? 'current-day' : ''}`}
                            onClick={() => day && handleDateClick(day)}
                        >
                            {day}
                            {day && renderTaskDots(day)}
                        </div>
                    ))}
                </div>
            </div>
            <div className="task-section">
                <form onSubmit={handleAddTask} className="task-form-group">
                    <input
                        type="text"
                        className="task-input"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Enter task..."
                    />
                    <div className="task-controls">
                        <div className="task-datetime-inputs">
                            <input
                                type="time"
                                className="task-time-input w-full"
                                value={dueTime}
                                onChange={(e) => setDueTime(e.target.value)}
                            />
                        </div>
                        <select
                            className="task-select"
                            value={selectedAssignee.name}
                            onChange={(e) => setSelectedAssignee(
                                TEAM_MEMBERS.find(member => member.name === e.target.value) || TEAM_MEMBERS[0]
                            )}
                        >
                            {TEAM_MEMBERS.map(member => (
                                <option key={member.name} value={member.name}>
                                    {member.name}
                                </option>
                            ))}
                        </select>
                        <div className="recurrence-group">
                            <select
                                className="task-select"
                                value={recurrenceType}
                                onChange={(e) => setRecurrenceType(e.target.value as RecurrencePattern['type'] | '')}
                            >
                                <option value="">One-time</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                            {recurrenceType !== '' && (
                                <input
                                    type="number"
                                    min="1"
                                    max="52"
                                    value={recurrenceCount}
                                    onChange={(e) => setRecurrenceCount(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="task-input occurrence-input"
                                    placeholder="Times"
                                />
                            )}
                        </div>
                        <button type="submit" className="task-button task-button-primary">
                            {isEditing ? 'Save' : 'Add'}
                        </button>
                    </div>
                </form>
                <div className="task-list">
                    {getTasksForSelectedDate(selectedDate).map((task) => (
                        <div 
                            key={task.id} 
                            className={`task-item 
                                ${closedTasks[task.id] ? 'completed' : ''} 
                                ${task.completed && !closedTasks[task.id] ? 'user-completed' : ''} 
                                ${isTaskOverdue(task) ? 'overdue' : ''}`
                            }
                            style={{ borderLeftColor: task.color }}
                        >
                            <div className="task-item-content">
                                <div className="task-main">
                                    <div className="task-header-row">
                                        <div className="task-checkboxes">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={task.completed}
                                                    onChange={() => toggleTaskCompletion(task.id)}
                                                    className="task-checkbox"
                                                />
                                                Complete
                                            </label>
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={closedTasks[task.id] || false}
                                                    onChange={() => toggleTaskClosed(task.id)}
                                                    className="task-checkbox"
                                                />
                                                Closed
                                            </label>
                                        </div>
                                    </div>
                                    <p className={`task-text ${task.completed ? 'completed-text' : ''} font-bold text-lg mt-2`}>
                                        {task.text}
                                    </p>
                                    <p className="task-meta">
                                        <span className="task-assignee">
                                            Assigned to: {task.assignedTo}
                                        </span>
                                        <span className="task-due">
                                            Due: {task.dueDate} at {task.dueTime}
                                        </span>
                                    </p>
                                </div>
                                <div className="task-actions">
                                    <button
                                        onClick={() => handleEditTask(task)}
                                        className="task-action-button text-blue-500"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => showDeleteConfirmation(selectedDate.toDateString(), task.id)}
                                        className="task-action-button text-red-500"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {deleteConfirmation && (
                    <div className="delete-confirmation-overlay">
                        <div className="delete-confirmation">
                            <p>Are you sure you want to delete this task?</p>
                            <div className="delete-confirmation-buttons">
                                <button
                                    onClick={() => handleDeleteTask('', deleteConfirmation.taskId)}
                                    className="task-button task-button-danger"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => setDeleteConfirmation(null)}
                                    className="task-button task-button-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // Main app structure with routing
    return (
        <ThemeProvider>
            <Router>
                <div className="app-container">
                    <SideNav />
                    <div className="main-content">
                        <Routes>
                            <Route path="/admin" element={adminView} />
                            <Route path="/user" element={
                                <UserView 
                                    tasks={tasks}
                                    selectedDate={selectedDate}
                                    TEAM_MEMBERS={TEAM_MEMBERS}
                                    onChangeMonth={changeMonth}
                                    closedTasks={closedTasks}
                                    onToggleTaskCompletion={toggleTaskCompletion}
                                />
                            } />
                            <Route path="/" element={<Navigate to="/admin" />} />
                        </Routes>
                    </div>
        <Router>
            <div className="app-container">
                <SideNav />
                <div className="main-content">
                    <Routes>
                        {/* Admin route with full functionality */}
                        <Route path="/admin" element={adminView} />
                        {/* User route with limited functionality */}
                        <Route path="/user" element={
                            <UserView 
                                tasks={tasks}
                                selectedDate={selectedDate}
                                TEAM_MEMBERS={TEAM_MEMBERS}
                                onChangeMonth={changeMonth}
                            />
                        } />
                        {/* Kid profile route */}
                        <Route path="/kid/profile" element={<KidProfile />} />
                        {/* Kid profile route with ID parameter */}
                        <Route path="/kid/profile/:id" element={<KidProfile />} />
                        {/* Default route redirect */}
                        <Route path="/" element={<Navigate to="/admin" />} />
                    </Routes>
                </div>
            </Router>
        </ThemeProvider>
    );
}

export default App;
