import * as React from "react";

interface CalendarProps {
    onDateSelect: (day: number) => void;
    selectedDate?: Date;
}

export function Calendar({ onDateSelect, selectedDate }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = React.useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const renderDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day"></div>);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isPast = date < today;
            const isSelected = selectedDate && 
                date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getFullYear() === selectedDate.getFullYear();

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => !isPast && onDateSelect(day)}
                >
                    {day}
                </div>
            );
        }

        return days;
    };

    return (
        <div className="calendar-dropdown">
            <div className="calendar-header">
                <button onClick={handlePrevMonth} className="nav-button">←</button>
                <div>
                    {currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <button onClick={handleNextMonth} className="nav-button">→</button>
            </div>
            <div className="calendar-weekdays">
                {weekdays.map(day => (
                    <div key={day} className="weekday">{day}</div>
                ))}
            </div>
            <div className="calendar-days">
                {renderDays()}
            </div>
        </div>
    );
}

export default Calendar;
