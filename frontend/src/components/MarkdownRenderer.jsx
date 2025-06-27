import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // For GitHub Flavored Markdown (tables, task lists, strikethrough)
import rehypeRaw from "rehype-raw"; // To process raw HTML embedded in Markdown (e.g., <img>, <br>)
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// We'll use a neutral dark theme for code, like 'dracula' or 'atom-dark' for a sleek look
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism"; // A good choice for dark UI
// import { atomDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'; // Another sleek dark option

const MarkdownRenderer = ({ content }) => {
  if (!content) {
    return null;
  }

  return (
    // Main container for the Markdown content.
    // Added dark mode support for text colors
    <div className="markdown-body text-slate-300 leading-relaxed break-words font-sans antialiased">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // --- UPDATED CODE COMPONENT WITH THEME SUPPORT ---
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");

            if (!inline) {
              if (match) {
                return (
                  <SyntaxHighlighter
                    style={dracula}
                    PreTag="div"
                    language={match[1]}
                    {...props}
                    customStyle={{
                      borderRadius: "0.75rem",
                      padding: "1.25rem",
                      marginTop: "1rem",
                      marginBottom: "1rem",
                      backgroundColor: "rgba(30, 41, 59, 0.5)", // slate-800 with opacity
                      overflowX: "auto",
                    }}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                );
              }
              return (
                <pre
                  className="bg-slate-800/50 text-slate-300 font-mono text-sm p-5 my-4 rounded-xl overflow-x-auto"
                  {...props}
                >
                  <code>{String(children).replace(/\n$/, "")}</code>
                </pre>
              );
            }

            return (
              <code
                className="bg-slate-800/30 text-indigo-400 px-1.5 py-0.5 rounded text-sm font-mono whitespace-nowrap"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Custom component for links with theme support
          a: ({ node, ...props }) => (
            <a
              {...props}
              className="text-indigo-400 hover:text-indigo-300 underline transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            />
          ),

          // Headings with theme support
          h1: ({ node, ...props }) => (
            <h1
              className="text-3xl sm:text-4xl font-bold my-5 pb-2 border-b border-slate-700/50 text-white"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-2xl sm:text-3xl font-semibold my-4 pt-2 text-slate-200"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-xl sm:text-2xl font-medium my-3 text-slate-300"
              {...props}
            />
          ),
          h4: ({ node, ...props }) => (
            <h4
              className="text-lg sm:text-xl font-normal my-2 text-slate-300"
              {...props}
            />
          ),
          h5: ({ node, ...props }) => (
            <h5
              className="text-base sm:text-lg font-normal my-1 text-slate-400"
              {...props}
            />
          ),
          h6: ({ node, ...props }) => (
            <h6
              className="text-sm sm:text-base font-normal my-1 text-slate-400"
              {...props}
            />
          ),

          // Paragraphs with theme support
          p: ({ node, children }) => {
            if (node.children[0]?.tagName === "pre") {
              return <>{children}</>;
            }
            return <p className="leading-relaxed text-slate-300 mb-4">{children}</p>;
          },

          // Strong/Bold text with theme support
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-slate-200" {...props} />
          ),

          // Emphasis/Italic text with theme support
          em: ({ node, ...props }) => (
            <em className="italic text-slate-300" {...props} />
          ),

          // Lists with theme support
          ul: ({ node, ...props }) => (
            <ul
              className="list-disc list-inside mb-4 space-y-1.5 pl-6 text-slate-300"
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className="list-decimal list-inside mb-4 space-y-1.5 pl-6 text-slate-300"
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li className="text-slate-300" {...props} />
          ),

          // Tables with theme support
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-slate-700/50">
              <table
                className="min-w-full divide-y divide-slate-700/50"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-slate-800/50" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="px-5 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider border border-slate-700/50"
              {...props}
            />
          ),
          tbody: ({ node, ...props }) => (
            <tbody
              className="bg-slate-800/30 divide-y divide-slate-700/50"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="px-5 py-4 whitespace-pre-wrap text-sm text-slate-300 border border-slate-700/50"
              {...props}
            />
          ),

          // Images with theme support
          img: ({ node, ...props }) => (
            <img
              className="max-w-full h-auto rounded-xl border border-slate-700/50 my-6 mx-auto block"
              {...props}
            />
          ),

          // Blockquotes with theme support
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-indigo-500/50 bg-slate-800/30 pl-5 italic text-slate-300 my-6 py-2 pr-3 rounded-r-xl"
              {...props}
            />
          ),

          // Horizontal Rule with theme support
          hr: ({ node, ...props }) => (
            <hr
              className="my-8 border-t border-slate-700/50 w-full mx-auto"
              {...props}
            />
          ),

          // Strikethrough with theme support
          del: ({ node, ...props }) => (
            <del className="line-through text-slate-400" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
