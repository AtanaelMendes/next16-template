import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAsterisk } from '@fortawesome/free-solid-svg-icons';
import { cn, empty } from "@/assets/utils";
import { FieldLabel } from "@/components/ui/display/Typography";

const InputNumber = ({ label, value, onChange, placeholder, id, name, required, small, large, helperText, min, max, disabled, className }) => {
    const handleChange = (evt) => {
        onChange(evt.target.id, evt.target.value);
    }

    const getInputClass = () => {
        let className = " ";

        if (small) className += " p-1.5 text-xs ";
        if (large) className += " p-3 text-base ";

        if (!small && !large) {
            className += " p-2 ";
        }

        return className;
    };

    function hasError() {
        if (required?.hasOwnProperty(id) && required[id].error) {
            return required[id]?.errorMsg || "Este campo é obrigatório";
        }
        if (!empty(min) && Number(value) < Number(min)) {
            return `O valor mínimo permitido é ${min}`;
        }
        if (!empty(max) && Number(value) > Number(max)) {
            return `O valor máximo permitido é ${max}`;
        }
        return "";
    }

    function renderError() {
        let errorMsg = hasError();
        if (empty(errorMsg)) return;

        return (
            <div className="text-xs text-danger-text">
                {errorMsg}
            </div>
        )
    }

    return (
        <div className="w-full relative">
            {label && <div className='flex absolute -top-2.25 left-2 w-fit z-10 text-xs px-0.5 rounded-md mb-0 pb-0 text-nowrap before:bg-surface before:top-0.5 before:left-0 before:absolute before:w-full before:h-3 before:-z-10 before:content-[""] before:rounded-lg'>
                <label htmlFor={id}>
                    <FieldLabel className={cn(required ? 'ml-4' : 'ml-0 mb-0 pb-0', 'text-content-muted')}>
                        {label || ""}
                    </FieldLabel>
                </label>
                {required && (
                    <FontAwesomeIcon icon={faAsterisk} width="8" height="8" color="red" className="self-start absolute" />
                )}
            </div>}

            <input
                id={id}
                type="number"
                min={min}
                max={max}
                value={value}
                name={name || id}
                disabled={disabled}
                required={required}
                onChange={handleChange}
                className={`
                    rounded-lg block w-full
                    border bg-input text-content text-sm placeholder:text-content-muted
                    focus:outline-none focus-visible:ring-2 focus-visible:border-focus
                    ${hasError() ? "border-danger focus-visible:ring-danger" : "border-input-border focus-visible:ring-focus"}
                    ${disabled ? "bg-disabled text-disabled-content cursor-not-allowed" : ""}
                    ${getInputClass()}
                    ${className}
                `}
                placeholder={placeholder || ""} />
            {renderError()}
            {helperText && <div className="text-xs text-info-text absolute -bottom-3 right-0"> {helperText} </div>}
        </div>
    );
}

export default InputNumber;
