import { useId, type Ref } from "react";
import { contrastText, type Horsey } from "@/lib/horsey";

const OUTLINE = "#2b1d14";
const OW = 3.5; // visible outline width
const BODY_RY = 42;
const LEG_W = 18;
const HOOF_H = 14;
const NECK_ANGLE = (-60 * Math.PI) / 180;

type Pt = { x: number; y: number };

const ACCESSORY_TOP: Record<Horsey["accessory"], number> = {
  none: -50,
  tophat: -84,
  partyhat: -94,
  crown: -60,
  shades: -50,
  bow: -50,
};

function geometry(h: Horsey) {
  const rx = 78 * h.bodyLength;
  const ry = BODY_RY;
  const legLen = 80 * h.legLength;
  const legTop = 10;
  const ground = ry + legLen;

  const pairs = Math.ceil(h.legCount / 2);
  const farCount = Math.floor(h.legCount / 2);
  const span = rx * 0.62;
  const pairXs = pairs === 1 ? [0] : Array.from({ length: pairs }, (_, i) => -span + (2 * span * i) / (pairs - 1));
  const nearLegs = pairXs;
  // Far legs go on the front-most pairs, so odd counts lose a back leg first.
  const farLegs = pairXs.slice(pairs - farCount).map((x) => x + 12);

  const d = { x: Math.cos(NECK_ANGLE), y: Math.sin(NECK_ANGLE) };
  const n = { x: -d.y, y: d.x }; // throat side; -n is the mane side
  const neckBase = { x: rx * 0.55, y: -ry * 0.2 };
  const neckLen = 75 * h.neckLength;
  const neckTip = { x: neckBase.x + d.x * neckLen, y: neckBase.y + d.y * neckLen };
  const wBase = 40;
  const wTip = 30;
  const neck: Pt[] = [
    { x: neckBase.x + (n.x * wBase) / 2, y: neckBase.y + (n.y * wBase) / 2 },
    { x: neckTip.x + (n.x * wTip) / 2, y: neckTip.y + (n.y * wTip) / 2 },
    { x: neckTip.x - (n.x * wTip) / 2, y: neckTip.y - (n.y * wTip) / 2 },
    { x: neckBase.x - (n.x * wBase) / 2, y: neckBase.y - (n.y * wBase) / 2 },
  ];

  const tail = { x: -rx * 0.92, y: -ry * 0.35 };

  const hs = h.headSize;
  const tailLeft = { long: 62, fluffy: 64, stubby: 26, none: 0 }[h.tailStyle];
  const tailBottom = h.tailStyle === "long" ? tail.y + 98 : tail.y + 50;
  const maneOut = { flowy: 20, mohawk: 30, poofy: 28, bald: 0 }[h.maneStyle];

  const minX = Math.min(-rx - OW, tail.x - tailLeft, -span - LEG_W);
  const maxX = Math.max(rx + OW, neckTip.x + 62 * hs, (farLegs.at(-1) ?? 0) + LEG_W);
  const minY = Math.min(-ry - OW, neckTip.y + ACCESSORY_TOP[h.accessory] * hs, neckTip.y - wTip / 2 - maneOut);
  const maxY = Math.max(ground + OW, tailBottom);
  const pad = 10;

  return {
    rx, ry, legTop, ground, nearLegs, farLegs, d, n, neckBase, neckTip, neck, tail, hs, wBase, wTip,
    box: { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 },
  };
}

type Geo = ReturnType<typeof geometry>;

export function horseyViewBox(h: Horsey) {
  const { box } = geometry(h);
  const x = h.facing === "left" ? -(box.x + box.w) : box.x;
  return { x, y: box.y, w: box.w, h: box.h };
}

const pts = (list: Pt[]) => list.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

function maneBlobs(h: Horsey, g: Geo) {
  if (h.maneStyle === "bald") return [];
  const start = { x: g.neckBase.x - (g.n.x * g.wBase) / 2, y: g.neckBase.y - (g.n.y * g.wBase) / 2 };
  const end = { x: g.neckTip.x - (g.n.x * g.wTip) / 2, y: g.neckTip.y - (g.n.y * g.wTip) / 2 };
  const len = Math.hypot(end.x - start.x, end.y - start.y);
  const count = Math.max(2, Math.round(len / 13) + 1);
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    return { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
  });
}

