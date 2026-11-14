import React, { useState, useEffect, useRef, useId } from 'react';
import { Film, ExternalLink } from 'lucide-react';

interface VideoPlayerProps {
  src?: string;
  poster?: string;
  title?: string;
  onEnded?: () => void;
  className?: string;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: string | HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onStateChange?: (event: { data: number }) => void;
          };
        }
      ) => { destroy: () => void };
      PlayerState?: { ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
    _agapeYtCallbacks?: Array<() => void>;
  }
}

const getYouTubeVideoId = (url?: string): string | null => {
  if (!url) return null;
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(ytRegex);
  return match ? match[1] : null;
};

const getVimeoEmbedUrl = (url?: string): string | null => {
  if (!url) return null;
  const vimeoRegex = /(?:vimeo\.com\/)(\d+)/i;
  const match = url.match(vimeoRegex);
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
};

function loadYouTubeIframeAPI(callback: () => void) {
  if (typeof window === 'undefined') return;
  if (window.YT && window.YT.Player) {
    callback();
    return;
  }
  window._agapeYtCallbacks = window._agapeYtCallbacks || [];
  window._agapeYtCallbacks.push(callback);

  const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
  if (!existingScript) {
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevReady === 'function') prevReady();
      const cbs = window._agapeYtCallbacks || [];
      window._agapeYtCallbacks = [];
      cbs.forEach((fn) => fn());
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    document.head.appendChild(tag);
  }
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  title,
  onEnded,
  className = '',
}) => {
  const [hasError, setHasError] = useState<boolean>(false);
  const [ytApiReady, setYtApiReady] = useState<boolean>(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const reactId = useId().replace(/:/g, '');
  const ytContainerRef = useRef<HTMLDivElement | null>(null);

  const youtubeVideoId = getYouTubeVideoId(src);
  const vimeoEmbedUrl = getVimeoEmbedUrl(src);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  useEffect(() => {
    if (!youtubeVideoId) {
      setYtApiReady(false);
      return;
    }

    let cancelled = false;
    let playerInstance: { destroy: () => void } | null = null;

    loadYouTubeIframeAPI(() => {
      if (cancelled || !ytContainerRef.current || !window.YT?.Player) return;
      try {
        playerInstance = new window.YT.Player(ytContainerRef.current, {
          videoId: youtubeVideoId,
          playerVars: {
            autoplay: 0,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onStateChange: (event: { data: number }) => {
              // 0 === YT.PlayerState.ENDED
              if (event.data === 0) {
                onEndedRef.current?.();
              }
            },
          },
        });
        setYtApiReady(true);
      } catch {
        setYtApiReady(false);
      }
    });

    return () => {
      cancelled = true;
      if (playerInstance) {
        try {
          playerInstance.destroy();
        } catch {
          // ignore destroy errors
        }
      }
    };
  }, [youtubeVideoId]);

  if (youtubeVideoId) {
    return (
      <div className={`relative bg-slate-950 rounded-xl overflow-hidden shadow-md aspect-video w-full ${className}`}>
        <div
          id={`yt-player-${reactId}`}
          ref={ytContainerRef}
          className="w-full h-full"
        />
        {!ytApiReady && (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=0&rel=0&enablejsapi=1`}
            title={title || 'Video de la lección'}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    );
  }

  if (vimeoEmbedUrl) {
    return (
      <div className={`relative bg-slate-950 rounded-xl overflow-hidden shadow-md aspect-video w-full ${className}`}>
        <iframe
          src={vimeoEmbedUrl}
          title={title || 'Video de la lección'}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={`relative bg-slate-950 rounded-xl overflow-hidden shadow-md aspect-video w-full flex flex-col items-center justify-center text-slate-300 p-6 text-center ${className}`}
      >
        <Film className="w-10 h-10 text-[#6080B8] mb-2" />
        <p className="text-sm font-bold text-white">{title || 'Sin video cargado'}</p>
        <p className="text-xs text-slate-400 mt-1">
          El docente aún no ha subido un archivo de video o enlace de YouTube para esta lección.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative bg-slate-950 rounded-xl overflow-hidden shadow-md aspect-video w-full ${className}`}>
      <video
        key={src}
        src={src}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        className="w-full h-full object-contain bg-black"
        onEnded={() => onEnded?.()}
        onError={() => setHasError(true)}
      />

      {hasError && (
        <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-center p-6 text-white">
          <Film className="w-10 h-10 text-amber-400 mb-3" />
          <h4 className="font-bold text-base mb-1">{title || 'Video no disponible en este navegador'}</h4>
          <p className="text-xs text-slate-300 max-w-md mb-4">
            Si el video fue cargado en una sesión anterior como archivo local temporal, vuelve a cargarlo desde el editor o usa un enlace de YouTube.
          </p>
          {!src.startsWith('blob:') && (
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#4B3B8B] hover:bg-[#3B2D73] rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir enlace original</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
};
