import React from 'react';
import {SWATCHES} from "@/constants/config.ts";

interface ColorPickerProps {
  value: string | null;
  onChange: (color: string | null) => void;
  label?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label = "表示色" }) => {
  return (
      <div className="form-control w-full">
        {label && <label className="label font-bold text-sm">{label}</label>}

          {/* カラーパレット */}
          <div className="grid grid-cols-7 sm:grid-cols-8 gap-2">
            {/* リセットボタン（デフォルトに戻す） */}
            <button
                type="button"
                onClick={() => onChange(null)}
                className={`w-8 h-8 rounded border flex items-center justify-center transition-all active:scale-95 ${
                    value === null ? 'ring-2 ring-primary bg-base-300' : 'bg-base-200'
                }`}
                title="Reset to default"
            >
              <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
              </svg>
            </button>

            {/* スウォッチ一覧 */}
            {SWATCHES.map((hex) => (
                <button
                    key={hex}
                    type="button"
                    onClick={() => onChange(hex)}
                    className={`w-8 h-8 rounded border border-black/5 transition-all active:scale-90 ${
                        value === hex ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: hex }}
                    title={hex}
                />
            ))}
          </div>
      </div>
  );
};