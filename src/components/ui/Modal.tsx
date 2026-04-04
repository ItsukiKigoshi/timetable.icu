interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    // 表示中ではない場合は何もレンダリングしない（DOMをクリーンに保つ）
    if (!isOpen) return null;

    return (
        <div className="modal modal-open modal-bottom sm:modal-middle z-100">
            {/* モーダル本体 */}
            <div className="modal-box relative">
                {/* 右上の閉じるボタン */}
                <button
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={onClose}
                >✕</button>

                {title && (
                    <h3 className="font-bold text-xl mb-4 border-b pb-2">
                        {title}
                    </h3>
                )}

                <div className="py-2">
                    {children}
                </div>

                {/* 下部の閉じるボタン（任意） */}
                <div className="modal-action">
                    <button className="btn btn-block" onClick={onClose}>
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