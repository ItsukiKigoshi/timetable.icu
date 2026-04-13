import { useEffect, useRef } from "react";
import { defaultLang } from "@/lib/translation/ui";
import { getTranslations } from "@/lib/translation/utils";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: React.ReactNode;
	lang: string;
}

export default function Modal({
	isOpen,
	onClose,
	title,
	children,
	lang = defaultLang,
}: ModalProps) {
	const t = getTranslations(lang);
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
					<div className="px-6 py-4 flex justify-center items-center bg-base-100 shrink-0 relative">
						<h3 className="font-bold text-lg truncate w-full text-center px-4">
							{title}
						</h3>
					</div>
				)}

				{/*コンテンツ*/}
				<div className="px-4 overflow-y-auto flex-1 custom-scrollbar">
					{children}
				</div>

				{/* 閉じるボタン */}
				<div className="py-4 px-4">
					<button className="btn btn-block" type="button" onClick={onClose}>
						{t("meta.close")}
					</button>
				</div>
			</div>

			<form method="dialog" className="modal-backdrop">
				<button type="button" onClick={onClose}>
					close
				</button>
			</form>
		</dialog>
	);
}