function Mane({ h, g, pass }: { h: Horsey; g: Geo; pass: "outline" | "fill" }) {
  const stroke = pass === "outline" ? { stroke: OUTLINE, strokeWidth: OW * 2, strokeLinejoin: "round" as const } : {};
  const fill = pass === "outline" ? OUTLINE : h.hairColor;
  const out = { x: -g.n.x, y: -g.n.y };
  const spots = maneBlobs(h, g);

  if (h.maneStyle === "mohawk") {
    return (
      <>
        {spots.map((p, i) => (
          <polygon
            key={i}
            fill={fill}
            {...stroke}
            points={pts([
              { x: p.x - g.d.x * 9, y: p.y - g.d.y * 9 },
              { x: p.x + out.x * 26 + g.d.x * 4, y: p.y + out.y * 26 + g.d.y * 4 },
              { x: p.x + g.d.x * 9, y: p.y + g.d.y * 9 },
            ])}
          />
        ))}
      </>
    );
  }

  const r = h.maneStyle === "poofy" ? 16 : 11;
  const push = h.maneStyle === "poofy" ? 8 : 4;
  return (
    <>
      {spots.map((p, i) => (
        <circle key={i} cx={p.x + out.x * push} cy={p.y + out.y * push} r={r} fill={fill} {...stroke} />
      ))}
    </>
  );
}

function Tail({ h, g, pass }: { h: Horsey; g: Geo; pass: "outline" | "fill" }) {
  const { x, y } = g.tail;
  const color = pass === "outline" ? OUTLINE : h.hairColor;
  const extra = pass === "outline" ? OW * 2 : 0;

  if (h.tailStyle === "long") {
    return (
      <path
        d={`M ${x + 6} ${y} C ${x - 38} ${y - 12}, ${x - 52} ${y + 46}, ${x - 30} ${y + 86}`}
        fill="none"
        stroke={color}
        strokeWidth={20 + extra}
        strokeLinecap="round"
      />
    );
  }
  if (h.tailStyle === "fluffy") {
    const puffs = [
      [-18, -6, 16], [-36, 6, 18], [-30, 28, 17], [-46, 30, 15], [-22, 18, 14],
    ];
    return (
      <>
        {puffs.map(([dx, dy, r], i) => (
          <circle key={i} cx={x + dx} cy={y + dy} r={r + extra / 2} fill={color} />
        ))}
      </>
    );
  }
  if (h.tailStyle === "stubby") {
    return <circle cx={x - 10} cy={y + 2} r={12 + extra / 2} fill={color} />;
  }
  return null;
}

function SkinShapes({ g, fill, outline }: { g: Geo; fill: string; outline: boolean }) {
  const stroke = outline
    ? { stroke: OUTLINE, strokeWidth: OW * 2, strokeLinejoin: "round" as const, vectorEffect: "non-scaling-stroke" as const }
    : {};
  const legH = g.ground - HOOF_H - g.legTop + 2;
  return (
    <>
      {g.nearLegs.map((x, i) => (
        <rect key={i} x={x - LEG_W / 2} y={g.legTop} width={LEG_W} height={legH} rx={6} fill={fill} {...stroke} />
      ))}
      <polygon points={pts(g.neck)} fill={fill} {...stroke} />
      <ellipse cx={0} cy={0} rx={g.rx} ry={g.ry} fill={fill} {...stroke} />
      <g transform={`translate(${g.neckTip.x} ${g.neckTip.y}) scale(${g.hs})`}>
        <polygon points="-18,-14 -14,-48 2,-22" fill={fill} {...stroke} />
        <polygon points="-6,-18 2,-50 14,-20" fill={fill} {...stroke} />
        <circle cx={0} cy={0} r={26} fill={fill} {...stroke} />
        <ellipse cx={30} cy={14} rx={28} ry={18} transform="rotate(18 30 14)" fill={fill} {...stroke} />
      </g>
    </>
  );
}

function Hoof({ x, g, color, shade }: { x: number; g: Geo; color: string; shade?: boolean }) {
  const w = LEG_W + 6;
  return (
    <>
      <rect
        x={x - w / 2}
        y={g.ground - HOOF_H}
        width={w}
        height={HOOF_H}
        rx={4}
        fill={color}
        stroke={OUTLINE}
        strokeWidth={OW}
      />
      {shade && <rect x={x - w / 2} y={g.ground - HOOF_H} width={w} height={HOOF_H} rx={4} fill="#000" opacity={0.22} />}
    </>
  );
}

