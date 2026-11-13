import {
    faEye,
    faEyeSlash,
    faAsterisk,
    faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { FieldLabel } from "@/components/ui/display/Typography";
import { TooltipComponent } from "@/components/ui/overlays/TooltipComponent";

const InputPassword = ({
    onKeyDown,
    onChange,
    onBlur,
    value,
    required,
    label,
    id,
    hint,
    maxLength,
    showTogglePassword = true,
}) => {
    const [togglePassword, setTogglePassword] = useState(true);

    const handleEnter = (evt) => {
        if (evt.key === "Enter") {
            if (typeof onKeyDown === "function") {
                onKeyDown();
            }
        }
    };

    const handleChange = (evt) => {
        if (typeof onChange === "function") {
            onChange(evt.target.id, evt.target.value);
        }
    };

    const handleBlur = (evt) => {
        if (typeof onBlur == "function") {
            onBlur(evt.target.id, evt.target.value);
        }
    };

    const hasError = () =>
        required?.hasOwnProperty("password") && required.password.error;

    function renderError() {
        if (!hasError()) return;
        let errorMsg = required?.password?.errorMsg || "Este campo é obrigatório";

        return <div className="text-xs text-danger-text">{errorMsg}</div>;
    }

    return (
        <>
            {label && (
                <div className="flex relative">
                    <label htmlFor={id}>
                        <FieldLabel className={`${required ? "ml-4" : ""}`}>
                            {label || ""}
                        </FieldLabel>
                    </label>
                    {required && (
                        <FontAwesomeIcon icon={faAsterisk} width="10" height="10" color="red" className="self-start absolute"/>
                    )}
                    {hint && (
                        <>
                            <TooltipComponent
                                content={
                                    <div className="text-xs z-20 max-w-75">{hint}</div>
                                }
                                asChild
                            >
                                <FontAwesomeIcon icon={faInfoCircle} width="16" height="16" color="blue" className="self-start ml-2" tabIndex={-1} />
                            </TooltipComponent>
                        </>
                    )}
                </div>
            )}

            <div className="relative">
                <input
                    required
                    id={id || "password"}
                    value={value}
                    placeholder="•••••••••"
                    onKeyDown={handleEnter}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={maxLength || ""}
                    type={togglePassword ? "password" : "text"}
                    className={`border bg-input text-content placeholder:text-content-muted ${hasError() ? "border-danger focus-visible:ring-danger" : "border-input-border focus-visible:ring-focus"
                        } text-sm rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:border-focus block w-full p-2`}
                />
                {showTogglePassword && (
                    <button
                        type="button"
                        aria-label={togglePassword ? "Mostrar senha" : "Ocultar senha"}
                        className="right-2 top-1 absolute inset-y-0 flex items-center cursor-pointer h-[75%] rounded text-content-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        onClick={() => {
                            setTogglePassword(!togglePassword);
                        }}
                    >
                        <FontAwesomeIcon icon={togglePassword ? faEye : faEyeSlash} width="20" height="20" />
                    </button>
                )}
            </div>
            {renderError()}
        </>
    );
};
export default InputPassword;
