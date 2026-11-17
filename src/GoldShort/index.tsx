import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  CalculateMetadataFunction,
} from "remotion";

import { getVideoMetadata } from "@remotion/media-utils";
import { z } from "zod";
import { makePages, Word, Page } from "./captions";
import { GOLD_SHORT_STYLE as STYLE } from "./style";

const GOLD = STYLE.colors.highlight;
export const goldShortSchema = z.object({
  videoFile: z.string().min(1),
  captionsFile: z.string().min(1),
  focusX: z.number().min(0).max(100).default(50),
  topics: z
    .array(
      z.object({
        title: z.string().min(1),
        kicker: z.string().default(""),
        startSeconds: z.number().min(0),
        durationSeconds: z.number().positive().default(4.5),
      }),
    )
    .default([]),
  // Kleines Siegel (z. B. "HADITH") oben links, kurz eingeblendet.
  badges: z
    .array(
      z.object({
        label: z.string().min(1),
        startSeconds: z.number().min(0),
        durationSeconds: z.number().positive().default(2.5),
      }),
    )
    .default([]),
  // Schrittgrafik: Wörter erscheinen nacheinander, passend zum Gesprochenen.
  // layout "row" = Kette mit Pfeilen, "grid" = Aufzählung in zwei Spalten.
  // Zeiten (startSeconds, atSeconds) beziehen sich auf den Clip.
  steps: z
    .array(
      z.object({
        layout: z.enum(["row", "grid"]).default("row"),
        heading: z.string().default(""),
        startSeconds: z.number().min(0),
        endSeconds: z.number().positive(),
        items: z.array(
          z.object({ text: z.string().min(1), atSeconds: z.number().min(0) }),
        ),
      }),
    )
    .default([]),
  // Schnittzeiten (Sekunden im Clip), an denen die Einstellung wechselt:
  // abwechselnd Normalbild und leichter Zoom, das kaschiert Sprungschnitte.
  zoomCuts: z.array(z.number().min(0)).default([]),
});
export type GoldShortProps = z.infer<typeof goldShortSchema>;
export const calculateGoldShortMetadata: CalculateMetadataFunction<
  GoldShortProps
> = async ({ props }) => {
  const resolvedProps = goldShortSchema.parse(props);
  const metadata = await getVideoMetadata(staticFile(resolvedProps.videoFile));
  return {
    props: resolvedProps,
    fps: STYLE.fps,
    durationInFrames: Math.max(
      1,
      Math.round(metadata.durationInSeconds * STYLE.fps),
    ),
  };
};
const wordSchema = z.array(
  z.object({
    text: z.string().min(1),
    startMs: z.number().min(0),
    endMs: z.number().positive(),
  }),
);

