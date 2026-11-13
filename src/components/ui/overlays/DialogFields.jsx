import Button from '@/components/ui/buttons/Button';

const DialogFields = ({title, children, visible, type, onCancel, onSave, disabled, labelConfirm}) => {
    const classType = {
        primary: "bg-primary text-primary-content",
        success: "bg-success text-success-content",
        warning: "bg-warning text-warning-content",
        danger: "bg-danger text-danger-content"
    };

    const handleSave = () => {
        if (typeof onSave === "function") {
            onSave();
        }
    }

    const handleCancel = () => {
        if (typeof onCancel === "function") {
            onCancel();
        }
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={title || "Dialogo"}
            className={`z-50 inset-0 w-full h-screen bg-black/50 items-center justify-center p-4 fixed ${visible ? "flex" : "hidden"}`}
        >
            <div className="w-full max-w-lg bg-surface text-content border border-border rounded-md mx-auto my-auto flex flex-col shadow-xl">
                <div className={`${classType[type] || "bg-surface-muted text-content"} p-2 rounded-t-md font-semibold`}>
                    {title || "RHbrasil"}
                </div>
                <div className="p-2 flex flex-col gap-y-1">
                    {children}
                </div>
                <div className="p-2 flex w-full justify-end">
                    <Button size={"small"} buttonType="danger" outline onClick={handleCancel}>
                        Cancelar
                    </Button>
                    <Button size={"small"} buttonType="success" className="ml-1" disabled={disabled} onClick={handleSave}>
                        {labelConfirm || "OK"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
export default DialogFields;