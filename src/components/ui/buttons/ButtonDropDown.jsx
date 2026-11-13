import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useRef, useEffect } from "react";

const ButtonDropDown = ({ id, label, small, type, block, className, items }) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    const btnType = {
        primary: `bg-primary text-primary-content border border-primary hover:bg-primary-hover focus:ring-focus`,
        secondary: `bg-surface-secondary text-content border border-border hover:bg-hover focus:ring-focus`,
        success: `bg-success text-success-content border border-success hover:bg-success-hover focus:ring-success`,
        danger: `bg-danger text-danger-content border border-danger hover:bg-danger-hover focus:ring-danger`,
        warning: `bg-warning text-warning-content border border-warning hover:bg-warning-hover focus:ring-warning`,
    }

    const classButton = () => {
        let btnClass = "relative focus:outline-none font-medium text-sm focus:ring-4 rounded ";
        btnClass += small ? "!py-1.5 !px-2 " : "!py-2 !px-4 ";
        btnClass += block ? "w-full " : "w-fit ";
        btnClass += className ? className + " " : "";
        btnClass += btnType[type || 'primary'];

        return btnClass;
    }

    // Alterna a visibilidade do menu
    const toggleMenu = () => {
        setIsOpen((prev) => !prev);
    };

    // Fecha o menu se clicar fora dele
    const handleClickOutside = (event) => {
        if (
            menuRef.current &&
            !menuRef.current.contains(event.target) &&
            !buttonRef.current.contains(event.target)
        ) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        // Adiciona o listener de evento para detectar cliques fora do menu
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            // Remove o listener de evento quando o componente é desmontado
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative w-fit">
            <button
                type="button"
                ref={buttonRef}
                onClick={toggleMenu}
                className={classButton()}
                id={id || "dropdownButton"}
            >
                <div className={"flex justify-between"}>
                    <div className={"flex justify-center w-full"}>
                        <span>{label || ""}</span>
                    </div>
                    <div className={"w-7.5 flex justify-center"}>
                        <FontAwesomeIcon className={`ease-in-out duration-300 ${isOpen ? "rotate-180" : ""}`} icon={faChevronDown} width="14" height="14" />
                    </div>
                </div>
            </button>

            {isOpen && (<div id="dropdownChildren" ref={menuRef} className={`z-10 bg-surface-secondary border border-border rounded shadow-lg absolute w-fit min-w-25 max-w-50 mt-1`}>
                <ul className="space-y-1 self-end block p-1 w-full divide-y divide-border">
                    {items.map((item, index) => (
                        <li key={index} className={`
                            self-end px-2 py-1 text-content
                            ${item.hoverClassName || "hover:bg-hover hover:text-primary-text hover:rounded cursor-pointer"}
                            transition-colors duration-300 ease-in-out`}>
                            <div className={`${item.itemClassName || ""} flex items-center p-1`} onClick={() => { item.action(); setIsOpen(false); }} >
                                {item.icon && <FontAwesomeIcon icon={item.icon} className='mr-2' width="16" height="16" />}
                                <span className='text-sm'>{item.label}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            )}
        </div>
    );
}

export default ButtonDropDown;