const Caption: React.FC<{ page: Page }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Sequence origins are rounded to frames; use that same origin for word timing.
  const timeMs =
    ((frame + Math.floor((page.startMs * fps) / 1000)) * 1000) / fps;
  const enter = spring({
    frame,
    fps,
    config: { damping: 24, stiffness: 260 },
    durationInFrames: 7,
  });
  return (
    <div
      style={{
        position: "absolute",
        top: STYLE.captions.top,
        left: STYLE.captions.left,
        width: STYLE.captions.width,
        minHeight: STYLE.captions.minHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translateY(${(1 - enter) * 14}px)`,
        opacity: interpolate(frame, [0, 3], [0.35, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      <div
        style={{
          textAlign: "center",
          fontFamily: STYLE.fontFamily,
          fontSize: STYLE.captions.fontSize,
          lineHeight: STYLE.captions.lineHeight,
          fontWeight: 700,
          color: STYLE.colors.text,
          textShadow: "0 4px 14px rgba(0,0,0,0.9)",
          WebkitTextStroke: "1.5px rgba(0,0,0,0.8)",
          paintOrder: "stroke",
          direction: /[\u0600-\u06ff]/.test(page.words[0].text) ? "rtl" : "ltr",
        }}
      >
        {page.words.map((word, i) => {
          const active = timeMs >= word.startMs && timeMs < word.endMs;
          const pop = active
            ? spring({
                frame: Math.max(0, ((timeMs - word.startMs) * fps) / 1000),
                fps,
                config: { damping: 18, stiffness: 340 },
                durationInFrames: 5,
              })
            : 1;
          return (
            <React.Fragment key={`${word.startMs}-${i}`}>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: 10,
                  color: active ? STYLE.colors.activeText : STYLE.colors.text,
                  background: active ? GOLD : "transparent",
                  WebkitTextStroke: active ? "0px" : undefined,
                  textShadow: active ? "none" : undefined,
                  transform: `scale(${active ? 0.98 + pop * 0.05 : 1})`,
                }}
              >
                {word.text.trim()}
              </span>
              {i < page.words.length - 1 ? " " : ""}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const Topic: React.FC<{
  title: string;
  kicker: string;
  durationInFrames: number;
}> = ({ title, kicker, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    config: { damping: 22 },
    durationInFrames: 14,
  });
  const exit = interpolate(
    frame,
    [Math.max(0, durationInFrames - 20), durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  return (
    <div
      style={{
        position: "absolute",
        top: STYLE.topics.top,
        left: STYLE.topics.left,
        width: STYLE.topics.width,
        opacity: enter * exit,
        transform: `translateY(${(1 - enter) * 18}px)`,
        fontFamily: STYLE.fontFamily,
      }}
    >
      <div
        style={{
          color: GOLD,
          fontSize: STYLE.topics.kickerSize,
          letterSpacing: 5,
          marginBottom: 14,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          color: STYLE.colors.text,
          fontSize: STYLE.topics.titleSize,
          lineHeight: 1.12,
          textShadow: "0 3px 18px #000",
          maxWidth: 800,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 22,
          width: 170 * enter,
          height: 4,
          background: GOLD,
          borderRadius: 4,
        }}
      />
    </div>
  );
};

const Badge: React.FC<{ label: string; durationInFrames: number }> = ({
  label,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16 }, durationInFrames: 12 });
  const exit = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: STYLE.badge.top,
        left: STYLE.badge.left,
        opacity: enter * exit,
        transform: `scale(${0.7 + enter * 0.3})`,
        transformOrigin: "left center",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 22px",
        borderRadius: 999,
        border: `2px solid ${GOLD}`,
        background: "rgba(16,24,23,0.78)",
        color: GOLD,
        fontFamily: STYLE.fontFamily,
        fontSize: STYLE.badge.fontSize,
        letterSpacing: 6,
        fontWeight: 700,
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: 10, background: GOLD }} />
      {label}
    </div>
  );
};

const Pill: React.FC<{ text: string; progress: number }> = ({ text, progress }) => (
  <div
    style={{
      opacity: progress,
      transform: `translateY(${(1 - progress) * 24}px) scale(${0.9 + progress * 0.1})`,
      padding: "10px 30px",
      borderRadius: 16,
      border: `2px solid ${GOLD}`,
      background: "rgba(16,24,23,0.82)",
      color: STYLE.colors.text,
      fontFamily: STYLE.fontFamily,
      fontSize: STYLE.steps.fontSize,
      fontWeight: 700,
      textShadow: "0 3px 14px #000",
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

const Steps: React.FC<{
  layout: "row" | "grid";
  heading: string;
  items: { text: string; atFrame: number }[];
  durationInFrames: number;
}> = ({ layout, heading, items, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = (at: number) =>
    spring({ frame: frame - at, fps, config: { damping: 18, stiffness: 200 }, durationInFrames: 12 });
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const isRow = layout === "row";
  const firstAt = items.length ? items[0].atFrame : 0;
  const headingOpacity = pop(0) * (1 - pop(firstAt));
  return (
    <div
      style={{
        position: "absolute",
        top: isRow ? STYLE.steps.rowTop : STYLE.steps.gridTop,
        left: (STYLE.width - STYLE.steps.gridWidth) / 2,
        width: STYLE.steps.gridWidth,
        minHeight: 170,
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: STYLE.steps.gap,
        opacity: exit,
      }}
    >
      {heading ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: GOLD,
            fontFamily: STYLE.fontFamily,
            fontSize: 150,
            fontWeight: 700,
            opacity: headingOpacity,
            transform: `scale(${0.4 + pop(0) * 0.6})`,
            textShadow: "0 4px 20px #000",
          }}
        >
          {heading}
        </div>
      ) : null}
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {isRow && i > 0 ? (
            <div
              style={{
                color: GOLD,
                fontSize: 46,
                fontFamily: STYLE.fontFamily,
                opacity: pop(item.atFrame),
                transform: `translateX(${(1 - pop(item.atFrame)) * -14}px)`,
              }}
            >
              →
            </div>
          ) : null}
          <Pill text={item.text} progress={pop(item.atFrame)} />
        </React.Fragment>
      ))}
    </div>
  );
};

export const GoldShort: React.FC<GoldShortProps> = ({
  videoFile,
  captionsFile,
  focusX = 50,
  topics = [],
  badges = [],
  steps = [],
  zoomCuts = [],
}) => {
  const [handle] = useState(() =>
    delayRender("Load exact word timings and font"),
  );
  const [pages, setPages] = useState<Page[]>([]);
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const t = frame / fps;
  const cutsSorted = [...zoomCuts].sort((a, b) => a - b);
  const segIndex = cutsSorted.filter((c) => c <= t).length;
  const segStart = segIndex > 0 ? cutsSorted[segIndex - 1] : 0;
  const segEnd = segIndex < cutsSorted.length ? cutsSorted[segIndex] : durationInFrames / fps;
  const zoomScale =
    1 +
    (cutsSorted.length && segIndex % 2 === 1 ? STYLE.zoom.amount : 0) +
    (cutsSorted.length
      ? STYLE.zoom.drift * Math.min(1, Math.max(0, (t - segStart) / Math.max(0.1, segEnd - segStart)))
      : 0);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const font = new FontFace(
        STYLE.fontName,
        `url('${staticFile(STYLE.fontFile)}')`,
      );
      await font.load();
      document.fonts.add(font);
      const response = await fetch(staticFile(captionsFile));
      if (!response.ok) throw new Error("Missing exact-clip captions");
      const words: Word[] = wordSchema.parse(await response.json());
      if (
        words.some(
          (w, i) =>
            w.endMs <= w.startMs || (i > 0 && w.startMs < words[i - 1].endMs),
        )
      ) {
        throw new Error("Word timings must be ordered and must not overlap.");
      }
      if (cancelled) return;
      setPages(makePages(words, (durationInFrames * 1000) / fps));
      continueRender(handle);
    };
    load().catch((error) => {
      if (!cancelled) cancelRender(error);
    });
    return () => {
      cancelled = true;
    };
  }, [handle, captionsFile, durationInFrames, fps]);
  return (
    <AbsoluteFill style={{ backgroundColor: STYLE.colors.background }}>
      <AbsoluteFill
        style={{
          transform: `scale(${zoomScale})`,
          transformOrigin: `50% ${STYLE.zoom.originY}%`,
        }}
      >
        <OffthreadVideo
          src={staticFile(videoFile)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${focusX}% 50%`,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: STYLE.overlay,
        }}
      />
      {topics.map((topic, i) => {
        const from = Math.round(topic.startSeconds * fps);
        const duration = Math.min(
          Math.round(topic.durationSeconds * fps),
          durationInFrames - from,
        );
        if (duration <= 0) return null;
        return (
          <Sequence key={i} from={from} durationInFrames={duration}>
            <Topic
              title={topic.title}
              kicker={topic.kicker}
              durationInFrames={duration}
            />
          </Sequence>
        );
      })}
      {badges.map((badge, i) => {
        const from = Math.round(badge.startSeconds * fps);
        const duration = Math.min(Math.round(badge.durationSeconds * fps), durationInFrames - from);
        return duration > 0 ? (
          <Sequence key={`b${i}`} from={from} durationInFrames={duration}>
            <Badge label={badge.label} durationInFrames={duration} />
          </Sequence>
        ) : null;
      })}
      {steps.map((group, i) => {
        const from = Math.round(group.startSeconds * fps);
        const duration = Math.min(Math.round(group.endSeconds * fps), durationInFrames) - from;
        return duration > 0 ? (
          <Sequence key={`s${i}`} from={from} durationInFrames={duration}>
            <Steps
              layout={group.layout}
              heading={group.heading}
              durationInFrames={duration}
              items={group.items.map((it) => ({
                text: it.text,
                atFrame: Math.max(0, Math.round((it.atSeconds - group.startSeconds) * fps)),
              }))}
            />
          </Sequence>
        ) : null;
      })}
      {pages.map((page, i) => {
        const from = Math.floor((page.startMs * fps) / 1000);
        const duration = Math.ceil((page.endMs * fps) / 1000) - from;
        return duration > 0 ? (
          <Sequence key={i} from={from} durationInFrames={duration}>
            <Caption page={page} />
          </Sequence>
        ) : null;
      })}
    </AbsoluteFill>
  );
};
