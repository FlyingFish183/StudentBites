"use client";

import { useState } from "react";

import Banner from "@/components/ui/Banner";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import RelationSelect from "./RelationSelect";
import {
  inputKindOf,
  toFormValue,
  type IAdminField,
  type IAdminModel,
  type IAdminRow,
} from "@/lib/admin";

interface IProps {
  model: IAdminModel;
  /** Có row là sửa, không có là thêm mới. */
  row: IAdminRow | null;
  saving: boolean;
  error: string;
  onSubmit: (data: Record<string, string>) => void;
  onCancel: () => void;
}

function initialState(
  model: IAdminModel,
  row: IAdminRow | null,
): Record<string, string> {
  const state: Record<string, string> = {};
  for (const f of model.fields) {
    if (f.readOnly) continue;
    state[f.name] = row ? toFormValue(f, row[f.name]) : "";
  }
  return state;
}

const inputCls =
  "w-full border-2 border-ink bg-panel px-2.5 py-2 text-[0.85rem] font-semibold " +
  "text-ink placeholder:font-normal placeholder:text-ink/30 focus:outline-none";

/** Form sinh thẳng từ metadata của bảng — không cần viết tay cho từng bảng. */
export default function RecordForm({
  model,
  row,
  saving,
  error,
  onSubmit,
  onCancel,
}: IProps) {
  const [values, setValues] = useState(() => initialState(model, row));
  const editable = model.fields.filter((f) => !f.readOnly);

  function set(name: string, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  function renderInput(f: IAdminField) {
    const kind = inputKindOf(f);
    const id = `f-${f.name}`;
    if (kind === "relation") {
      return (
        <RelationSelect
          id={id}
          modelName={f.relatedModel!}
          value={values[f.name] ?? ""}
          onChange={(v) => set(f.name, v)}
          className={inputCls}
        />
      );
    }
    if (f.isSecret) {
      return (
        <input
          id={id}
          type="password"
          autoComplete="new-password"
          className={inputCls}
          placeholder={row ? "để trống = giữ mật khẩu cũ" : "mật khẩu mới"}
          value={values[f.name] ?? ""}
          onChange={(e) => set(f.name, e.target.value)}
        />
      );
    }
    if (kind === "select") {
      return (
        <select
          id={id}
          className={inputCls}
          value={values[f.name] ?? ""}
          onChange={(e) => set(f.name, e.target.value)}
        >
          <option value="">— trống —</option>
          {(f.enumValues ?? []).map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      );
    }
    if (kind === "boolean") {
      return (
        <select
          id={id}
          className={inputCls}
          value={values[f.name] ?? ""}
          onChange={(e) => set(f.name, e.target.value)}
        >
          <option value="">— trống —</option>
          <option value="true">có</option>
          <option value="false">không</option>
        </select>
      );
    }
    if (kind === "textarea") {
      return (
        <textarea
          id={id}
          rows={2}
          className={inputCls}
          placeholder="ngăn cách bằng dấu phẩy"
          value={values[f.name] ?? ""}
          onChange={(e) => set(f.name, e.target.value)}
        />
      );
    }
    return (
      <input
        id={id}
        type={kind === "date" ? "date" : kind === "number" ? "number" : "text"}
        step={f.type === "Int" ? 1 : "any"}
        className={inputCls}
        value={values[f.name] ?? ""}
        onChange={(e) => set(f.name, e.target.value)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-2000 flex justify-end bg-ink/60">
      <div className="flex h-full w-full max-w-xl flex-col border-l-3 border-sign bg-enamel">
        <header className="flex shrink-0 items-center justify-between border-b-2 border-panel/15 bg-enamel-deep px-4 py-3">
          <div className="min-w-0">
            <p className="label text-panel/50">{model.label}</p>
            <h2 className="disp truncate text-[1.05rem] tracking-widest text-sign">
              {row ? `Sửa #${String(row[model.idField])}` : "Thêm mới"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Đóng"
            className="flex size-9 shrink-0 items-center justify-center border-2 border-panel/30 text-panel/70 hover:border-chili hover:text-chili"
          >
            <Icon name="close" className="size-4" />
          </button>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(values);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {editable.map((f) => (
                <div
                  key={f.name}
                  className={inputKindOf(f) === "textarea" ? "sm:col-span-2" : ""}
                >
                  <label
                    htmlFor={`f-${f.name}`}
                    className="label mb-1 block text-panel/70"
                  >
                    {f.name}
                    {f.isRequired && !f.hasDefault && (
                      <span className="text-chili"> *</span>
                    )}
                  </label>
                  {renderInput(f)}
                  <p className="mt-0.5 text-[0.6rem] text-panel/35">
                    {f.relatedModel ? `→ ${f.relatedModel}` : f.type}
                    {f.isList ? "[]" : ""}
                    {f.isRequired ? "" : " · cho phép trống"}
                  </p>
                </div>
              ))}
            </div>

            {model.fields.some((f) => f.isSecret) && (
              <p className="mt-4 text-[0.7rem] text-panel/45">
                Ô mật khẩu nhập <b className="text-panel/70">mật khẩu thật</b>,
                hệ thống tự băm bcrypt trước khi lưu. Bỏ trống thì giữ nguyên
                mật khẩu cũ.
              </p>
            )}
          </div>

          {error && (
            <div className="shrink-0 px-4">
              <Banner tone="critical">{error}</Banner>
            </div>
          )}

          <footer className="flex shrink-0 gap-3 border-t-2 border-panel/15 px-4 py-3">
            <Button type="submit" loading={saving} icon="check" full>
              {row ? "Lưu thay đổi" : "Tạo bản ghi"}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Huỷ
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
}
