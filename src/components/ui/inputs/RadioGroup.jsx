const RadioGroup = ({ active, name, items, onChange, type }) => {
    const commonClasses = (` inline-flex items-center w-fit px-2 py-1 text-content-secondary bg-surface border border-border cursor-pointer transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-focus peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background`
    );

    const typeClasses = {
        primary: (_) => {return 'peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-content hover:bg-hover hover:text-primary'},
        danger: (_) => {return 'peer-checked:border-danger peer-checked:bg-danger peer-checked:text-danger-content hover:bg-danger-subtle hover:text-danger-subtle-content'}
    }

    const renderRadioGroup = () => {
        if (!items) {
            return 'Nenhum item recebido';
        }

        const handleChange = (id, value, checked) => {
            if (typeof onChange === "function") {
                onChange(id, value, checked);
            }
        };

        const ultimoItem = items.length - 1;
        return items?.map((item, index) => {
            return (
                <li key={index}>
                    <input type="radio" id={`${item.id}`} name={`${name}`} onChange={handleChange} checked={item?.checked ||  false} className="sr-only peer" />
                    <label
                        htmlFor={`${item.id}`}
                        onClick={() => { item?.action(item.value) }}
                        className={`${typeClasses[type || "primary"](item?.color || "primary")} ${commonClasses} ${index === 0 ? "rounded-l-md" : (index == ultimoItem ? "rounded-r-md" : "")} `}
                    >
                        <div className="text-sm font-semibold">
                            {item.label}
                        </div>
                    </label>
                </li >
            )
        });
    };

    return (
        <div className={`${active ? 'block' : 'hidden'}`}>
            <div className={"flex justify-center"}>
                <ul className="flex">
                    {renderRadioGroup()}
                </ul>
            </div>
        </div>
    );
}

export default RadioGroup;
