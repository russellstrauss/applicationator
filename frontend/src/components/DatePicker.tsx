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
  placeholder = 'MM/DD/YYYY',
}: DatePickerProps) {
  // Helper function to format date as MM/DD/YYYY
  const formatDateAsMMDDYYYY = (date: Date | null): string => {
    if (!date) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Parse value string to Date, using noon to avoid timezone issues
  const parseValueToDate = (val: string): Date | null => {
    if (!val) return null;
    // If value is in YYYY-MM-DD format, parse it safely
    const isoMatch = val.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      // Create date at noon local time to avoid timezone issues
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
    }
    // Try parsing as Date object
    const date = new Date(val);
    if (!isNaN(date.getTime())) {
      // Create a new date at noon to avoid timezone issues
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    }
    return null;
  };

  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? parseValueToDate(value) : null
  );
  const [inputValue, setInputValue] = useState<string>(
    value && parseValueToDate(value) ? formatDateAsMMDDYYYY(parseValueToDate(value)!) : ''
  );
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate || new Date()
  );
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const date = parseValueToDate(value);
      if (date) {
        setSelectedDate(date);
        setCurrentMonth(date);
        setInputValue(formatDateAsMMDDYYYY(date));
      }
    } else {
      setSelectedDate(null);
      setInputValue('');
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

  const parseDateInput = (input: string): Date | null => {
    if (!input || !input.trim()) return null;
    
    // Try parsing as ISO format (YYYY-MM-DD)
    const isoMatch = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      // Create date at noon local time to avoid timezone issues
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
      if (!isNaN(date.getTime())) return date;
    }
    
    // Try parsing as MM/DD/YYYY or M/D/YYYY
    const slashMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const [, month, day, year] = slashMatch;
      // Create date at noon local time to avoid timezone issues
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
      if (!isNaN(date.getTime())) return date;
    }
    
    // Try parsing as natural language date (e.g., "Jan 15, 2024")
    const naturalDate = new Date(input);
    if (!isNaN(naturalDate.getTime())) {
      // If parsed successfully, create a new date at noon to avoid timezone issues
      const year = naturalDate.getFullYear();
      const month = naturalDate.getMonth();
      const day = naturalDate.getDate();
      return new Date(year, month, day, 12, 0, 0);
    }
    
    return null;
  };

  const handleDateSelect = (day: number) => {
    // Create date at noon to avoid timezone issues
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
      12, 0, 0
    );
    setSelectedDate(newDate);
    // Format as MM/DD/YYYY when selecting from calendar
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(newDate.getDate()).padStart(2, '0');
    const year = newDate.getFullYear();
    setInputValue(`${month}/${dayStr}/${year}`);
    onChange(formatDate(newDate));
    setIsOpen(false);
  };

  const formatInputWithSlashes = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Limit to 8 digits (MMDDYYYY)
    const limitedDigits = digits.slice(0, 8);
    
    // Add slashes in the right places
    if (limitedDigits.length <= 2) {
      return limitedDigits;
    } else if (limitedDigits.length <= 4) {
      return `${limitedDigits.slice(0, 2)}/${limitedDigits.slice(2)}`;
    } else {
      return `${limitedDigits.slice(0, 2)}/${limitedDigits.slice(2, 4)}/${limitedDigits.slice(4)}`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Allow backspace/delete to work normally
    // If user is deleting, just update the input value without parsing
    if (newValue.length < inputValue.length) {
      // User is deleting - format what remains
      const formatted = formatInputWithSlashes(newValue);
      setInputValue(formatted);
      return;
    }
    
    // Format the input with slashes as user types
    const formatted = formatInputWithSlashes(newValue);
    setInputValue(formatted);
    
    // Only parse and update date if we have a complete date (MM/DD/YYYY format)
    if (formatted.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const parsedDate = parseDateInput(formatted);
      if (parsedDate && !isNaN(parsedDate.getTime())) {
        setSelectedDate(parsedDate);
        setCurrentMonth(parsedDate);
        onChange(formatDate(parsedDate));
      }
    } else if (!formatted.trim()) {
      // If input is cleared, clear the date
      setSelectedDate(null);
      onChange('');
    }
    // Don't parse incomplete dates - let user finish typing
  };

  const handleInputBlur = () => {
    // On blur, validate the input if a date was entered
    if (inputValue.trim()) {
      const parsedDate = parseDateInput(inputValue);
      if (parsedDate && !isNaN(parsedDate.getTime())) {
        // Valid date - update state, keep MM/DD/YYYY format
        setSelectedDate(parsedDate);
        setCurrentMonth(parsedDate);
        // Ensure proper MM/DD/YYYY format
        const formatted = formatInputWithSlashes(inputValue.replace(/\D/g, ''));
        if (formatted.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          setInputValue(formatted);
        }
        onChange(formatDate(parsedDate));
      } else {
        // Invalid date, clear the input
        setInputValue('');
        setSelectedDate(null);
        onChange('');
      }
    } else if (selectedDate) {
      // If input is empty but we have a selected date, show it in MM/DD/YYYY format
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const year = selectedDate.getFullYear();
      setInputValue(`${month}/${day}/${year}`);
    }
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
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={handleInputBlur}
          disabled={disabled}
          required={required}
          className={`${className} pr-10`}
          placeholder={placeholder || 'MM/DD/YYYY'}
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
                // Create today's date at noon to avoid timezone issues
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
                setSelectedDate(today);
                // Format as MM/DD/YYYY
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const year = today.getFullYear();
                setInputValue(`${month}/${day}/${year}`);
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
                setInputValue('');
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

