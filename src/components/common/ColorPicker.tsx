import React from 'react';
import {SWATCHES} from "@/constants/config.ts";

interface ColorPickerProps {
  value: string | null;
  onChange: (color: string | null) => void;
  label?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label = "表示色" }) => {
  // '#'を除いた文字列を取得
  const hexValue = value ? value.replace('#', '') : "";

  const handleInputBlur = () => {
    // ドロップダウンを閉じるためのハック（activeElementを外す）
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 100);
  };

  return (
      <div className="form-control w-full">
        {label && <label className="label font-bold text-sm">{label}</label>}
        <div className="flex items-center join w-full">
          {/* 現在の色プレビュー */}
          <div className="flex items-center justify-center w-10 h-10 shrink-0 border border-base-300 rounded-l-md bg-base-100 border-r-0">
            <div
                className="w-6 h-6 rounded-full border border-black/10 shadow-sm"
                style={{ backgroundColor: value || "var(--color-primary, #570df8)" }}
            />
          </div>

          {/* ドロップダウン & 入力エリア */}
          <div className="dropdown dropdown-bottom dropdown-end flex-1">
            <div
                tabIndex={0}
                role="button"
                className="flex items-center h-10 px-3 bg-base-100 border border-base-300 rounded-r-md shadow-sm focus-within:border-primary transition-all"
            >
              <span className="text-xs opacity-30 font-mono mr-1.5">#</span>
              <input
                  type="text"
                  value={hexValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                      onChange(val ? `#${val}` : null);
                    }
                  }}
                  className="w-full bg-transparent border-none outline-none font-mono text-sm p-0 uppercase"
                  placeholder="DEFAULT"
              />
            </div>

            {/* カラーパレット内容 */}
            <div
                tabIndex={0}
                className="dropdown-content z-50 mt-1 p-3 bg-base-100 border border-base-300 rounded-md shadow-2xl w-72"
            >
              <div className="grid grid-cols-7 gap-2">
                {/* リセットボタン */}
                <button
                    type="button"
                    onClick={() => {
                      onChange(null);
                      handleInputBlur();
                    }}
                    className="w-8 h-8 rounded border flex items-center justify-center bg-base-200 hover:bg-base-300 transition-colors"
                >
                  <svg className="w-4 h-4 opacity-40" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>

                {/* 色ボタン一覧 */}
                {SWATCHES.map((hex) => (
                    <button
                        key={hex}
                        type="button"
                        onClick={() => {
                          onChange(hex);
                          handleInputBlur();
                        }}
                        className={`w-8 h-8 rounded border border-black/5 transition-transform active:scale-90 ${
                            value === hex ? 'ring-2 ring-primary ring-offset-1' : ''
                        }`}
                        style={{ backgroundColor: hex }}
                        title={hex}
                    />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};