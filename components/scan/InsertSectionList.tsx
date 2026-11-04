import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { PilSection } from "@/db/schema";

/** Collapsible insert sections. Markdown is rendered without raw HTML (react-markdown default). */
export function InsertSectionList({ sections, openFirst = false }: { sections: PilSection[]; openFirst?: boolean }) {
  return (
    <div className="divide-y divide-line rounded-md border border-line bg-white">
      {sections.map((s, i) => (
        <details key={s.key} className="group" open={openFirst && i === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-base font-semibold text-ink">
            <span>
              {/^\d/.test(s.key) ? <span className="mr-2 text-ink-soft">{s.key}</span> : null}
              {s.title}
            </span>
            <span aria-hidden="true" className="text-brand-600 transition group-open:rotate-90">
              ›
            </span>
          </summary>
          <div className="px-4 pb-5 text-base leading-relaxed text-ink-soft [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_strong]:text-ink [&_table]:mt-2 [&_table]:w-full [&_td]:border [&_td]:border-line [&_td]:p-2 [&_th]:border [&_th]:border-line [&_th]:p-2 [&_th]:text-left [&_ul]:mt-2">
            <Markdown remarkPlugins={[remarkGfm]}>{s.body}</Markdown>
          </div>
        </details>
      ))}
    </div>
  );
}
