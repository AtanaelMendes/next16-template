'use client';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FieldLabel } from "@/components/ui/display/Typography";
import { useEffect, useState } from "react";
import Select from "react-tailwindcss-select";
import { useAppContext } from "@/context/AppContext";
import http from "@/lib/http";
import { cn } from "@/assets/utils";
import { TooltipComponent } from "@/components/ui/overlays/TooltipComponent";

const SelectCidadeFilter = ({onChange, id, required, value, label, hint, className, helperText, placeholder }) => {
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [selectedOption, setSelectedOption] = useState(null);
    const { user } = useAppContext();
    const [cidades, setCidades] = useState([]);
    const [options, setOptions] = useState([]);

    const handleChange = (evt) => {
        setSelectedOption(evt ? { value: evt.value, label: evt.label } : null);
    
        if (typeof onChange === "function") {
            evt ? onChange(id, evt.value) : onChange(id, null);
        }
    };

    function hasError() {
        return (
            required &&
            required.hasOwnProperty(id) &&
            required[id].error
        );
    }

    function renderError() {
        if (!hasError()) return;
        let errorMsg = required[id].errorMsg || "Este campo é obrigatório";

        return <div className="text-xs text-danger">{errorMsg}</div>;
    }
    
    const getCidades = async () => {
        setIsLoadingData(true);

        try {
            const response = await http.get(`cidades/filtro-cidade/${user.user_sip}`);

            if (response.data.length > 0) {
                setCidades(response.data);
            }
        } catch (error) {
            setIsLoadingData(false);
            console.error(error);
        }
    };

    useEffect(() => {
        getCidades();
    }, []);

    useEffect(() => {
        setOptions(
            cidades?.map((cidade) => {
                return {
                    value: cidade.CD_EMPRESA,
                    label: `${cidade.CD_UF} - ${cidade.NM_EMPRESA_MENU.trim()}`, 
                };
            })
        );
    }, [cidades]);

    useEffect(() => {
        //Se foi passado um valor para este campo
        if (value) {
            let todasCidades = { ...options };
            for (let [index, cidade] of Object.entries(todasCidades)) {
                if (cidade.value === value) {
                    setSelectedOption(cidade);
                    break;
                }
            }
        }
        

        setTimeout(() => {
            setIsLoadingData(false);
        }, 500);
    }, [options, value]);

    return (
        <div className="w-full relative">
            {label && <div className='flex absolute top-[-9px] left-2 w-fit z-10 text-xs px-0.5 rounded-md mb-0 pb-0 text-nowrap before:bg-surface before:top-0.5 before:left-0 before:absolute before:w-full before:h-[12px] before:-z-10 before:content-[""] before:rounded-lg'>
                <label htmlFor={id} className="inline-flex">
                    <FieldLabel className={cn(required ? 'ml-4' : 'ml-0 mb-0 pb-0', 'text-content-muted')}>
                        {label || ""}
                    </FieldLabel>
                    {hint && (
                        <>
                            <TooltipComponent
                                content={<div className="text-xs z-20 max-w-[300px]">{hint}</div>}
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
            <div className={`rounded border ${hasError() ? "border-danger" : "border-border"} ${className || ""}`}>
                <Select
                    id={id}
                    value={selectedOption}
                    onChange={handleChange}
                    options={options}
                    isSearchable={true}
                    placeholder={isLoadingData ? "Carregando..." : (placeholder || "Selecione")}
                    isClearable={true}
                    loading={isLoadingData || false}
                    noOptionsMessage={"Nenhum registro encontrado"}
                    searchInputPlaceholder={"Digite para filtrar"}
                    classNames={{
                        menuButton: ({ isDisabled }) =>
                            `flex text-sm text-content border border-input-border rounded-lg shadow-sm transition-all duration-300 focus:outline-none h-[34px] ${
                                isDisabled
                                    ? "bg-disabled text-disabled-content cursor-not-allowed"
                                    : "bg-input hover:border-content-muted focus:border-focus focus:ring focus:ring-focus/30"
                            }`,
                        menu: "absolute z-20 w-full bg-surface-secondary border border-border rounded py-1 mt-1.5 text-sm text-content shadow-lg",
                        list: "max-h-48 overflow-y-auto", // (opcional) limitar altura:
                    }}
                />
            </div>
            {helperText && <div className="text-xs text-info absolute bottom-[-12px] right-0"> {helperText} </div>}
            {renderError()}
        </div>
    );
};

export default SelectCidadeFilter;
