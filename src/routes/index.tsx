import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Typing Practice — Test Your Speed & Accuracy" },
      {
        name: "description",
        content:
          "A simple typing practice app. Measure your WPM, accuracy, and time with random sentences.",
      },
    ],
  }),
});

const SENTENCES = [
  "The quick brown fox jumps over the lazy dog.",
  "Practice makes progress when you stay consistent every day.",
  "Typing fast is useful but typing accurately is more important.",
  "Small steps every day can lead to big achievements over time.",
  "Stay focused and keep your hands steady on the keyboard.",
  "Learning new skills takes patience and regular practice.",
  "Keep going even when it feels slow at the beginning.",
  "Consistency beats motivation when building good habits.",
  "Focus on accuracy first before trying to increase your speed.",
  "Every mistake is a chance to improve your typing skills.",
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
  const [sentence, setSentence] = useState(() => pickRandomSentence());
  const [input, setInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [results, setResults] = useState<Results | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [sentence]);

  // Countdown
  useEffect(() => {
    if (startTime === null || results) return;
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, TIME_LIMIT - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        finish(input, startTime, TIME_LIMIT);
      }
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, input, results]);

  function computeAccuracy(typed: string) {
    if (typed.length === 0) return 0;
    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === sentence[i]) correct++;
    }
    return (correct / typed.length) * 100;
  }

  function finish(typed: string, start: number, forcedSeconds?: number) {
    const seconds = forcedSeconds ?? (Date.now() - start) / 1000;
    const minutes = seconds / 60;
    const wpm = minutes > 0 ? typed.length / 5 / minutes : 0;
    const accuracy = computeAccuracy(typed);
    setResults({
      wpm: Math.round(wpm),
      seconds: Math.round(seconds * 10) / 10,
      accuracy: Math.round(accuracy * 10) / 10,
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (results) return;
    const value = e.target.value;

    let start = startTime;
    if (start === null && value.length > 0) {
      start = Date.now();
      setStartTime(start);
    }

    setInput(value);

    if (value === sentence && start !== null) {
      finish(value, start);
    }
  }

  function handleRetry() {
    setSentence((prev) => pickRandomSentence(prev));
    setInput("");
    setStartTime(null);
    setTimeLeft(TIME_LIMIT);
    setResults(null);
  }

  const renderedSentence = useMemo(() => {
    return sentence.split("").map((char, i) => {
      let cls = "text-muted-foreground";
      if (i < input.length) {
        cls = input[i] === char ? "text-foreground" : "text-destructive underline";
      }
      return (
        <span key={i} className={cls}>
          {char}
        </span>
      );
    });
  }, [sentence, input]);

  const timerDisplay = Math.ceil(timeLeft);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Typing Practice
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Type the sentence below as quickly and accurately as you can.
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

        <div className="rounded-lg bg-muted p-6 text-lg leading-relaxed font-mono tracking-wide">
          {renderedSentence}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleChange}
          disabled={!!results}
          placeholder="Start typing here..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="mt-4 w-full rounded-lg border border-input bg-background px-4 py-3 text-base text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
        />

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
