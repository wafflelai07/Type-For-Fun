import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Typing For Fun — Test Your Speed & Accuracy" },
      {
        name: "description",
        content:
          "A simple typing practice app. Measure your WPM, accuracy, and time with random sentences.",
      },
    ],
  }),
});

const SENTENCES = [
  "Whenever the rain finally stops, I love stepping outside to smell the fresh, earthy air; it always reminds me of childhood weekends.",
  "She packed her notebook, three pencils, a half-eaten sandwich, and an old map before quietly slipping out the back door at sunrise.",
  "If you truly want to master something difficult, you must embrace the boring, repetitive practice that nobody on social media ever shows you.",
  "The library was unusually crowded today: students whispered over textbooks, kids giggled in the corner, and someone's phone kept buzzing nonstop!",
  "Don't underestimate the power of a good night's sleep — it sharpens your focus, balances your mood, and rebuilds your tired muscles.",
  "Around 7:45 a.m., the bakery on 5th Street fills the entire block with the warm, irresistible scent of butter, sugar, and cinnamon.",
  "Programming is mostly about reading code, debugging weird errors, and asking yourself, \"Why on earth did I write it this way?\"",
  "Travelling alone teaches you patience, courage, and the strange comfort of eating dinner at a tiny restaurant without anyone to talk to.",
  "He whispered, \"Are you sure about this?\" — but before I could reply, the door slammed shut and the lights went completely out.",
  "Success isn't always loud; sometimes it's a quiet morning, a finished project, and the simple satisfaction of doing what you said you would.",
];

const TIME_LIMIT = 60;

function pickRandomSentence(exclude?: string) {
  const pool = exclude ? SENTENCES.filter((s) => s !== exclude) : SENTENCES;
  return pool[Math.floor(Math.random() * pool.length)];
}

type Results = {
  wpm: number;
  seconds: number;
  accuracy: number;
};

