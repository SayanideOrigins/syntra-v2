import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownProps {
  text: string;
  fontSize?: number;
}

/**
 * Renders AI message text as Markdown with GitHub-flavored extensions
 * (tables, task lists, strikethrough, autolinks). Styled with the app's
 * design tokens — no raw colors here.
 */
export function Markdown({ text, fontSize = 13 }: MarkdownProps) {
  return (
    <div
      className="markdown-body break-words"
      style={{ fontSize: `${fontSize}px`, lineHeight: 1.55 }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
          h1: ({ children }) => <h1 className="font-head font-bold text-[1.35em] mt-2 mb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="font-head font-bold text-[1.2em] mt-2 mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="font-head font-semibold text-[1.1em] mt-2 mb-1">{children}</h3>,
          h4: ({ children }) => <h4 className="font-semibold text-[1.05em] mt-2 mb-1">{children}</h4>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li className="leading-snug">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          del: ({ children }) => <del className="opacity-60">{children}</del>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/60 pl-3 my-2 text-syntra-text2 italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-border" />,
          code: ({ className, children, ...props }) => {
            const isBlock = /language-/.test(className || "");
            if (isBlock) {
              return (
                <code className={`block ${className || ""}`} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code
                className="font-mono text-[0.88em] px-1 py-[1px] rounded bg-surface-2 border border-border"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="font-mono text-[0.85em] bg-surface-2 border border-border rounded-lg p-2.5 my-2 overflow-x-auto">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="border-collapse border border-border text-[0.95em]">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border px-2 py-1 bg-surface-2 font-semibold text-left">{children}</th>
          ),
          td: ({ children }) => <td className="border border-border px-2 py-1 align-top">{children}</td>,
          input: ({ checked, type }) =>
            type === "checkbox" ? (
              <input type="checkbox" checked={!!checked} readOnly className="accent-primary mr-1 align-middle" />
            ) : null,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
