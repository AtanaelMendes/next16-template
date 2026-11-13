import { useCallback } from "react";

const ButtonRadioGroup = ({ id, options, value, onChange, className}) => {
    const handleOptionChange = useCallback((value) => {
        if (onChange) {
            onChange(value);
        }
    }, [onChange]);

    return (
        <div className={`inline-flex rounded-lg border border-border bg-surface ${className}`}>
            {options?.map((option, index) => (
                <button
                    key={`${id}_${index}`}
                    name={`${id}`}
                    type="button"
                    onClick={() => handleOptionChange(option.value)}
                    className={`
                        px-4 py-2 text-sm font-medium transition-colors duration-200
                        ${index === 0 ? 'rounded-l-lg' : ''}
                        ${index === options.length - 1 ? 'rounded-r-lg' : ''}
                        ${index > 0 ? 'border-l border-border' : ''}
                        ${value == option.value
                            ? 'bg-primary text-primary-content border-primary shadow-sm'
                            : 'bg-surface text-content-secondary hover:bg-hover hover:text-content'
                        }
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background
                    `}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

export default ButtonRadioGroup;