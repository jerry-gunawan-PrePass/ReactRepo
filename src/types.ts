export interface TeamMember {
    name: string;
    phone: string;
    color: string;
}

export interface RecurrencePattern {
    type: 'daily' | 'weekly' | 'monthly';
    occurrences: number;
}

export interface Task {
    id: string;
    text: string;
    timestamp: number;
    assignedTo: string;
    assigneePhone: string;
    dueDate: string;
    dueTime: string;
    color: string;
    completed: boolean;
    recurrence?: RecurrencePattern;
} 