function Eye({ h, skin }: { h: Horsey; skin: string }) {
  const line = { stroke: OUTLINE, strokeWidth: 2.5 };
  switch (h.eyes) {
    case "googly":
      return (
        <>
          <circle cx={2} cy={-6} r={12} fill="#fff" {...line} />
          <circle cx={5} cy={0} r={6} fill={OUTLINE} />
        </>
      );
    case "happy":
      return <path d="M -6 -3 Q 2 -15 10 -3" fill="none" stroke={OUTLINE} strokeWidth={3.5} strokeLinecap="round" />;
    case "sleepy":
      return (
        <>
          <circle cx={2} cy={-6} r={8} fill="#fff" {...line} />
          <circle cx={4} cy={-2} r={4} fill={OUTLINE} />
          <path d="M -7 -5 A 9 9 0 0 1 11 -5 Z" fill={skin} {...line} />
        </>
      );
    case "angry":
      return (
        <>
          <circle cx={2} cy={-6} r={8} fill="#fff" {...line} />
          <circle cx={5} cy={-4} r={3.5} fill={OUTLINE} />
          <path d="M -9 -19 L 13 -11" stroke={OUTLINE} strokeWidth={4} strokeLinecap="round" />
        </>
      );
    default:
      return (
        <>
          <circle cx={2} cy={-6} r={8} fill="#fff" {...line} />
          <circle cx={4} cy={-5} r={4.5} fill={OUTLINE} />
          <circle cx={5.5} cy={-7} r={1.5} fill="#fff" />
        </>
      );
  }
}

function Mouth({ h }: { h: Horsey }) {
  const smile = <path d="M 34 24 Q 44 31 54 22" fill="none" stroke={OUTLINE} strokeWidth={3} strokeLinecap="round" />;
  switch (h.mouth) {
    case "toothy":
      return (
        <>
          <path d="M 33 23 Q 45 38 56 20 Q 45 27 33 23 Z" fill="#5a1a1a" stroke={OUTLINE} strokeWidth={2.5} strokeLinejoin="round" />
          <rect x={40} y={24} width={5} height={5} fill="#fff" stroke={OUTLINE} strokeWidth={1} />
          <rect x={46} y={23} width={5} height={5} fill="#fff" stroke={OUTLINE} strokeWidth={1} />
        </>
      );
    case "tongue":
      return (
        <>
          <ellipse cx={48} cy={30} rx={6} ry={9} fill="#ff6b8b" stroke={OUTLINE} strokeWidth={2.5} />
          {smile}
        </>
      );
    case "shocked":
      return <ellipse cx={46} cy={25} rx={5} ry={6.5} fill="#5a1a1a" stroke={OUTLINE} strokeWidth={2.5} />;
    default:
      return smile;
  }
}

function Accessory({ h }: { h: Horsey }) {
  const line = { stroke: OUTLINE, strokeWidth: 2.5, strokeLinejoin: "round" as const };
  switch (h.accessory) {
    case "tophat":
      return (
        <g transform="rotate(-12 -4 -28)">
          <rect x={-18} y={-78} width={30} height={48} rx={2} fill="#232323" {...line} />
          <rect x={-18} y={-44} width={30} height={8} fill="#e63946" />
          <rect x={-28} y={-34} width={50} height={8} rx={3} fill="#232323" {...line} />
        </g>
      );
    case "partyhat":
      return (
        <g>
          <polygon points="-22,-24 14,-30 -8,-84" fill="#ffd166" {...line} />
          <circle cx={-6} cy={-44} r={3.5} fill="#ff70a6" />
          <circle cx={-12} cy={-32} r={3.5} fill="#118ab2" />
          <circle cx={2} cy={-34} r={3.5} fill="#06d6a0" />
          <circle cx={-8} cy={-62} r={3} fill="#118ab2" />
          <circle cx={-8} cy={-87} r={7} fill="#ff70a6" {...line} />
        </g>
      );
    case "crown":
      return (
        <g>
          <polygon points="-24,-24 -24,-50 -13,-36 -3,-56 7,-36 18,-50 18,-24" fill="#ffd166" {...line} />
          <circle cx={-13} cy={-30} r={3} fill="#e63946" />
          <circle cx={-3} cy={-30} r={3} fill="#118ab2" />
          <circle cx={7} cy={-30} r={3} fill="#06d6a0" />
        </g>
      );
    case "shades":
      return (
        <g>
          <path d="M -12 -9 L -27 -12" stroke="#111" strokeWidth={3} strokeLinecap="round" />
          <path d="M 16 -9 L 26 -11" stroke="#111" strokeWidth={3} strokeLinecap="round" />
          <rect x={-12} y={-15} width={28} height={15} rx={6} fill="#111" {...line} />
          <path d="M -6 -11 L 0 -5" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.7} />
        </g>
      );
    case "bow":
      return (
        <g transform="translate(-16 -30) rotate(-20)">
          <polygon points="0,0 -16,-10 -16,10" fill="#ff70a6" {...line} />
          <polygon points="0,0 16,-10 16,10" fill="#ff70a6" {...line} />
          <circle cx={0} cy={0} r={5} fill="#ff4d8d" {...line} />
        </g>
      );
    default:
      return null;
  }
}

