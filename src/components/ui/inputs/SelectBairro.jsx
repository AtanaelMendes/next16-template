import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAsterisk, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FieldLabel } from "@/components/ui/display/Typography";
import { useEffect, useState } from "react";
import Select from "react-tailwindcss-select";

import { cn, empty } from "@/assets/utils";
import { TooltipComponent } from "@/components/ui/overlays/TooltipComponent";

const SelectBairro = (props) => {
    const [bairros, setBairros] = useState([]);
    const [options, setOptions] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [selectedOption, setSelectedOption] = useState({});

    const handleChange = (evt) => {
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
        if (props?.options) {
            setBairros(props.options);
        }
    }, [props.options]);

    useEffect(() => {
        if (bairros.length > 0) {
            setIsLoadingData(true);

            setOptions(
                bairros?.map((bairro) => {
                    return {
                        value: bairro.NM_BAIRRO,
                        label: bairro.NM_BAIRRO,
                    };
                })
            );
        }

        setIsLoadingData(false);
    }, [bairros]);

    useEffect(() => {
        if (!empty(props.value) && typeof props.value === "string") {
            setSelectedOption({
                value: props.value,
                label: props.value,
            });
            return;
        }

        setSelectedOption(props.value || null);
    }, [props.value]);

    return (
        <div className="relative w-full">
            {props.label && (
                <div className='flex absolute top-[-9px] left-2 w-fit z-10 text-xs px-0.5 rounded-md mb-0 pb-0 text-nowrap before:bg-surface before:top-0.5 before:left-0 before:absolute before:w-full before:h-[12px] before:-z-10 before:content-[""] before:rounded-lg'>
                    <label htmlFor={props.id}>
                        <FieldLabel className={cn(props?.required ? 'ml-4' : 'ml-0 mb-0 pb-0', 'text-content-muted')}>
                            {props.label || ""}
                        </FieldLabel>
                    </label>
                    {props?.required && (
                        <FontAwesomeIcon
                            icon={faAsterisk}
                            width="10"
                            height="10"
                            color="red"
                            className="self-start absolute"
                        />
                    )}
                    {props?.hint && (
                        <TooltipComponent
                            content={
                                <div className="text-xs z-20 max-w-[300px]">
                                    {props?.hint}
                                </div>
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
                    )}
                </div>
            )}
            <div className={`rounded-lg border ${hasError() ? "border-danger" : "border-border"}`}>
                <Select
                    id={props.id}
                    loading={isLoadingData || false}
                    value={selectedOption}
                    onChange={handleChange}
                    options={options}
                    isSearchable={true}
                    placeholder={"Selecione"}
                    noOptionsMessage={"Nenhum registro encontrado"}
                    searchInputPlaceholder={"Digite para filtrar"}
					classNames={{
                        menuButton: ({ isDisabled }) =>
                            `flex text-sm text-content border border-input-border rounded-lg shadow-sm transition-all duration-300 focus:outline-none h-[36px] ${isDisabled
                                ? "bg-disabled text-disabled-content cursor-not-allowed"
                                : "bg-input hover:border-content-muted focus:border-focus focus:ring focus:ring-focus/30"
                            }`,
                        menu:
                            "absolute z-20 w-full bg-surface-secondary border border-border rounded py-1 mt-1.5 text-sm text-content shadow-lg",
                        list: "max-h-48 overflow-y-auto", // (opcional) limitar altura:
                    }}
                />
            </div>
            {renderError()}
            {props?.helperText && <div className="text-xs text-info-text absolute bottom-[-12px] right-0"> {props.helperText} </div>}
        </div>
    );
};

export default SelectBairro;
