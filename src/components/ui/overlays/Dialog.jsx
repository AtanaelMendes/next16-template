import { useEffect, useState } from "react";
import InputTextArea from "../inputs/InputTextArea";
import Button from "@/components/ui/buttons/Button";
import { empty } from "@/assets/utils";
import { useAppContext } from "@/context/AppContext";

const Dialog = (props) => {
    const { toast } = useAppContext();
    const [description, setDescription] = useState("");

    const closeDialog = () => {
        if (typeof props.closeDialogCallback == "function") {
            props.closeDialogCallback();
        }

        props.setDialogControl(false);
    };

    const acceptDialog = () => {
        //validar regras
        if (!empty(props.textAreaMinLength) && description.length < props.textAreaMinLength) {
            toast.error(
                `A quantidade mínima de caracteres para o campo [${
                    props.textAreaLabel || "Motivo"
                }] é de ${props.textAreaMinLength} caracteres!`
            );
            return;
        }

        if (typeof props.confirmActionCallback == "function") {
            props.confirmActionCallback(description);
        }

        props.setDialogControl(false);
    };

    //Limpa o conteudo do textarea ao esconder a tela
    useEffect(() => {
        setDescription("");
    }, [props?.showDialog]);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={props?.title || "Dialogo"}
            className={`z-50 inset-0 w-full h-screen bg-black/50 items-center justify-center p-4 fixed ${
                props?.showDialog ? "flex" : "hidden"
            }`}
        >
            <div
                className={`${props?.hideTextArea ? "min-h-[150px]" : "min-h-[260px]"} w-full ${
                    props?.small ? "max-w-md" : "max-w-3xl"
                } bg-surface text-content border border-border m-auto relative rounded-lg shadow-xl`}
            >
                {/* {TITLE} */}
                <div
                    className={`z-50 w-full px-4 p-2 font-semibold border-b border-border text-primary-content bg-primary rounded-t-lg`}
                >
                    {props?.hideTextArea ? "Confirmar ação" : props?.title}
                </div>

                {/* CONTEUDO */}
                {!props?.hideTextArea && (
                    <div className={`z-50 px-4 pt-1 w-full pb-20`}>
                        <InputTextArea
                            rows="5"
                            maxLength={props?.maxLength || 200}
                            value={description}
                            id="confirm_description"
                            helperText={
                                props?.textAreaMinLength
                                    ? `Mínimo ${props.textAreaMinLength} caracteres`
                                    : ""
                            }
                            minLength={props?.textAreaMinLength || ""}
                            label={props?.textAreaLabel || "Motivo"}
                            onChange={(id, value) => setDescription(value)}
                        />
                    </div>
                )}

                {props?.hideTextArea && (
                    <div className={`z-50 w-full px-4 p-2 font-semibold text-content`}>
                        {props?.title || ""}
                    </div>
                )}

                {/* {BUTTONS} */}
                <div
                    className={`bottom-0 z-50 absolute w-full p-2 h-[46px] rounded-b-lg border-t bg-surface-secondary border-border text-right`}
                >
                    {props?.btnCancel && (
                        <Button
                            buttonType="danger"
                            outline
                            size="small"
                            className={"mr-4"}
                            onClick={closeDialog}
                        >
                            {props.btnCancel || "CANCELAR"}
                        </Button>
                    )}
                    <Button buttonType="success" size="small" onClick={acceptDialog}>
                        {props.btnAccept || "OK"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Dialog;
