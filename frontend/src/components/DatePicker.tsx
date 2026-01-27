import { useState, useRef, useEffect } from 'react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export default function DatePicker({
  value,
  onChange,
  disabled = false,
  required = false,
  className = '',
  placeholder = 'Select date',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate || new Date()
  );
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
      setCurrentMonth(new Date(value));
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    setSelectedDate(newDate);
    onChange(formatDate(newDate));
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Input is read-only, clicking it just opens the picker
    setIsOpen(true);
  };

  const handleMonthChange = (monthIndex: number) => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      newMonth.setMonth(monthIndex);
      return newMonth;
    });
  };

  const handleYearChange = (year: number) => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      newMonth.setFullYear(year);
      return newMonth;
    });
  };

  const getYearRange = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 100; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return (
    <div className="relative" ref={pickerRef}>
      <div className="relative">
        <input
          type="text"
          value={selectedDate ? formatDisplayDate(selectedDate) : ''}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          required={required}
          className={`${className} pr-10`}
          placeholder={placeholder}
          readOnly
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          aria-label="Open date picker"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-72">
          <div className="flex items-center justify-center gap-2 mb-4">
            <select
              value={currentMonth.getMonth()}
              onChange={(e) => handleMonthChange(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {monthNames.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={currentMonth.getFullYear()}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {getYearRange().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}
            {days.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => handleDateSelect(day)}
                className={`aspect-square flex items-center justify-center text-sm rounded hover:bg-blue-100 transition-colors ${
                  isToday(day)
                    ? 'font-bold text-blue-600 bg-blue-50'
                    : 'text-gray-700'
                } ${
                  isSelected(day)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : ''
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t flex justify-between">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                setSelectedDate(today);
                onChange(formatDate(today));
                setIsOpen(false);
              }}
              className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDate(null);
                onChange('');
                setIsOpen(false);
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

