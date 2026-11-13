import { useCallback, useEffect, useState } from "react";
import { cn, empty } from "@/assets/utils";

const ButtonToggle = ({
    id,
    value,
    label,
    labelOn,
    LabelOff,
    primary,
    danger,
    warning,
    success,
    small,
    checked,
    onChange,
    onClick,
    className,
    disabled,
    wordWrap
}) => {
    const [renderLabel, setRenderLabel] = useState(label);

    const handleChange = useCallback((evt) => {
        onChange?.(evt.target.id, evt.target.value, evt.target.checked);
    }, [onChange]);

    const handleClick = useCallback((evt) => {
        onClick?.(evt.target.checked);
    }, [onClick]);

    useEffect(() => {
        if (labelOn && LabelOff) {
            setRenderLabel(checked ? labelOn : LabelOff);
        } else {
            if (empty(label) || label !== renderLabel) {
                setRenderLabel(label);
            }
        }
    }, [checked, label, labelOn, LabelOff]);

    const getVariantStyles = () => {
        if (danger) return "peer-focus-visible:ring-danger/50 peer-checked:bg-danger peer-checked:border-danger";
        if (success) return "peer-focus-visible:ring-success/50 peer-checked:bg-success peer-checked:border-success";
        if (warning) return "peer-focus-visible:ring-warning/50 peer-checked:bg-warning peer-checked:border-warning";
        if (primary) return "peer-focus-visible:ring-focus/50 peer-checked:bg-primary peer-checked:border-primary";
        return "";
    };

    const toggleStyles = cn(
        "relative rounded-full border border-input-border bg-surface-muted",
        "after:content-[''] after:absolute after:bg-surface",
        "after:border after:border-content-muted after:rounded-full after:start-[2px]",
        "peer peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background peer-checked:after:border-white",
        "after:transition-all rtl:peer-checked:after:-translate-x-full",
        "transition-colors duration-150",
        small
            ? "w-7 h-3 after:h-[8px] after:w-[8px] after:top-[1px] peer-checked:after:translate-x-3"
            : "w-8 h-4 after:h-[10px] after:w-[10px] after:top-[2px] peer-checked:after:translate-x-4",
        getVariantStyles(),
        disabled ? "opacity-60" : ""
    );

    if (!primary && !danger && !warning && !success) return null;

    return (
        <label
            className={cn(
                "inline-flex items-center me-5",
                disabled ? "cursor-not-allowed" : "cursor-pointer",
                className
            )}
        >
            <input
                id={id}
                name={id}
                type="checkbox"
                value={value}
                checked={checked}
                disabled={disabled}
                onChange={handleChange}
                onClick={handleClick}
                className="sr-only peer"
            />
            <div className={toggleStyles} />
            <span
                className={cn(
                    "ms-3 text-sm font-medium",
                    disabled ? "text-disabled-content" : "text-content",
                    wordWrap ? "whitespace-normal" : "whitespace-nowrap"
                )}
            >
                {renderLabel}
            </span>
        </label>
    );
};

export default ButtonToggle;