function SkinPattern({ id, h }: { id: string; h: Horsey }) {
  const base = <rect width="400" height="400" fill={h.bodyColor} />;
  const c = h.patternColor;
  switch (h.pattern) {
    case "stripes":
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width={28} height={28} patternTransform="rotate(12)">
          {base}
          <rect x={0} y={0} width={11} height={28} fill={c} />
        </pattern>
      );
    case "spots":
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width={90} height={90}>
          {base}
          {[[15, 20, 9], [55, 12, 7], [70, 52, 11], [28, 62, 8], [80, 84, 5], [48, 38, 4]].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={c} />
          ))}
        </pattern>
      );
    case "patches":
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width={200} height={160}>
          {base}
          {[[42, 42, 34, 24, 20], [140, 58, 40, 28, -15], [82, 122, 30, 22, 40], [176, 136, 20, 16, 0]].map(
            ([x, y, rx, ry, rot], i) => (
              <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${rot} ${x} ${y})`} fill={c} />
            ),
          )}
        </pattern>
      );
    case "checkers":
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width={36} height={36}>
          {base}
          <rect x={0} y={0} width={18} height={18} fill={c} />
          <rect x={18} y={18} width={18} height={18} fill={c} />
        </pattern>
      );
    default:
      return null;
  }
}

type Props = {
  horsey: Horsey;
  className?: string;
  svgRef?: Ref<SVGSVGElement>;
};

export function HorseySvg({ horsey: h, className, svgRef }: Props) {
  const uid = "h" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const g = geometry(h);
  const vb = horseyViewBox(h);
  const skin = h.pattern === "none" ? h.bodyColor : `url(#${uid}-skin)`;
  const cloth = { w: Math.min(60, g.rx), h: 50, cx: -g.rx * 0.1, top: -34 };
  const flip = h.facing === "left";

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      className={className}
      role="img"
      aria-label={h.name ? `${h.name}, a custom horsey` : "A custom horsey"}
    >
      <defs>
        <SkinPattern id={`${uid}-skin`} h={h} />
        <clipPath id={`${uid}-body`}>
          <ellipse cx={0} cy={0} rx={g.rx} ry={g.ry} />
        </clipPath>
      </defs>

      <g transform={flip ? "scale(-1 1)" : undefined}>
        <Tail h={h} g={g} pass="outline" />
        <Tail h={h} g={g} pass="fill" />

        {g.farLegs.map((x, i) => {
          const legH = g.ground - HOOF_H - g.legTop + 2;
          return (
            <g key={i}>
              <rect x={x - LEG_W / 2} y={g.legTop} width={LEG_W} height={legH} rx={6} fill={skin} stroke={OUTLINE} strokeWidth={OW} />
              <rect x={x - LEG_W / 2} y={g.legTop} width={LEG_W} height={legH} rx={6} fill="#000" opacity={0.22} />
              <Hoof x={x} g={g} color={h.hoofColor} shade />
            </g>
          );
        })}

        <Mane h={h} g={g} pass="outline" />
        <Mane h={h} g={g} pass="fill" />

        <SkinShapes g={g} fill={OUTLINE} outline />
        <SkinShapes g={g} fill={skin} outline={false} />

        {g.nearLegs.map((x, i) => (
          <Hoof key={i} x={x} g={g} color={h.hoofColor} />
        ))}

        {h.number.trim() && (
          <g clipPath={`url(#${uid}-body)`}>
            <rect
              x={cloth.cx - cloth.w / 2}
              y={cloth.top}
              width={cloth.w}
              height={cloth.h}
              rx={8}
              fill={h.saddleColor}
              stroke={OUTLINE}
              strokeWidth={OW}
            />
            <g transform={`translate(${cloth.cx} ${cloth.top + cloth.h / 2})${flip ? " scale(-1 1)" : ""}`}>
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="'Arial Black', Arial, Helvetica, sans-serif"
                fontWeight={900}
                fontSize={h.number.trim().length > 2 ? 20 : 28}
                fill={contrastText(h.saddleColor)}
              >
                {h.number.trim()}
              </text>
            </g>
          </g>
        )}

        <g transform={`translate(${g.neckTip.x} ${g.neckTip.y}) scale(${g.hs})`}>
          <polygon points="-4,-21 1,-42 9,-21" fill="#000" opacity={0.18} />
          {(h.maneStyle === "flowy" || h.maneStyle === "poofy") && (
            <g fill={h.hairColor} stroke={OUTLINE} strokeWidth={2.5}>
              <circle cx={-14} cy={-22} r={h.maneStyle === "poofy" ? 13 : 9} />
              <circle cx={-4} cy={-26} r={h.maneStyle === "poofy" ? 12 : 8} />
            </g>
          )}
          <Eye h={h} skin={skin} />
          <ellipse cx={51} cy={8} rx={3.5} ry={2.5} transform="rotate(20 51 8)" fill={OUTLINE} opacity={0.75} />
          <Mouth h={h} />
          <Accessory h={h} />
        </g>
      </g>
    </svg>
  );
}
