interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    // 表示中ではない場合は何もレンダリングしない（DOMをクリーンに保つ）
    if (!isOpen) return null;

    return (
        <div className="modal modal-open modal-bottom sm:modal-middle z-100">
            {/* モーダル本体 */}
            <div className="modal-box p-0 flex flex-col max-h-[90vh] sm:max-h-[85vh] relative overflow-hidden">
                {/* 右上の閉じるボタン */}
                <div className="px-6 py-4 flex justify-between items-center bg-base-100 shrink-0">
                    <h3 className="font-bold text-lg truncate pr-8">
                        {title}
                    </h3>
                    <button
                        className="btn btn-sm btn-circle btn-ghost absolute right-2 top-3"
                        onClick={onClose}
                    >✕</button>
                </div>

                {/*コンテンツ*/}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {children}
                </div>

                {/* 閉じるボタン */}
                <div className="p-4 bg-base-100 shrink-0">
                    <button className="btn btn-block btn-neutral" onClick={onClose}>
                        閉じる
                    </button>
                </div>
            </div>

            {/* 背景部分：ここをクリックすると onClose が呼ばれる */}
            <div
                className="modal-backdrop bg-black/60 fixed inset-0 cursor-pointer"
                onClick={onClose}
            />
        </div>
    );
}