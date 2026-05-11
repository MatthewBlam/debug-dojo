"use client";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

async function signInWithGitHub() {
  await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: "http://localhost:3000",
    },
  });
}

export default function Home() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <section className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-border pb-5">
          <span className="text-sm font-semibold tracking-normal">
            Debug Dojo
          </span>
          <span className="rounded-sm bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-900">
            Alpha
          </span>
        </header>

        <div className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-medium text-cyan-700">
              Python debugging practice
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-normal text-balance sm:text-5xl">
              Build sharper debugging habits one broken program at a time.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Debug Dojo turns focused Python failures into short drills for
              reading traces, testing hypotheses, and fixing code with intent.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button>Start a session</Button>
              <Button variant="outline">Browse drills</Button>
              <Button variant="outline" onClick={signInWithGitHub}>
                Sign in with GitHub
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-zinc-950 text-zinc-100 shadow-sm">
            <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
              <span className="size-2 rounded-full bg-rose-400" />
              <span className="size-2 rounded-full bg-amber-400" />
              <span className="size-2 rounded-full bg-emerald-400" />
              <span className="ml-3 text-xs text-zinc-400">traceback.py</span>
            </div>
            <pre className="overflow-x-auto p-5 text-sm leading-7">
              <code>{`Traceback (most recent call last):
  File "dojo.py", line 14, in solve
    return total / attempts
ZeroDivisionError: division by zero

hint: reproduce, isolate, patch, verify`}</code>
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}