"use client";

import type { CSSProperties } from "react";
import {
  scoreToBodyAssetName,
  scoreToTemperatureColor,
  scoreToTemperatureOpacity,
  scoreToTextureBackgroundStyle,
} from "@/lib/constitution/visual";

export type ConstitutionAvatarProps = {
  kyojitsu: number;
  upperTemp: number;
  lowerTemp: number;
  soshitsu: number;
  upperTextureScore?: number;
  lowerTextureScore?: number;
  size?: number;
};

const VIEW_BOX_WIDTH = 180;
const VIEW_BOX_HEIGHT = 220;
const UPPER_SPLIT_Y = 109;
const UPPER_SPLIT_PERCENT = (UPPER_SPLIT_Y / VIEW_BOX_HEIGHT) * 100;

function createMaskStyle(maskAssetHref: string): CSSProperties {
  const maskUrl = `url("${maskAssetHref}")`;

  return {
    WebkitMaskImage: maskUrl,
    maskImage: maskUrl,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
  };
}

function createUpperClipStyle(): CSSProperties {
  const clipPath = `inset(0 0 ${100 - UPPER_SPLIT_PERCENT}% 0)`;

  return {
    clipPath,
    WebkitClipPath: clipPath,
  };
}

function createLowerClipStyle(): CSSProperties {
  const clipPath = `inset(${UPPER_SPLIT_PERCENT}% 0 0 0)`;

  return {
    clipPath,
    WebkitClipPath: clipPath,
  };
}

export function ConstitutionAvatar({
  kyojitsu,
  upperTemp,
  lowerTemp,
  soshitsu,
  upperTextureScore,
  lowerTextureScore,
  size = 180,
}: ConstitutionAvatarProps) {
  const bodyAssetName = scoreToBodyAssetName(kyojitsu);
  const lineAssetHref = `/constitution-bodies/${bodyAssetName}-line.svg`;
  const maskAssetHref = `/constitution-bodies/${bodyAssetName}-mask.svg`;

  const upperColor = scoreToTemperatureColor(upperTemp);
  const lowerColor = scoreToTemperatureColor(lowerTemp);
  const upperOpacity = scoreToTemperatureOpacity(upperTemp);
  const lowerOpacity = scoreToTemperatureOpacity(lowerTemp);
  const resolvedUpperTextureScore = upperTextureScore ?? soshitsu;
  const resolvedLowerTextureScore = lowerTextureScore ?? soshitsu;
  const hasSplitTexture = resolvedUpperTextureScore !== resolvedLowerTextureScore;
  const sharedTextureStyle = scoreToTextureBackgroundStyle(resolvedUpperTextureScore);
  const upperTextureStyle = scoreToTextureBackgroundStyle(resolvedUpperTextureScore);
  const lowerTextureStyle = scoreToTextureBackgroundStyle(resolvedLowerTextureScore);
  const maskStyle = createMaskStyle(maskAssetHref);
  const upperClipStyle = createUpperClipStyle();
  const lowerClipStyle = createLowerClipStyle();

  return (
    <div style={{ width: size, maxWidth: "100%" }}>
      <div className="relative" style={{ aspectRatio: `${VIEW_BOX_WIDTH} / ${VIEW_BOX_HEIGHT}` }}>
        {lowerOpacity > 0 ? (
          <div
            className="absolute inset-0"
            style={{
              ...maskStyle,
              ...lowerClipStyle,
              backgroundColor: lowerColor,
              opacity: lowerOpacity,
            }}
          />
        ) : null}

        {upperOpacity > 0 ? (
          <div
            className="absolute inset-0"
            style={{
              ...maskStyle,
              ...upperClipStyle,
              backgroundColor: upperColor,
              opacity: upperOpacity,
            }}
          />
        ) : null}

        {!hasSplitTexture && sharedTextureStyle.backgroundImage !== "none" ? (
          <div
            className="absolute inset-0"
            style={{
              ...maskStyle,
              ...sharedTextureStyle,
            }}
          />
        ) : null}

        {hasSplitTexture && upperTextureStyle.backgroundImage !== "none" ? (
          <div
            className="absolute inset-0"
            style={{
              ...maskStyle,
              ...upperClipStyle,
              ...upperTextureStyle,
            }}
          />
        ) : null}

        {hasSplitTexture && lowerTextureStyle.backgroundImage !== "none" ? (
          <div
            className="absolute inset-0"
            style={{
              ...maskStyle,
              ...lowerClipStyle,
              ...lowerTextureStyle,
            }}
          />
        ) : null}

        <svg
          viewBox={`0 0 ${VIEW_BOX_WIDTH} ${VIEW_BOX_HEIGHT}`}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="体質イメージアバター"
        >
          <image
            href={lineAssetHref}
            x="0"
            y="0"
            width={VIEW_BOX_WIDTH}
            height={VIEW_BOX_HEIGHT}
            preserveAspectRatio="xMidYMid meet"
          />
        </svg>
      </div>
    </div>
  );
}
