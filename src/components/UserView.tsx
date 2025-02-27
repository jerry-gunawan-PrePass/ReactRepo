import React, { useState } from 'react';
import { Task, TeamMember } from '../types';

interface UserViewProps {
    tasks: Record<string, Task[]>;
    selectedDate: Date;
    TEAM_MEMBERS: TeamMember[];
    onChangeMonth: (offset: number) => void;  // For calendar navigation
}

const UserView = ({ tasks, selectedDate, TEAM_MEMBERS, onChangeMonth }: UserViewProps) => {
    // Track local completion status (not synced with admin view)
    const [localCompletions, setLocalCompletions] = useState<Record<string, boolean>>({});

    // Toggle local completion without affecting main task state
    const toggleLocalCompletion = (taskId: string) => {
        setLocalCompletions(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const generateCalendarDays = () => {
        const daysInMonth = getDaysInMonth(selectedDate);
        const firstDay = getFirstDayOfMonth(selectedDate);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    const renderTaskDots = (day: number) => {
        const taskDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
        const dateString = taskDate.toISOString().split('T')[0];
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

    const isCurrentDay = (day: number | null) => {
        if (!day) return false;
        const today = new Date();
        return (
            today.getDate() === day &&
            today.getMonth() === selectedDate.getMonth() &&
            today.getFullYear() === selectedDate.getFullYear()
        );
    };

    // Filter tasks for selected date
    const getTasksForSelectedDate = (date: Date) => {
        const selectedDateString = date.toISOString().split('T')[0];
        const allTasks = Object.values(tasks).flat();
        return allTasks.filter(task => task.dueDate === selectedDateString);
    };

    // Check if a task is overdue
    const isTaskOverdue = (task: Task) => {
        if (task.completed) return false;
        const now = new Date();
        const taskDate = new Date(`${task.dueDate}T${task.dueTime}`);
        return now > taskDate;
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="calendar-container">
                <div className="calendar-header">
                    <button onClick={() => onChangeMonth(-1)} className="calendar-nav-button">&lt;</button>
                    <h2 className="calendar-month-title">{months[selectedDate.getMonth()]} {selectedDate.getFullYear()}</h2>
                    <button onClick={() => onChangeMonth(1)} className="calendar-nav-button">&gt;</button>
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
                        >
                            {day}
                            {day && renderTaskDots(day)}
                        </div>
                    ))}
                </div>
            </div>
            <div className="task-section">
                <div className="task-list">
                    {getTasksForSelectedDate(selectedDate).map((task) => (
                        <div 
                            key={task.id} 
                            className={`task-item ${task.completed ? 'completed' : ''} ${isTaskOverdue(task) ? 'overdue' : ''}`}
                            style={{ borderLeftColor: task.color }}
                        >
                            <div className="task-item-content">
                                <div className="task-main">
                                    <div className="task-header-row">
                                        <input
                                            type="checkbox"
                                            checked={task.completed || localCompletions[task.id] || false}
                                            onChange={() => toggleLocalCompletion(task.id)}
                                            className="task-checkbox"
                                        />
                                        <p className={`task-text ${task.completed ? 'completed-text' : ''}`}>
                                            {task.text}
                                        </p>
                                    </div>
                                    <p className="task-meta">
                                        <span className="task-assignee">
                                            Assigned to: {task.assignedTo}
                                        </span>
                                        <span className="task-due">
                                            Due: {task.dueDate} at {task.dueTime}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserView; 