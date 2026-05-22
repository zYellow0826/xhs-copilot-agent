"use client";

import { useState } from "react";

export type FormValues = {
  shop_type: string;
  product_info: string;
  target_audience: string;
  style_preference: "种草" | "测评" | "教程" | "故事";
  extra_context?: string;
};

const STYLES: FormValues["style_preference"][] = ["种草", "测评", "教程", "故事"];

export default function GenerationForm({
  onSubmit,
  disabled,
}: {
  onSubmit: (values: FormValues) => void;
  disabled?: boolean;
}) {
  const [values, setValues] = useState<FormValues>({
    shop_type: "",
    product_info: "",
    target_audience: "",
    style_preference: "种草",
    extra_context: "",
  });

  function update<K extends keyof FormValues>(key: K, v: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    onSubmit({
      ...values,
      extra_context: values.extra_context?.trim() || undefined,
    });
  }

  const inputCls =
    "w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500 disabled:bg-neutral-50";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="店铺类型" hint="例如：美甲店、咖啡馆、宠物美容">
        <input
          required
          className={inputCls}
          value={values.shop_type}
          onChange={(e) => update("shop_type", e.target.value)}
          disabled={disabled}
        />
      </Field>

      <Field label="商品 / 服务描述">
        <textarea
          required
          rows={3}
          className={inputCls}
          value={values.product_info}
          onChange={(e) => update("product_info", e.target.value)}
          disabled={disabled}
        />
      </Field>

      <Field label="目标人群画像">
        <textarea
          required
          rows={2}
          className={inputCls}
          value={values.target_audience}
          onChange={(e) => update("target_audience", e.target.value)}
          disabled={disabled}
        />
      </Field>

      <Field label="风格偏好">
        <div className="flex gap-2">
          {STYLES.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => update("style_preference", s)}
              disabled={disabled}
              className={`rounded border px-3 py-1.5 text-sm transition ${
                values.style_preference === s
                  ? "border-xhs-pink bg-xhs-pink text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>

      <Field label="补充信息（可选）" hint="特殊活动、地理位置、风格要求等">
        <textarea
          rows={2}
          className={inputCls}
          value={values.extra_context}
          onChange={(e) => update("extra_context", e.target.value)}
          disabled={disabled}
        />
      </Field>

      <button
        type="submit"
        disabled={disabled}
        className="rounded bg-xhs-pink px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {disabled ? "生成中…" : "生成笔记"}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-neutral-700">
        {label}
        {hint && <span className="ml-2 text-xs font-normal text-neutral-400">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
