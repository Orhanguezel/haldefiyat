"use client";
import { useEffect, useRef, useState } from "react";
import { AD_FORMATS, type AdFormat } from "../../../../../../../../shared/banner-layout.mjs";
/** A real desktop iframe, scaled to the panel; viewport never accidentally becomes mobile. */
export default function AdFormatPreview({ src, srcDoc, format, mobile = false, title = "Reklam önizlemesi" }: { src?: string; srcDoc?: string; format: AdFormat; mobile?: boolean; title?: string }) {
  const parent = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => { if (!parent.current) return; const observer=new ResizeObserver(([entry])=>setWidth(entry!.contentRect.width)); observer.observe(parent.current); return ()=>observer.disconnect(); },[]);
  const viewport = mobile ? 390 : 1200;
  const height = mobile ? 144 : AD_FORMATS[format].rows === 2 ? 600 : 304;
  const scale = Math.min(1, width / viewport || 1);
  return <div ref={parent} className="w-full overflow-hidden" style={{height:height*scale}}><iframe src={src} srcDoc={srcDoc} sandbox={srcDoc ? "allow-popups allow-popups-to-escape-sandbox" : undefined} title={title} style={{width:viewport,height,border:0,transform:`scale(${scale})`,transformOrigin:"top left"}} /></div>;
}
