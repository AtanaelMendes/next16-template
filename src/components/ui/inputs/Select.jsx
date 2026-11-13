import {
    faXmark,
    faAsterisk,
    faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FieldLabel } from "@/components/ui/display/Typography";
import Button from "@/components/ui/buttons/Button";
import { TooltipComponent } from "@/components/ui/overlays/TooltipComponent";
import { cn } from "@/assets/utils";

const Select = ({
    label,
    value,
    id,
    name,
    options,
    placeholder,
    onChange,
    hideClearButton,
    required,
    disabled,
    hint,
    helperText,
}) => {
    const handleChange = (evt) => {
        if (typeof onChange == "function") {
            onChange(evt.target.id, evt.target.value);
        }
    };

    const clearSelect = (idField) => {
        var el = document.getElementById(idField);
        el.value = "";
        if (typeof onChange === "function") {
            onChange(idField, "");
        }
    };

    const renderOptions = () => {
        if (!options) {
            return <option>Carregando...</option>;
        }
        return options?.map((opt) => {
            return (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            );
        });
    };

    const hasError = () => required?.hasOwnProperty(id) && required[id].error;

    function renderError() {
        if (!hasError()) return;
        let errorMsg = required[id]?.errorMsg || "Este campo é obrigatório";

        return <div className="text-xs text-danger-text">{errorMsg}</div>;
    }

    return (
        <>
            <div className="w-full relative">
                {label && (
                    <div className='flex absolute -top-2.25 left-2 w-fit z-10 text-xs px-0.5 rounded-md mb-0 pb-0 text-nowrap before:bg-surface before:top-0.5 before:left-0 before:absolute before:w-full before:h-3 before:-z-10 before:content-[""] before:rounded-lg'>
                        <label htmlFor={id}>
                            <FieldLabel className={cn(required ? 'ml-4' : 'ml-0 mb-0 pb-0', 'text-content-muted')}>
                                {label || ""}
                            </FieldLabel>
                        </label>
                        {required && (<FontAwesomeIcon icon={faAsterisk} width='10' height='10' color='red' className='self-start absolute'/>)}
                        {hint && (
                            <>
                                <TooltipComponent content={<div className="text-xs z-100 max-w-75">{hint}</div>} asChild usePortal={false}>
                                    <span>
                                        <FontAwesomeIcon icon={faInfoCircle} width="16" height="16" color="blue" className="self-start ml-2" tabIndex={-1} aria-hidden={false}/>
                                    </span>
                                </TooltipComponent>
                            </>
                        )}
                    </div>
                )}
                <select
                    id={id}
                    value={value}
                    disabled={disabled}
                    name={name || id}
                    onChange={handleChange}
                    className={`
                        bg-input text-content text-sm rounded-lg border
                        focus:outline-none focus-visible:ring-2 focus-visible:border-focus
                        ${hasError() ? "border-danger focus-visible:ring-danger" : "border-input-border focus-visible:ring-focus"} block w-full p-2 pr-16
                        ${disabled ? "bg-disabled text-disabled-content cursor-not-allowed" : null}
                    `}
                >
                    {placeholder && (
                        <option value="">{placeholder || "Selecione"}</option>
                    )}
                    {renderOptions()}
                </select>
                {!hideClearButton && (
                    <Button
                        disabled={disabled || !value}
                        aria-label="Limpar seleção"
                        className="absolute inset-y-0 right-6 top-[0.3rem] h-7"
                        size="small"
                        onClick={() => {clearSelect(id);}}
                        pill
                    >
                        <FontAwesomeIcon icon={faXmark} width="18" height="18" />
                    </Button>
                )}
                {renderError()}
            </div>
            {helperText && <div className="text-xs text-info-text pl-1"> {helperText} </div>}
        </>
    );
};

export default Select;
