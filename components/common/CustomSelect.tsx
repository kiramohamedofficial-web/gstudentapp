import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './Icons';

export interface SelectOption {
    value: string;
    label: string;
}

export interface OptionGroup {
    label: string;
    options: SelectOption[];
}

interface CustomSelectProps {
    options: (SelectOption | OptionGroup)[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, placeholder = "اختر..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    const flatOptions = options.flatMap(opt => 'options' in opt ? opt.options : opt);
    const selectedOption = flatOptions.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={selectRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between text-right px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            >
                <span className={selectedOption ? 'text-[var(--text-primary)]' : 'text-gray-500'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDownIcon className={`w-5 h-5 text-[var(--text-secondary)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-20 top-full mt-2 w-full bg-[rgba(var(--bg-secondary-rgb),0.8)] backdrop-blur-xl border border-[var(--border-primary)] rounded-lg shadow-2xl max-h-60 overflow-y-auto fade-in">
                    <ul className="p-2">
                        {options.map((item, index) => {
                            if ('options' in item) { // It's a group
                                return (
                                    <li key={item.label}>
                                        <div className="px-3 pt-2 pb-1 text-xs font-bold text-[var(--text-secondary)] uppercase">{item.label}</div>
                                        <ul>
                                            {item.options.map(option => (
                                                <li
                                                    key={option.value}
                                                    onClick={() => handleSelect(option.value)}
                                                    className={`px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-[var(--bg-tertiary)] ${value === option.value ? 'font-bold text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}
                                                >
                                                    {option.label}
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                );
                            } else { // It's a single option
                                return (
                                     <li
                                        key={item.value}
                                        onClick={() => handleSelect(item.value)}
                                        className={`px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-[var(--bg-tertiary)] ${value === item.value ? 'font-bold text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}
                                    >
                                        {item.label}
                                    </li>
                                );
                            }
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;