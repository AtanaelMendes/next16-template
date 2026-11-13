import React from "react";

const Radio = ({ onChange, onClick, id, checked, value, name, required, className, label, disabled }) => {
    const handleChange = (evt) => {
        if (typeof onChange === "function") {
            onChange(evt.target.id, evt.target.value, evt.target.checked);
        }
    };

    const handleClick = () => {
        if (typeof onClick === "function") {
            onClick();
        }
    };

    return (
        <div className={`flex items-center ${disabled ? "cursor-not-allowed" : ""} ${className || ""}`}>
            <input
                id={id}
                type="radio"
                checked={checked}
                disabled={disabled}
                onChange={handleChange}
                onClick={handleClick}
                value={value || ""}
                name={name || id}
                required={required || ""}
                className="w-4 h-4 accent-primary bg-input border-input-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:bg-disabled disabled:cursor-not-allowed"
            />
            <label
                htmlFor={id}
                className={`ms-2 text-sm font-medium select-none ${disabled ? "text-disabled-content cursor-not-allowed" : "text-content cursor-pointer"}`}
            >
                {label}
            </label>
        </div>
    );
};

export default Radio;
