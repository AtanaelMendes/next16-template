import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FieldLabel } from "@/components/ui/display/Typography";
import { useEffect, useState } from "react";
import Select from "react-tailwindcss-select";
import { TooltipComponent } from "@/components/ui/overlays/TooltipComponent";
import { cn } from "@/assets/utils";

const Select2 = (props) => {
    const [options, setOptions] = useState([]);
    const [selectedOption, setSelectedOption] = useState({});

    const handleChange = (evt) => {
        if (!evt) {
            setSelectedOption({});
            return;
        }

        setSelectedOption({ value: evt.value, label: evt.label });

        if (typeof props.onChange == "function") {
            props.onChange(props.id, evt.value);
        }
    };

    function hasError() {
        return (
            props?.required &&
            props?.required.hasOwnProperty(props.id) &&
            props.required[props.id].error
        );
    }

    function renderError() {
        if (!hasError()) return;
        let errorMsg =
            props?.required[props.id].errorMsg || "Este campo é obrigatório";

        return <div className="text-xs text-danger-text">{errorMsg}</div>;
    }

    useEffect(() => {
        if (props.clearSelectdValue) {
            setSelectedOption({});
        }
    }, [props?.clearSelectdValue]);

    useEffect(() => {
        if (props.options.length > 0) {
            setOptions(
                props.options?.map((option) => {
                    return {
                        value: option.value,
                        label: option.label.trim(),
                    };
                })
            );
        }
    }, [props?.options]);

    useEffect(() => {
        //Se foi passado um valor para este campo
        if (props.value) {
            let allOptions = { ...options };

            for (let [index, option] of Object.entries(allOptions)) {
                if (option.value == props.value) {
                    setSelectedOption(option);
                    break;
                }
            }
        }
    }, [options, props?.value]);

    return (
        <div className="w-full relative">
            {props?.label && <div className='flex absolute -top-2.25 left-2 w-fit z-10 text-xs px-0.5 rounded-md mb-0 pb-0 text-nowrap before:bg-surface before:top-0.5 before:left-0 before:absolute before:w-full before:h-3 before:-z-10 before:content-[""] before:rounded-lg'>
                <label htmlFor={props.id} className="inline-flex">
                    <FieldLabel className={cn(props?.required ? 'ml-4' : 'ml-0 mb-0 pb-0', 'text-content-muted')}>
                        {props?.label || ""}
                    </FieldLabel>
                    {props?.hint && (
                        <>
                            <TooltipComponent
                                content={
                                    <div className="text-xs z-20 max-w-75">{props.hint}</div>
                                }
                                asChild
                            >
                                <FontAwesomeIcon
                                    icon={faInfoCircle}
                                    width="16"
                                    height="16"
                                    color="blue"
                                    className="self-start ml-2"
                                    tabIndex={-1}
                                />
                            </TooltipComponent>
                        </>
                    )}
                </label>
            </div>}

            <div className={`rounded border ${hasError() ? "border-danger" : "border-border"} ${props.className || ""}`}>
                <Select
                    id={props.id}
                    options={options}
                    isClearable={true}
                    isSearchable={true}
                    value={selectedOption}
                    onChange={handleChange}
                    placeholder={"Selecione"}
                    searchInputPlaceholder={"Digite para filtrar"}
                    noOptionsMessage={"Nenhum registro encontrado"}
                    // <- HELP - 553263: Estavam passando className (singular), mas o componente espera classNames (plural) para sobrescrever as partes internas.
                    classNames={{
                        menuButton: ({ isDisabled }) =>
                            `flex text-sm text-content border border-input-border rounded-lg shadow-sm transition-all duration-300 focus:outline-none h-[36px] ${isDisabled
                                ? "bg-disabled text-disabled-content cursor-not-allowed"
                                : "bg-input hover:border-content-muted focus:border-focus focus:ring focus:ring-focus/30"
                            }`,
                        menu:
                            "absolute z-20 w-full bg-surface-secondary border border-border rounded py-1 mt-1.5 text-sm text-content shadow-lg",
                        list: "max-h-64 overflow-y-auto",
                    }}
                />
            </div>
            {renderError()}
            {props?.helperText && <div className="text-xs text-info-text absolute -bottom-3 right-0"> {props.helperText} </div>}
        </div>
    );
};

export default Select2;
