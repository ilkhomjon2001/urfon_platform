// Brauzerda ovoz yozish (MediaRecorder). Mikrofon yo'q / ruxsat berilmasa — tushunarli xabar,
// fayl yuklash esa sahifada har doim mavjud (graceful degradation).
import { useEffect, useRef, useState } from "react";
import { Alert, Button, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { fmtDuration } from "@/lib/format";

const MAX_SEC = 5 * 60;

type Phase = "idle" | "requesting" | "recording" | "recorded" | "saving";

function pickMime() {
  if (typeof MediaRecorder === "undefined") return null;
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]) {
    if (MediaRecorder.isTypeSupported?.(m)) return m;
  }
  return "";
}

export const recorderSupported = () =>
  typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

export interface AudioRecorderProps {
  /** Yozuv tayyor bo'lganda (fayl nomi recording.webm yoki recording.m4a). Promise tugaguncha "Saqlanmoqda". */
  onSave: (file: File) => Promise<unknown>;
  disabled?: boolean;
  className?: string;
}

export function AudioRecorder({ onSave, disabled, className }: AudioRecorderProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sec, setSec] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [level, setLevel] = useState<number[]>(() => Array(18).fill(0.15));
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const supported = recorderSupported();

  const cleanupStream = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
  };

  useEffect(() => () => cleanupStream(), []);
  useEffect(() => {
    if (!blob) {
      setPreviewUrl(null);
      return;
    }
    const u = URL.createObjectURL(blob);
    setPreviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);

  const start = async () => {
    setError(null);
    setBlob(null);
    setPhase("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        cleanupStream();
        const type = rec.mimeType || mime || "audio/webm";
        setBlob(new Blob(chunks, { type }));
        setPhase("recorded");
      };
      recRef.current = rec;
      rec.start(1000);
      setSec(0);
      setPhase("recording");
      const t0 = Date.now();
      timerRef.current = setInterval(() => {
        const s = Math.floor((Date.now() - t0) / 1000);
        setSec(s);
        if (s >= MAX_SEC && rec.state === "recording") rec.stop();
      }, 250);
      // Ovoz darajasi (vizual)
      try {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AC) {
          const ctx = new AC();
          ctxRef.current = ctx;
          const an = ctx.createAnalyser();
          an.fftSize = 64;
          ctx.createMediaStreamSource(stream).connect(an);
          const buf = new Uint8Array(an.frequencyBinCount);
          const tick = () => {
            an.getByteFrequencyData(buf);
            setLevel(Array.from({ length: 18 }, (_, i) => Math.max(0.12, (buf[i + 2] ?? 0) / 255)));
            rafRef.current = requestAnimationFrame(tick);
          };
          tick();
        }
      } catch {
        /* vizualizatsiya ixtiyoriy */
      }
    } catch (e) {
      cleanupStream();
      setPhase("idle");
      const name = e instanceof DOMException ? e.name : "";
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Mikrofonga ruxsat berilmadi. Brauzer sozlamalarida ruxsat bering yoki tayyor audio faylni pastdan yuklang."
          : name === "NotFoundError" || name === "OverconstrainedError"
            ? "Mikrofon topilmadi. Telefoningizda yozib olingan audio faylni pastdan yuklang."
            : "Ovoz yozishni boshlab boʻlmadi. Audio faylni pastdan yuklang.",
      );
    }
  };

  const stop = () => {
    if (recRef.current?.state === "recording") recRef.current.stop();
  };

  const save = async () => {
    if (!blob) return;
    const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
    const file = new File([blob], `recording.${ext}`, { type: blob.type.split(";")[0] || "audio/webm" });
    setPhase("saving");
    try {
      await onSave(file);
      setBlob(null);
      setPhase("idle");
    } catch {
      setPhase("recorded");
    }
  };

  if (!supported) {
    return (
      <Alert tone="warning" icon="mic_off" className={className} title="Bu brauzerda ovoz yozib boʻlmaydi">
        Telefoningizning diktofonida yozib, audio faylni (MP3, M4A, WAV) pastdan yuklang.
      </Alert>
    );
  }

  return (
    <div className={cn("rounded-xl border border-outline-variant/70 bg-surface-container-low p-4", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            phase === "recording" ? "animate-pulse bg-error text-on-error" : "bg-primary text-on-primary",
          )}
        >
          <Icon name={phase === "recording" ? "graphic_eq" : "mic"} size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-label-lg text-label-lg text-on-surface">
            {phase === "recording" ? "Yozilmoqda…" : phase === "recorded" || phase === "saving" ? "Yozuv tayyor" : "Ovozli javob yozish"}
          </p>
          <p className="text-body-sm text-on-surface-muted">
            {phase === "recording"
              ? `${fmtDuration(sec)} / ${fmtDuration(MAX_SEC)}`
              : phase === "recorded" || phase === "saving"
                ? "Tinglab koʻring, keyin saqlang yoki qayta yozing"
                : "Mikrofon tugmasini bosing va gapiring"}
          </p>
        </div>
        {phase === "recording" ? (
          <div className="flex h-8 items-end gap-0.5" aria-hidden="true">
            {level.map((v, i) => (
              <span key={i} className="w-1 rounded-full bg-primary" style={{ height: `${Math.round(v * 100)}%` }} />
            ))}
          </div>
        ) : null}
      </div>

      {previewUrl && (phase === "recorded" || phase === "saving") ? <audio controls src={previewUrl} className="mt-3 h-9 w-full" /> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {phase === "idle" || phase === "requesting" ? (
          <Button icon="mic" onClick={start} loading={phase === "requesting"} disabled={disabled}>
            Yozishni boshlash
          </Button>
        ) : null}
        {phase === "recording" ? (
          <Button variant="danger" icon="stop" onClick={stop}>
            Toʻxtatish
          </Button>
        ) : null}
        {phase === "recorded" || phase === "saving" ? (
          <>
            <Button icon="save" onClick={save} loading={phase === "saving"}>
              Yozuvni saqlash
            </Button>
            <Button variant="outline" icon="replay" onClick={start} disabled={phase === "saving"}>
              Qayta yozish
            </Button>
          </>
        ) : null}
      </div>
      {error ? (
        <Alert tone="warning" icon="mic_off" className="mt-3">
          {error}
        </Alert>
      ) : null}
    </div>
  );
}
