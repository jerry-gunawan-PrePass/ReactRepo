import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './assets/calendar.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SideNav from './components/SideNav';
import UserView from './components/UserView';

import { ThemeProvider } from './contexts/ThemeContext';
import KidProfile from "./pages/KidProfile";
import ChoresManager from "./pages/ChoresManager";

// Import supabase client
import { supabase } from './lib/supabaseClient';

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

// Update interfaces to match Supabase tables
interface Kid {
    id: number;
    first_name: string;
    last_name: string;
    points: number;
    avatar_url: string | null;
    color: string; // We'll add this for UI consistency
}

interface Chore {
    id: number;
    description: string;
    created_at: string;
    frequency: string;
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

    // Replace TEAM_MEMBERS with kids from Supabase
    const [kids, setKids] = useState<Kid[]>([]);
    // Add state for chores
    const [chores, setChores] = useState<Chore[]>([]);
    // Add state for selected chore
    const [selectedChore, setSelectedChore] = useState<Chore | null>(null);
    
    // Replace selectedAssignee with selectedKid
    const [selectedKid, setSelectedKid] = useState<Kid | null>(null);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];


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

    // Fetch kids and chores from Supabase
    useEffect(() => {
        async function fetchData() {
            // Fetch kids
            const { data: kidsData, error: kidsError } = await supabase
                .from('kids')
                .select('*');
            
            if (kidsError) {
                console.error('Error fetching kids:', kidsError);
            } else if (kidsData) {
                // Add color property to each kid (you can customize this)
                const kidsWithColors = kidsData.map((kid, index) => ({
                    ...kid,
                    color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][index % 4]
                }));
                setKids(kidsWithColors);
                if (kidsWithColors.length > 0) {
                    setSelectedKid(kidsWithColors[0]);
                }
            }
            
            // Fetch chores - log the response to debug
            const choresResponse = await supabase
                .from('chores')
                .select('*');
            
            console.log('Chores response:', choresResponse);
            
            if (choresResponse.error) {
                console.error('Error fetching chores:', choresResponse.error);
            } else if (choresResponse.data) {
                setChores(choresResponse.data);
                console.log('Chores loaded:', choresResponse.data);
            }
        }
        
        fetchData();
    }, []);

    // Handle task addition and editing
    const handleAddTask = useCallback((event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedChore || !selectedKid) {
            console.error("Missing required data:", { selectedChore, selectedKid });
            return;
        }

        console.log("Attempting to assign chore:", {
            chore: selectedChore,
            kid: selectedKid,
            date: selectedDate,
            time: dueTime
        });

        // Use the chore's frequency if available, otherwise use the selected recurrence type
        const effectiveRecurrenceType = selectedChore.frequency || recurrenceType;
        
        if (isEditing && editingTaskId) {
            // Update existing task
            setTasks(prevTasks => {
                const newTasks = { ...prevTasks };
                Object.keys(newTasks).forEach(dateString => {
                    newTasks[dateString] = newTasks[dateString].map(task =>
                        task.id === editingTaskId
                            ? {
                                ...task,
                                text: selectedChore.description,
                                assignedTo: `${selectedKid.first_name} ${selectedKid.last_name}`,
                                dueTime: dueTime,
                                color: selectedKid.color
                            }
                            : task
                    );
                });
                return newTasks;
            });
        } else {
            // Create new task(s) with recurrence if specified
            const recurrence: RecurrencePattern | undefined = effectiveRecurrenceType !== '' ? {
                type: effectiveRecurrenceType as RecurrencePattern['type'],
                occurrences: recurrenceCount
            } : undefined;

            const startDate = selectedDate;
            const formattedDate = startDate.toISOString().split('T')[0]; // YYYY-MM-DD format

            const baseTask: Omit<Task, 'id' | 'dueDate'> = {
                text: selectedChore.description,
                timestamp: Date.now(),
                assignedTo: `${selectedKid.first_name} ${selectedKid.last_name}`,
                assigneePhone: '',
                dueTime,
                color: selectedKid.color,
                completed: false,
                recurrence
            };

            // First, check for existing assignments to avoid duplicates
            const checkExistingAssignment = async () => {
                try {
                    // Get the maximum ID to help with sequence issues
                    const { data: maxIdResult } = await supabase
                        .from('kids_chores')
                        .select('id')
                        .order('id', { ascending: false })
                        .limit(1);
                    
                    const nextId = maxIdResult && maxIdResult.length > 0 ? maxIdResult[0].id + 1 : 1;
                    console.log("Next ID to use:", nextId);
                    
                    // Check if this assignment already exists
                    const { data: existingAssignments } = await supabase
                        .from('kids_chores')
                        .select('*')
                        .eq('kid_id', selectedKid.id)
                        .eq('chore_id', selectedChore.id)
                        .eq('assigned_date', formattedDate);
                    
                    if (existingAssignments && existingAssignments.length > 0) {
                        alert("This chore is already assigned to this kid on this date.");
                        return;
                    }
                    
                    // Insert with explicit ID to avoid sequence issues
                    const kidChoreData = {
                        id: nextId,
                        kid_id: selectedKid.id,
                        chore_id: selectedChore.id,
                        assigned_date: formattedDate,
                        completed: false
                    };

                    console.log("Inserting into kids_chores:", kidChoreData);
                    
                    const { data, error } = await supabase
                        .from('kids_chores')
                        .insert(kidChoreData)
                        .select();

                    if (error) {
                        console.error('Error inserting kid_chore:', error);
                        
                        if (error.code === '23505') { // Duplicate key error
                            alert("There was an issue with the database sequence. Trying an alternative approach...");
                            
                            // Try without specifying ID
                            const { data: retryData, error: retryError } = await supabase
                                .from('kids_chores')
                                .insert({
                                    kid_id: selectedKid.id,
                                    chore_id: selectedChore.id,
                                    assigned_date: formattedDate,
                                    completed: false
                                })
                                .select();
                                
                            if (retryError) {
                                throw retryError;
                            }
                            
                            return retryData;
                        }
                        
                        throw error;
                    }
                    
                    return data;
                } catch (err: unknown) {
                    console.error("Assignment error:", err);
                    alert(`Failed to assign chore: ${err instanceof Error ? err.message : 'Unknown error'}`);
                    return null;
                }
            };

            // Execute the assignment and update UI
            checkExistingAssignment().then(data => {
                if (!data) return; // Assignment failed
                
                console.log('Successfully assigned chore to kid:', data);
                
                // Rest of the task creation logic for the UI
                if (recurrence) {
                    const dates = generateRecurringDates(
                        formattedDate,
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
                                text: `${selectedChore.description} (${index + 1}/${recurrence.occurrences})`
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
                        dueDate: formattedDate
                    };

                    setTasks(prevTasks => ({
                        ...prevTasks,
                        [dateString]: [...(prevTasks[dateString] || []), task]
                    }));
                    
                    scheduleNotification(task);
                }
                
                // Clear form and show success message
                setSelectedChore(null);
                alert("Chore assigned successfully!");
            });
        }
    }, [selectedDate, selectedChore, selectedKid, dueTime, recurrenceType, recurrenceCount, isEditing, editingTaskId]);

    const handleDeleteTask = (_dateString: string, taskId: string) => {
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
                    <select
                        className="task-input"
                        value={selectedChore?.id || ''}
                        onChange={(e) => {
                            const choreId = parseInt(e.target.value);
                            const chore = chores.find(c => c.id === choreId) || null;
                            setSelectedChore(chore);
                        }}
                        required
                    >
                        <option value="">Select a chore...</option>
                        {chores.map(chore => (
                            <option key={chore.id} value={chore.id}>
                                {chore.description}
                            </option>
                        ))}
                    </select>
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
                            value={selectedKid?.id || ''}
                            onChange={(e) => {
                                const kidId = parseInt(e.target.value);
                                const kid = kids.find(k => k.id === kidId) || null;
                                setSelectedKid(kid);
                            }}
                            required
                        >
                            <option value="">Select a kid...</option>
                            {kids.map(kid => (
                                <option key={kid.id} value={kid.id}>
                                    {kid.first_name} {kid.last_name}
                                </option>
                            ))}
                        </select>
                        <div className="recurrence-group">
                            <select
                                className="task-select"
                                value={selectedChore?.frequency || recurrenceType}
                                onChange={(e) => setRecurrenceType(e.target.value as RecurrencePattern['type'] | '')}
                                disabled={selectedChore?.frequency ? true : false} // Disable if chore has a frequency
                            >
                                <option value="">One-time</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                            {(selectedChore?.frequency || recurrenceType !== '') && (
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
                        <button 
                            type="submit" 
                            className="task-button task-button-primary"
                            disabled={!selectedChore || !selectedKid}
                        >
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

    // Add this function near the top of your App component
    const checkSupabaseConnection = async () => {
        try {
            const { data, error } = await supabase.from('kids').select('count');
            if (error) {
                console.error("Supabase connection error:", error);
                return false;
            }
            console.log("Supabase connection successful:", data);
            return true;
        } catch (err) {
            console.error("Supabase connection exception:", err);
            return false;
        }
    };

    // Call this in a useEffect
    useEffect(() => {
        checkSupabaseConnection();
    }, []);

    // Main app structure with routing
    return (
        <ThemeProvider>
            <Router>
                <div className="app-container">
                    <SideNav />
                    <div className="main-content">
                        <Routes>
                            {/* Parent route with full functionality */}
                            <Route path="/admin" element={adminView} />
                            
                            {/* User route with limited functionality */}
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
                            
                            {/* Kid profile route */}
                            <Route path="/kid/profile" element={<KidProfile />} />
                            
                            {/* Kid profile route with ID parameter */}
                            <Route path="/kid/profile/:id" element={<KidProfile />} />
                            
                            {/* Chores Manager route */}
                            <Route path="/chores" element={<ChoresManager />} />
                            
                            {/* Default route redirect */}
                            <Route path="/" element={<Navigate to="/admin" />} />
                        </Routes>
                    </div>
                </div>
            </Router>
        </ThemeProvider>
    );
}

export default App;
