import type React from "react";
import { useEffect, useState } from "react";
import { PERIODS, SELECTABLE_DAYS } from "@/constants/time.ts";
import type { Course } from "@/db/schema";
import { useTimetable } from "@/lib/timetable/hooks.ts";
import { LanguageProvider } from "@/lib/translation/context";
import { createTranslationHelper } from "@/lib/translation/utils.ts";

interface CourseEditorProps {
	mode: "create" | "edit";
	lang: string;
	targetId?: string;
	initialData?: any;
	user: any;
	selectedYear: number;
	selectedTerm: string;
}

const CourseEditor = ({
	mode,
	lang,
	targetId,
	initialData,
	user,
	selectedYear,
	selectedTerm,
}: CourseEditorProps) => {
	const { t, l } = createTranslationHelper(lang);

	const [isMounted, setIsMounted] = useState(false);

	const { courses, saveCustomCourse } = useTimetable({
		user,
		selectedYear,
		selectedTerm,
	});

	const normalizeInitialData = (data: any) => ({
		id: data?.id || undefined,
		title: data?.title || data?.titleJa || "",
		instructor: data?.instructor || data?.instructorJa || "",
		units: data?.units ?? 0,
		memo: data?.memo || "",
		room: data?.room || "",
		colorCustom: data?.colorCustom || null,
		year: data?.year || selectedYear,
		term: data?.term || selectedTerm,
		schedules: (data?.schedules || []).map((s: any) => ({
			...s,
			id: s.id || `temp-sched-${Math.random().toString(36).substr(2, 9)}`,
		})),
	});

	// 1. 初期化フラグ: 編集モードでデータが来るまでは false
	const [isInitialized, setIsInitialized] = useState(
		mode === "create" || !!initialData,
	);

	// 2. フォームデータ
	const [formData, setFormData] = useState(() => {
		if (initialData) {
			return normalizeInitialData(initialData);
		}
		return normalizeInitialData(null);
	});

	const [isSubmitting, setIsSubmitting] = useState(false);

	// マウント時とデータ取得時の同期
	useEffect(() => {
		setIsMounted(true);

		if (isInitialized) return;

		let foundData = null;
		if (initialData) {
			foundData = initialData;
		} else if (mode === "edit" && targetId && courses.length > 0) {
			foundData = courses.find((c) => String(c.id) === String(targetId));
		}
		if (foundData) {
			setFormData(normalizeInitialData(foundData));
			setIsInitialized(true);
		} else if (mode === "create") {
			setIsInitialized(true);
		}
	}, [initialData, courses, targetId, mode, isInitialized]);

	// --- ハンドラー ---
	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		if (!isInitialized) return;
		const { name, value } = e.target;
		if (!name) return;
		setFormData((prev) => ({
			...prev,
			[name]: name === "units" ? parseFloat(value) : value,
		}));
	};

	const toggleSchedule = (day: string, pLabel: string) => {
		if (!isInitialized) return;
		const periodData = PERIODS.find((p) => p.label === pLabel);
		if (!periodData) return;

		const isSelected = formData.schedules.some(
			(s: any) => s.dayOfWeek === day && s.period === pLabel,
		);

		if (isSelected) {
			setFormData((prev) => ({
				...prev,
				schedules: prev.schedules.filter(
					(s: any) => !(s.dayOfWeek === day && s.period === pLabel),
				),
			}));
		} else {
			const newSchedule = {
				id: `temp-sched-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				dayOfWeek: day,
				period: pLabel,
				startTime: periodData.start,
				endTime: periodData.end,
			};
			setFormData((prev) => ({
				...prev,
				schedules: [...prev.schedules, newSchedule],
			}));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isInitialized || isSubmitting) return;

		if (formData.schedules.length === 0) {
			alert(t("custom.alert.schedule.null"));
			return;
		}

		setIsSubmitting(true);
		try {
			const finalData = {
				...formData,
				year: selectedYear,
				term: selectedTerm as Course["term"],
			};

			await saveCustomCourse(finalData, mode);
			window.location.href = l("/timetable");
		} catch (error) {
			console.error(error);
			alert(t("custom.alert.save.failed"));
		} finally {
			setIsSubmitting(false);
		}
	};

	// --- ロード画面の判定 ---
	// 「ブラウザでJSがまだ動いていない(SSR/Hydration中)」または「編集データが準備できていない」場合
	if (!isMounted || (!isInitialized && mode === "edit")) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
				<span className="loading loading-spinner loading-lg text-primary"></span>
				<p className="text-sm opacity-60 animate-pulse">
					{t("custom.loading")}
				</p>
			</div>
		);
	}

	return (
		<LanguageProvider lang={lang}>
			<form
				onSubmit={handleSubmit}
				className="max-w-2xl mx-auto p-4 flex flex-col gap-6 pb-20"
			>
				<header>
					<h1 className="text-2xl font-bold">
						{mode === "create" ? t("custom.create") : t("custom.edit")}
					</h1>
				</header>

				<fieldset
					disabled={isSubmitting}
					className="flex flex-col gap-6 border-none p-0 m-0"
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* 科目名（必須） */}
						<div className="form-control">
							<label className="label font-bold">
								{t("custom.title")} ({t("custom.necessary")})
							</label>
							<input
								type="text"
								name="title"
								className="input input-bordered w-full"
								value={formData.title}
								onChange={handleChange}
								required
								autoComplete="off"
							/>
						</div>

						<div className="form-control">
							<label className="label font-bold">{t("custom.room")}</label>
							<input
								type="text"
								name="room"
								className="input input-bordered w-full"
								value={formData.room}
								onChange={handleChange}
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="form-control">
							<label className="label font-bold">
								{t("custom.instructor")}
							</label>
							<input
								type="text"
								name="instructor"
								className="input input-bordered w-full"
								value={formData.instructor}
								onChange={handleChange}
							/>
						</div>

						<div className="form-control">
							<label className="label font-bold">{t("custom.units")}</label>
							<select
								name="units"
								className="select select-bordered w-full"
								value={formData.units}
								onChange={handleChange}
							>
								<option value={0}>0</option>
								<option value={0.333}>1/3</option>
								{[1, 2, 3, 4, 5, 6].map((u) => (
									<option key={u} value={u}>
										{u}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="form-control">
						<label className="label font-bold">
							{t("custom.schedule")} ({t("custom.necessary")})
						</label>
						<div className="overflow-x-auto rounded-lg border border-base-300">
							<table className="table table-fixed w-full text-center">
								<thead>
									<tr className="bg-base-200">
										<th className="w-12 p-0"></th>
										{SELECTABLE_DAYS.map((d) => (
											<th key={d} className="p-2 text-xs">
												{d}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{PERIODS.map((p) => (
										<tr key={p.label}>
											<th className="bg-base-200/50 p-0 text-xs flex flex-col items-center justify-center h-10">
												<span className="text-[8px] font-normal opacity-50">
													{p.start}
												</span>
												<span>{p.label}</span>
											</th>
											{SELECTABLE_DAYS.map((day) => {
												const isSelected = formData.schedules.some(
													(s: any) =>
														s.dayOfWeek === day && s.period === p.label,
												);

												return (
													<td
														key={`${day}-${p.label}`}
														onClick={() => toggleSchedule(day, p.label)}
														className={`border border-base-300 cursor-pointer transition-colors p-0 h-10 ${
															isSelected ? "bg-primary" : "hover:bg-base-200"
														}`}
													>
														{isSelected && (
															<div className={"text-primary-content font-bold"}>
																✓
															</div>
														)}
													</td>
												);
											})}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					<div className="flex gap-2 mt-4">
						<button
							type="button"
							className="btn btn-ghost"
							onClick={() => window.history.back()}
							disabled={isSubmitting}
						>
							{t("custom.cancel")}
						</button>
						<button
							type="submit"
							className="btn btn-primary flex-1"
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<span className="loading loading-spinner"></span>
							) : (
								t("custom.save")
							)}
						</button>
					</div>
				</fieldset>
			</form>
		</LanguageProvider>
	);
};

export default CourseEditor;
