import { faAsterisk, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FieldLabel } from "@/components/ui/display/Typography";
import { useEffect, useState } from "react";
import Select from "react-tailwindcss-select";
import { useAppContext } from "@/context/AppContext";
import http from "@/lib/http";
import "flag-icons/css/flag-icons.min.css";
import { cn } from "@/assets/utils";
import { TooltipComponent } from "@/components/ui/overlays/TooltipComponent";

const SelectPais = (props) => {
    const [paises, setPaises] = useState([]);
    const [options, setOptions] = useState([]);
    const { toast } = useAppContext();
    const [selectedOption, setSelectedOption] = useState(null);

    const handleChange = (evt) => {
        setSelectedOption(evt ? { value: evt.value, label: evt.label, abbrev: evt.abbrev } : null);

        if (typeof props.onChange == "function") {
            props.onChange(props.id, evt ? evt.value : null);
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
        let errorMsg = props?.required[props.id].errorMsg || "Este campo é obrigatório";

        return <div className="text-xs text-danger-text">{errorMsg}</div>;
    }

    useEffect(() => {
        if (props.init) {
            getPaises();
        }
    }, [props?.init, props?.value]);

    useEffect(() => {
        if (paises.length > 0) {
            setOptions(
                paises?.map((pais) => {
                    return {
                        value: pais.cdPais,
                        label: pais.nmPais.trim().toUpperCase(),
                        abbrev: pais.dsSiglaPais.toLowerCase(),
                    };
                })
            );
        }
    }, [paises]);

    useEffect(() => {
        //Se foi passado um valor para este campo
        if (props.value) {
            let todosPaises = { ...options };

            for (let [index, pais] of Object.entries(todosPaises)) {
                if (pais.value == props.value) {
                    setSelectedOption(pais);
                    break;
                }
            }
        }
    }, [options]);

    const getPaises = async () => {
        if (localStorage.getItem("paises")) {
            setPaises(JSON.parse(localStorage.getItem("paises")));
            return;
        }

        try {
            const response = await http.get("paises/paises");
            setPaises(response.data);
            localStorage.setItem("paises", JSON.stringify(response.data));
        } catch (error) {
            toast.error("Não foi possível carregar os paises.");
            console.error(error);
        }
    };

    return (
        <div className={`relative w-full`}>
            {props?.label && (
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
                            side="right"
                            content={<div className="max-w-[300px] text-xs">{props.hint}</div>}
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

            <div className="relative w-full">
                <Select
                    id={props.id}
                    value={selectedOption}
                    onChange={handleChange}
                    options={options}
                    isSearchable={true}
                    placeholder={"Selecione"}
                    noOptionsMessage={"Nenhum registro encontrado"}
                    searchInputPlaceholder={"Digite para filtrar"}
                    classNames={{
                        menuButton: ({ isDisabled }) =>
                            `flex text-sm text-content border ${
                                hasError() ? "border-danger" : "border-input-border"
                            } rounded-lg shadow-sm transition-all duration-300 focus:outline-none h-[36px] ${
                                isDisabled
                                    ? "bg-disabled text-disabled-content cursor-not-allowed"
                                    : "bg-input hover:border-content-muted focus:border-focus focus:ring focus:ring-focus/30"
                            } ${selectedOption && "pl-6"}`,
                        menu:
                            "absolute z-20 w-full bg-surface-secondary border border-border rounded py-1 mt-1.5 text-sm text-content shadow-lg",
                        list: "max-h-48 overflow-y-auto", // (opcional) limitar altura:
                    }}
                    isClearable={props.isClearable}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-2 flex items-center">
                    {selectedOption && (
                        <span className={`fi fi-${selectedOption.abbrev} h-4 w-4`}></span>
                    )}
                </div>
            </div>
            {renderError()}
            {props?.helperText && <div className="text-xs text-info-text absolute bottom-[-12px] right-0"> {props.helperText} </div>}
        </div>
    );
};

export default SelectPais;
