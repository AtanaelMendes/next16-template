import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Button from "@/components/ui/buttons/Button";

const Confirm = ({ visible, setVisible, iconSize, primaryText, secondaryText, btnAccept, btnDecline, cancelActionCallback, confirmActionCallback }) => {
    const decline = () => {
        if (typeof cancelActionCallback == "function") {
            cancelActionCallback();
        }

        setVisible(false);
    };

    const accept = () => {
        if (typeof confirmActionCallback == "function") {
            confirmActionCallback();
        }

        setVisible(false);
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={primaryText || "Confirmação"}
            className={`z-50 inset-0 w-full h-screen bg-black/50 items-center justify-center p-4 fixed ${visible ? "flex" : "hidden"}`}
        >
            <div className="w-full max-w-md py-2 bg-surface text-content border border-border rounded-lg shadow-xl">
                <div className="flex text-warning mr-4 justify-center py-2">
                    <FontAwesomeIcon icon={faTriangleExclamation} width={iconSize || "45"} height={iconSize || "45"} />
                </div>
                <div className="z-50 w-full px-4 p-2 text-center text-base text-content">
                    {primaryText || ""}
                </div>
                <div className="z-50 w-full px-4 p-2 text-content-muted text-center text-sm">
                    {secondaryText || ""}
                </div>
                <div className="z-50 w-full p-2 text-center">
                    {btnDecline && (
                        <Button
                            buttonType="primary"
                            outline
                            size="small"
                            className={"mr-4"}
                            onClick={decline}
                        >
                            {btnDecline}
                        </Button>
                    )}
                    <Button buttonType="primary" size="small" onClick={accept}>
                        {btnAccept || "Sim"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Confirm;
