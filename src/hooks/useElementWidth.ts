/**
 * 要素の表示幅(px)を測って返すフック。
 *
 * Canvas をレイアウト（カラム幅）に追従させるために使う。
 * ResizeObserver でコンテナのリサイズを監視し、幅が変わるたび再描画させる。
 */
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export function useElementWidth<T extends HTMLElement>(): [RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => setWidth(el.clientWidth);
    update(); // 初回計測

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
