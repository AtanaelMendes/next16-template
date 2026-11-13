import { FieldLabel } from '@/components/ui/display/Typography';

const Fieldset = (props) => {

    return (
        <fieldset className={`flex items-center border bg-surface text-content text-sm ${props.borderStyle || "rounded-lg"} w-full pt-0 p-2 border-border ${props?.className}`}>
            <legend className="px-2">
                {props?.label && <FieldLabel>{props?.label || ""}</FieldLabel>}
            </legend>
            {props.children}
        </fieldset>
    );
}
export default Fieldset;