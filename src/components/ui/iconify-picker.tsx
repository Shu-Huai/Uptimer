"use client";

import { useState } from "react";

import { IconifyIcon } from "./iconify-icon";

type IconifyPickerProps = {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
};

const SEARCH_LIMIT = 120;

export function IconifyPicker({
  name,
  defaultValue = "material-symbols-light:19mp-rounded",
  placeholder = "例如：material-symbols-light:19mp-rounded",
}: IconifyPickerProps) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [panelOpen, setPanelOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [icons, setIcons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState("");

  async function performSearch(reset: boolean, queryValue = query, currentIcons = icons, currentOffset = offset) {
    const keyword = queryValue.trim();
    if (!keyword) {
      setIcons([]);
      setHasMore(false);
      setOffset(0);
      setError("");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const nextRequestOffset = reset ? 0 : currentOffset;
      const url = `https://api.iconify.design/search?query=${encodeURIComponent(keyword)}&limit=${SEARCH_LIMIT}&offset=${nextRequestOffset}`;
      const response = await fetch(url);
      const data = (await response.json()) as { icons?: unknown; total?: unknown };
      const list = Array.isArray(data.icons) ? data.icons.filter((item): item is string => typeof item === "string") : [];
      const nextIcons = reset ? list : [...currentIcons, ...list];
      const nextOffset = nextRequestOffset + list.length;

      setIcons(nextIcons);
      setOffset(nextOffset);
      if (typeof data.total === "number") {
        setHasMore(nextOffset < data.total);
      } else {
        setHasMore(list.length === SEARCH_LIMIT);
      }
    } catch {
      setError("搜索失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  }

  function clearSearch() {
    setQuery("");
    setIcons([]);
    setOffset(0);
    setHasMore(false);
    setError("");
  }

  function selectIcon(iconName: string) {
    setValue(iconName);
    setPanelOpen(false);
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={value} />

      <div className="up-soft-panel flex items-center gap-2 border-[#e7eef8] bg-[#f8fbff] px-3 py-2">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#4f6281]">
          <IconifyIcon icon={value} className="size-5" fallback="?" />
        </span>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="min-w-0 flex-1 truncate bg-transparent text-sm text-[#4f6281] outline-none"
          placeholder={placeholder}
          disabled={true}
        />
        <button
          type="button"
          onClick={() => setPanelOpen((prev) => !prev)}
          className="up-secondary-btn shrink-0 whitespace-nowrap px-3 py-1 text-xs font-semibold"
        >
          {panelOpen ? "收起" : "选择"}
        </button>
      </div>

      {panelOpen ? (
        <div className="up-overlay-surface rounded-2xl p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-[#2f3f59]">选择图标</p>
            <button type="button" onClick={() => setPanelOpen(false)} className="up-ghost-icon-btn">
              <IconifyIcon icon="solar:close-circle-outline" className="up-icon up-icon-lg" />
            </button>
          </div>

          <div className="mb-2 flex flex-col gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索图标，如 money / food / wallet"
              className="up-field w-full"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void performSearch(true, query, icons, offset);
                }
              }}
            />
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                className="up-primary-btn px-3 py-2 text-sm"
                onClick={() => void performSearch(true, query, icons, offset)}
                disabled={isLoading}
              >
                搜索
              </button>
              <button type="button" className="up-secondary-btn px-3 py-2 text-sm" onClick={clearSearch}>
                清空
              </button>
              <button type="button" className="up-secondary-btn px-3 py-2 text-sm" onClick={() => selectIcon("")}>
                不使用
              </button>
            </div>
          </div>

          <p className="mb-2 text-xs text-[#8fa0bb]">结果来自 Iconify Search API，每次最多显示 {SEARCH_LIMIT} 条</p>
          {error ? <p className="mb-2 text-xs text-[#e05c5c]">{error}</p> : null}

          <div className="up-soft-panel max-h-64 overflow-y-auto border-[#e7eef8] bg-[#fbfdff] p-2">
            {!isLoading && icons.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#98a1b3]">暂无结果</p>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {icons.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    className="up-list-item rounded-lg border-[#e6ebf2] bg-white p-2 hover:border-[#2a9df4]"
                    onClick={() => selectIcon(iconName)}
                  >
                    <span className="mb-1 flex justify-center text-[#2a9df4]">
                      <IconifyIcon icon={iconName} className="size-5" />
                    </span>
                    <span className="block truncate text-center text-[10px] text-[#8fa0bb]">{iconName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-[#8fa0bb]">已显示 {icons.length} 个</p>
            {hasMore ? (
              <button
                type="button"
                onClick={() => void performSearch(false, query, icons, offset)}
                className="up-secondary-btn px-3 py-1.5 text-xs"
                disabled={isLoading}
              >
                加载更多
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