function Index() {
  // Use a stable initial sentence for SSR; randomize after mount to avoid hydration mismatch.
  const [sentence, setSentence] = useState(SENTENCES[0]);
  const [input, setInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [results, setResults] = useState<Results | null>(null);
  // Track every printable keystroke and how many were wrong at the moment they were typed.
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [errorKeystrokes, setErrorKeystrokes] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  function focusInput() {
    // Focus hidden input on mobile to bring up the on-screen keyboard,
    // and the visible box on desktop for keydown handling.
    hiddenInputRef.current?.focus();
    boxRef.current?.focus();
  }

  // Pick a random sentence only on the client after hydration.
  useEffect(() => {
    setSentence(pickRandomSentence());
  }, []);

  useEffect(() => {
    focusInput();
  }, [sentence]);

  // Countdown
  useEffect(() => {
    if (startTime === null || results) return;
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, TIME_LIMIT - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        finish(input, startTime, totalKeystrokes, errorKeystrokes, TIME_LIMIT);
      }
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, input, results, totalKeystrokes, errorKeystrokes]);

  function finish(
    typed: string,
    start: number,
    total: number,
    errors: number,
    forcedSeconds?: number,
  ) {
    const seconds = forcedSeconds ?? (Date.now() - start) / 1000;
    const minutes = seconds / 60;
    const wpm = minutes > 0 ? typed.length / 5 / minutes : 0;
    // Accuracy penalizes every wrong keystroke, even if later corrected.
    const accuracy = total > 0 ? ((total - errors) / total) * 100 : 0;
    setResults({
      wpm: Math.round(wpm),
      seconds: Math.round(seconds * 10) / 10,
      accuracy: Math.round(accuracy * 10) / 10,
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (results) return;

    // Allow standard browser shortcuts (copy, refresh, devtools, etc.)
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      // Backspace edits the buffer but does NOT erase past errors from the count.
      if (input.length === 0) return;
      setInput(input.slice(0, -1));
      return;
    }

    // Single printable characters only
    if (e.key.length !== 1) return;
    e.preventDefault();

    // Don't allow typing past the sentence length.
    if (input.length >= sentence.length) return;

    const char = e.key;
    const nextInput = input + char;
    const expected = sentence[input.length];
    const isError = char !== expected;

    // Start the timer on first keystroke.
    let start = startTime;
    if (start === null) {
      start = Date.now();
      setStartTime(start);
    }

    const nextTotal = totalKeystrokes + 1;
    const nextErrors = errorKeystrokes + (isError ? 1 : 0);

    setInput(nextInput);
    setTotalKeystrokes(nextTotal);
    setErrorKeystrokes(nextErrors);

    if (nextInput === sentence) {
      finish(nextInput, start, nextTotal, nextErrors);
    }
  }

  // Process a single typed character — shared by desktop keydown and mobile input events.
  function processChar(char: string) {
    if (results) return;
    if (input.length >= sentence.length) return;

    const nextInput = input + char;
    const expected = sentence[input.length];
    const isError = char !== expected;

    let start = startTime;
    if (start === null) {
      start = Date.now();
      setStartTime(start);
    }

    const nextTotal = totalKeystrokes + 1;
    const nextErrors = errorKeystrokes + (isError ? 1 : 0);

    setInput(nextInput);
    setTotalKeystrokes(nextTotal);
    setErrorKeystrokes(nextErrors);

    if (nextInput === sentence) {
      finish(nextInput, start, nextTotal, nextErrors);
    }
  }

  function processBackspace() {
    if (results) return;
    if (input.length === 0) return;
    setInput(input.slice(0, -1));
  }

  // Mobile: handle input events from the hidden input. We keep the input
  // value empty after every event and read what was typed/deleted via inputType.
  function handleHiddenBeforeInput(e: React.FormEvent<HTMLInputElement>) {
    const ev = e.nativeEvent as InputEvent;
    if (ev.inputType === "deleteContentBackward") {
      e.preventDefault();
      processBackspace();
      return;
    }
    if (ev.inputType === "insertText" && ev.data) {
      e.preventDefault();
      // A single insertText may contain multiple chars (e.g. autocomplete); feed each.
      for (const ch of ev.data) processChar(ch);
      return;
    }
    // Block other input types (paste, compose, etc.) to keep accuracy honest.
    if (ev.inputType !== "insertCompositionText") {
      e.preventDefault();
    }
  }

  function handleRetry() {
    setSentence((prev) => pickRandomSentence(prev));
    setInput("");
    setStartTime(null);
    setTimeLeft(TIME_LIMIT);
    setResults(null);
    setTotalKeystrokes(0);
    setErrorKeystrokes(0);
  }

  const renderedSentence = useMemo(() => {
    return sentence.split("").map((char, i) => {
      let cls = "text-muted-foreground";
      if (i < input.length) {
        cls = input[i] === char ? "text-foreground" : "text-destructive underline";
      }
      const isCursor = i === input.length && !results;
      return (
        <span
          key={i}
          className={`${cls} ${isCursor ? "border-l-2 border-primary -ml-px animate-pulse" : ""}`}
        >
          {char}
        </span>
      );
    });
  }, [sentence, input, results]);

  const timerDisplay = Math.ceil(timeLeft);
  const isDone = !!results;

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Typing For Fun
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Click the box and start typing the sentence below.
          </p>
        </header>

        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {startTime === null && !results ? "Ready" : results ? "Done" : "Typing..."}
          </span>
          <span
            className={`font-mono text-lg font-semibold tabular-nums ${
              timerDisplay <= 10 && startTime !== null && !results
                ? "text-destructive"
                : "text-foreground"
            }`}
          >
            {timerDisplay}s
          </span>
        </div>

        <div
          ref={boxRef}
          tabIndex={0}
          role="textbox"
          aria-label="Typing area"
          onKeyDown={handleKeyDown}
          onClick={focusInput}
          onTouchStart={focusInput}
          className="rounded-lg bg-muted p-6 text-lg leading-relaxed font-mono tracking-wide outline-none cursor-text transition-all focus:ring-2 focus:ring-ring/40 focus:bg-muted/80 select-none"
        >
          {renderedSentence}
          {/* Hidden input drives the on-screen keyboard on mobile devices. */}
          <input
            ref={hiddenInputRef}
            type="text"
            value=""
            onChange={() => {
              /* Value is controlled to "" — actual typing handled in onBeforeInput. */
            }}
            onBeforeInput={handleHiddenBeforeInput}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            aria-hidden="true"
            tabIndex={-1}
            className="absolute h-px w-px opacity-0 pointer-events-none"
            style={{ left: "-9999px" }}
            disabled={isDone}
          />
        </div>

        {!isDone && startTime === null && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Click the box above and start typing to begin
          </p>
        )}

        {results && (
          <div className="mt-8">
            <div className="grid grid-cols-3 gap-4">
              <ResultCard label="WPM" value={results.wpm.toString()} />
              <ResultCard label="Time" value={`${results.seconds}s`} />
              <ResultCard label="Accuracy" value={`${results.accuracy}%`} />
            </div>

            <div className="mt-6 flex justify-center">
              <Button onClick={handleRetry} size="lg" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Try another sentence
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-card-foreground tabular-nums">{value}</div>
    </div>
  );
}
