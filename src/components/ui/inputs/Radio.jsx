import React from "react";

const Radio = ({ onChange, onClick, id, checked, value, name, required, className, label }) => {
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
        <div className={`flex items-center ${className}`}>
            <input
                id={id}
                type="radio"
                checked={checked}
                onChange={handleChange}
                onClick={handleClick}
                value={value || ""}
                name={name || id}
                required={required || ""}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor={id} className="ms-2 text-sm font-medium text-gray-900 select-none">
                {label}
            </label>
        </div>
    );
};

export default Radio;
