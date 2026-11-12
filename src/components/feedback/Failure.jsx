import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFaceSadCry } from "@fortawesome/free-regular-svg-icons";

const Failure = ({ active, message, className }) => {
    return (
        <div className={`flex absolute w-full h-full bg-white z-999 top-0 left-0 items-center justify-center ${active ? "" : "hidden"} ${className}`}>
            <div className="h-50 w-45 relative text-center">
                <FontAwesomeIcon icon={faFaceSadCry} width="60" height="60" className="text-red-600"/>
                <span className="-bottom-5 left-1/2 -translate-x-1/2 absolute font-medium">{message || "Não foi possível realizar carregar os dados, tente atualizar a aba."}</span>
            </div>
        </div>
    );
}
export default Failure;