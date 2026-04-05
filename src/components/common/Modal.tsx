import {useEffect, useRef} from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {


    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen]);

    return (
        <dialog
            ref={dialogRef}
            className="modal modal-bottom sm:modal-middle"
            onClose={onClose}
        >
            {/* モーダル本体 */}
            <div className="modal-box p-0 flex flex-col max-h-[90vh] sm:max-h-[85vh] relative overflow-hidden">
                {/* タイトル */}
                {title && (
                    <div className="px-6 py-4 flex justify-between items-center bg-base-100 shrink-0">
                        <h3 className="font-bold text-lg truncate pr-8">
                            {title}
                        </h3>
                    </div>)}


                {/*コンテンツ*/}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {children}
                </div>

                {/* 閉じるボタン */}
                <div className="p-4">
                    <button className="btn btn-block" onClick={onClose}>閉じる</button>
                </div>
            </div>

            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
}