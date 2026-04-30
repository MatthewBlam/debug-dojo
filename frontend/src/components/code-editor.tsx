"use client";

import dynamic from "next/dynamic";
import type { EditorProps } from "@monaco-editor/react";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-96 w-full items-center justify-center bg-zinc-950 font-mono text-sm text-zinc-400">
      Loading editor...
    </div>
  )
});

type CodeEditorProps = Omit<
  EditorProps,
  "defaultLanguage" | "language" | "theme" | "onChange"
> & {
  language?: string;
  theme?: string;
  onChange?: (code: string) => void;
};

export function CodeEditor({
  language = "python",
  theme = "vs-dark",
  height = "32rem",
  options,
  onChange,
  ...props
}: CodeEditorProps) {
  return (
    <Editor
      defaultLanguage={language}
      language={language}
      height={height}
      theme={theme}
      onChange={(value) => onChange?.(value ?? "")}
      options={{
        automaticLayout: true,
        fontFamily:
          "var(--font-fira-code), var(--font-geist-mono), monospace",
        fontSize: 14,
        fontLigatures: true,
        minimap: { enabled: false },
        padding: { top: 16, bottom: 16 },
        scrollBeyondLastLine: false,
        tabSize: 4,
        wordWrap: "on",
        ...options
      }}
      {...props}
    />
  );
}
