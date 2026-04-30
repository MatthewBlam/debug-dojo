"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/code-editor";

const initialCode = `def calculate_average(scores):
    total = sum(scores)
    return total / len(scores)


print(calculate_average([92, 88, 95]))`;

export default function EditorTestPage() {
  const [code, setCode] = useState(initialCode);

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <section className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-6 px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-700">
              Debug Dojo
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal">
              Editor Test
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-sm border border-border px-2.5 py-1 text-sm text-muted-foreground">
              {code.length} chars
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCode(initialCode)}>
              <RotateCcw aria-hidden="true" />
              Reset
            </Button>
          </div>
        </header>

        <div className="h-[32rem] overflow-hidden rounded-lg border border-border bg-zinc-950 shadow-sm">
          <CodeEditor
            value={code}
            path="debug-dojo/editor-test.py"
            onChange={setCode}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
          <pre className="min-h-28 overflow-auto rounded-md border border-border bg-muted p-4 font-mono text-sm leading-6 text-foreground">
            {code}
          </pre>
          <div className="rounded-md border border-border p-4">
            <p className="text-sm font-medium">
              Change callback
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {code.split("\n").length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              lines
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
