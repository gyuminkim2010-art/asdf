"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const SCH_LAT = 35.1893144;
const SCH_LON  = 128.0575711;

export default function GlobeHero() {
  const containerRef            = useRef<HTMLDivElement>(null);
  // hidden → globe → flying → arrived
  const [phase, setPhase]       = useState<"hidden"|"globe"|"flying"|"arrived">("hidden");
  const [zoomBlur, setZoomBlur] = useState(false);

  // ── 마우스 패럴랙스 ─────────────────────────────────────────────────
  const rawX   = useMotionValue(0);
  const rawY   = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 36, damping: 22, mass: 1 });
  const springY = useSpring(rawY, { stiffness: 36, damping: 22, mass: 1 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      rawX.set(((e.clientX - cx) / cx) * 22);
      rawY.set(((e.clientY - cy) / cy) * 14);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [rawX, rawY]);

  // ── MapLibre 초기화 ──────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    let map: any         = null;
    let spinId: number   = 0;
    let rotateId: number = 0;
    let spinning         = true;

    const init = async () => {
      if (!document.getElementById("maplibre-css")) {
        const link = document.createElement("link");
        link.id    = "maplibre-css";
        link.rel   = "stylesheet";
        link.href  = "https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css";
        document.head.appendChild(link);
      }

      const maplibregl = (await import("maplibre-gl")).default;

      map = new maplibregl.Map({
        container:        containerRef.current!,
        style:            "https://tiles.openfreemap.org/styles/liberty",
        center:           [128.0, 34.0],
        zoom:             1.5,
        pitch:            0,
        bearing:          0,
        interactive:      false,
        attributionControl: false,
        // 처음부터 globe 프로젝션 (2D 플래시 방지)
        ...({ projection: { type: "globe" } } as any),
      });

      map.on("load", () => {
        // Globe 프로젝션 확정
        try { map.setProjection({ type: "globe" }); } catch (_) {}

        // ── 모든 레이어 색상 → 어두운 모노톤으로 재정의 ─────────────
        // (CSS grayscale과 별개로, 색감 자체를 지도 단에서 제거)
        const layers: any[] = map.getStyle().layers ?? [];

        for (const layer of layers) {
          try {
            // 텍스트 & 아이콘 전부 숨김
            if (layer.type === "symbol") {
              map.setLayoutProperty(layer.id, "visibility", "none");
              continue;
            }
            // 원형 마커 (도시 점, POI 등) 숨김
            if (layer.type === "circle") {
              map.setLayoutProperty(layer.id, "visibility", "none");
              continue;
            }
            // 도로 / 공항 라인 숨김
            const sl: string = layer["source-layer"] ?? "";
            if (["transportation","transportation_name","aeroway"].includes(sl)) {
              map.setLayoutProperty(layer.id, "visibility", "none");
              continue;
            }
            // Fill 레이어 → 단일 어두운 색으로 통일
            // (공원 초록, 물 파랑, 보라 등 모두 제거)
            if (layer.type === "fill" && sl !== "building") {
              map.setPaintProperty(layer.id, "fill-color",         "rgba(12,12,12,0.97)");
              map.setPaintProperty(layer.id, "fill-outline-color", "rgba(38,38,38,0.6)");
            }
            // Line 레이어 (국경선 등) → 매우 은은한 흰색
            if (layer.type === "line") {
              map.setPaintProperty(layer.id, "line-color",   "rgba(72,72,72,0.45)");
              map.setPaintProperty(layer.id, "line-opacity", 0.5);
            }
            // Background → 완전 검정
            if (layer.type === "background") {
              map.setPaintProperty(layer.id, "background-color", "#060606");
            }
          } catch (_) {}
        }

        // ── 짙은 대기권 fog ───────────────────────────────────────────
        try {
          map.setFog({
            color:                 "rgba(0,0,0,0)",
            "high-color":          "#000000",
            "horizon-blend":       0.022,
            "space-above-horizon": "#000000",
            "star-intensity":      0,
          });
        } catch (_) {}

        // ── 소스 ID 탐색 ─────────────────────────────────────────────
        let srcId = "openmaptiles";
        for (const [id, src] of Object.entries(map.getStyle().sources ?? {})) {
          if ((src as any).type === "vector") { srcId = id; break; }
        }

        // ── 건물 윤곽선 (Apple 스타일) ───────────────────────────────
        try {
          map.addLayer({
            id: "building-outline",
            source: srcId,
            "source-layer": "building",
            type: "fill",
            minzoom: 14,
            paint: {
              "fill-color":         "rgba(235,235,235,0.06)",
              "fill-outline-color": "rgba(255,255,255,0.5)",
            },
          });
        } catch (_) {}

        // ── 3D 건물 (밝고 깔끔하게) ──────────────────────────────────
        try {
          map.addLayer({
            id: "3d-buildings",
            source: srcId,
            "source-layer": "building",
            type: "fill-extrusion",
            minzoom: 14,
            paint: {
              "fill-extrusion-color": [
                "interpolate", ["linear"], ["zoom"],
                14, "rgba(190,190,190,0.5)",
                16, "rgba(218,218,218,0.72)",
                18, "rgba(244,244,244,0.9)",
              ],
              "fill-extrusion-height": [
                "coalesce", ["get","render_height"], ["get","height"], 12,
              ],
              "fill-extrusion-base": [
                "coalesce", ["get","render_min_height"], ["get","min_height"], 0,
              ],
              "fill-extrusion-opacity": 0.86,
              ...({
                "fill-extrusion-ambient-occlusion-intensity": 0.45,
                "fill-extrusion-ambient-occlusion-radius":    3.5,
              } as any),
            },
          });
        } catch (_) {}

        // ── 첫 렌더(globe 모드) 후 은은하게 등장 ────────────────────
        map.once("render", () => {
          setTimeout(() => setPhase("globe"), 250);
        });

        // ── 지구 자전 ────────────────────────────────────────────────
        let lng = 128.0;
        const spin = () => {
          if (!spinning) return;
          lng -= 0.075;
          map.setCenter([lng, 34.0]);
          spinId = requestAnimationFrame(spin);
        };
        spinId = requestAnimationFrame(spin);

        // ── 5초 회전 후 줌인 시작 ───────────────────────────────────
        setTimeout(async () => {
          spinning = false;
          cancelAnimationFrame(spinId);
          setPhase("flying");
          setZoomBlur(true);

          // 1단계: 한반도 레벨 (부드럽게)
          map.flyTo({
            center:   [SCH_LON, SCH_LAT],
            zoom:     9.5,
            pitch:    22,
            bearing:  -12,
            duration: 3400,
            essential: true,
          });

          // 타일 로딩 여유
          await new Promise(r => setTimeout(r, 3600));
          setZoomBlur(false);

          // 2단계: 대아고 바로 앞까지
          map.flyTo({
            center:   [SCH_LON, SCH_LAT],
            zoom:     17.5,
            pitch:    60,
            bearing:  -30,
            duration: 4400,
            essential: true,
          });

          // 도착 → 360° 공전 시작
          await new Promise(r => setTimeout(r, 4600));
          setPhase("arrived");

          let brg = -30;
          const rotateCam = () => {
            brg += 0.08;            // 약 75초에 한 바퀴
            map.setBearing(brg % 360);
            rotateId = requestAnimationFrame(rotateCam);
          };
          rotateId = requestAnimationFrame(rotateCam);
        }, 5000);
      });
    };

    init();
    return () => {
      spinning = false;
      cancelAnimationFrame(spinId);
      cancelAnimationFrame(rotateId);
      map?.remove();
    };
  }, []);

  // ── 빈네트 (다중 스톱 — 자연스러운 페이드) ──────────────────────────
  const vignette =
    phase === "globe"
      ? `radial-gradient(ellipse 50% 50% at 50% 50%,
           transparent 0%, transparent 32%,
           rgba(0,0,0,0.10) 43%, rgba(0,0,0,0.30) 53%,
           rgba(0,0,0,0.56) 63%, rgba(0,0,0,0.78) 74%,
           rgba(0,0,0,0.93) 86%, #000 100%)`
      : phase === "flying"
      ? `radial-gradient(ellipse 66% 66% at 50% 50%,
           transparent 0%, transparent 42%,
           rgba(0,0,0,0.10) 53%, rgba(0,0,0,0.28) 63%,
           rgba(0,0,0,0.52) 74%, rgba(0,0,0,0.76) 85%,
           rgba(0,0,0,0.93) 94%, #000 100%)`
      : `radial-gradient(ellipse 60% 60% at 50% 50%,
           transparent 0%, transparent 37%,
           rgba(0,0,0,0.10) 49%, rgba(0,0,0,0.28) 60%,
           rgba(0,0,0,0.52) 71%, rgba(0,0,0,0.76) 82%,
           rgba(0,0,0,0.93) 92%, #000 100%)`;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* 패럴랙스 + 크기 여유 래퍼 */}
      <motion.div
        className="absolute"
        style={{ inset: "-5%", width: "110%", height: "110%", x: springX, y: springY }}
      >
        <motion.div
          className="absolute inset-0"
          // hidden일 땐 완전 투명 → globe부터 은은하게 fade-in
          animate={{ opacity: phase === "hidden" ? 0 : 0.84 }}
          transition={{ duration: phase === "hidden" ? 0 : 2.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            filter: zoomBlur
              ? "grayscale(1) brightness(0.30) contrast(1.20) blur(0.4px)"
              : "grayscale(1) brightness(0.30) contrast(1.20)",
            transition: "filter 1.1s ease",
          }}
        >
          <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        </motion.div>
      </motion.div>

      {/* 빈네트 */}
      <div
        style={{
          position:      "absolute",
          inset:         0,
          background:    vignette,
          transition:    "background 2.6s cubic-bezier(0.4,0,0.2,1)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
