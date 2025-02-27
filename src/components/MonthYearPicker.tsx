import React from 'react';

interface MonthYearPickerProps {
    selectedDate: Date;
    onMonthChange: (month: number) => void;
    onYearChange: (year: number) => void;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
    selectedDate,
    onMonthChange,
    onYearChange
}) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Generate array of years (10 years before and after current year)
    const currentYear = new Date().getFullYear();
    const years = Array.from(
        { length: 21 }, 
        (_, i) => currentYear - 10 + i
    );

    return (
        <div className="flex items-center gap-2">
            <select
                value={selectedDate.getMonth()}
                onChange={(e) => onMonthChange(Number(e.target.value))}
                className="calendar-select bg-transparent border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {months.map((month, index) => (
                    <option key={month} value={index}>
                        {month}
                    </option>
                ))}
            </select>
            <select
                value={selectedDate.getFullYear()}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="calendar-select bg-transparent border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {years.map(year => (
                    <option key={year} value={year}>
                        {year}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default MonthYearPicker; 