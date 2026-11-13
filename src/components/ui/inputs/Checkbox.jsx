export default function Checkbox({
    id,
    checked,
    disabled,
    value,
    required,
    label,
    onChange,
    className,
}) {
    const handleChange = (evt) => {
        if (typeof onChange == "function") {
            onChange(evt.target.id, evt.target.checked);
        }
    };

    return (
        <label className={`flex items-center ${disabled ? "cursor-not-allowed" : "cursor-pointer"} ${className || ""}`}>
            <input
                id={id}
                name={id}
                type="checkbox"
                onChange={handleChange}
                checked={checked}
                disabled={disabled}
                value={value}
                required={required}
                className={`w-4 h-4 accent-primary bg-input border-input-border rounded ${
                    disabled ? "bg-disabled cursor-not-allowed" : "cursor-pointer"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-background`}
            />
            {label && (
                <span className={`ms-2 text-sm font-medium ${disabled ? "text-disabled-content" : "text-content"}`}>
                    {label}
                </span>
            )}
        </label>
    );
}
