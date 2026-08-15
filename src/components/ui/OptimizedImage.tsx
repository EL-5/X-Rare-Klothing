import { useState, type ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width: number;
  height: number;
  containerClassName?: string;
}

/**
 * `<img>` wrapper with a skeleton shown until load, a branded fallback on
 * error (never a broken-image icon), and explicit width/height passed
 * through so the browser reserves layout space before the image arrives
 * (prevents CLS) — see docs/image-audit.md.
 */
export function OptimizedImage({ src, alt, width, height, className, containerClassName, loading = 'lazy', ...rest }: OptimizedImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  if (status === 'error') {
    return (
      <div
        className={cn('flex items-center justify-center bg-surface-muted text-ink/40', containerClassName)}
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <div className="flex flex-col items-center gap-2">
          <ImageOff className="h-6 w-6" aria-hidden="true" />
          <span className="text-xs">Image unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden bg-surface-muted', containerClassName)} style={{ aspectRatio: `${width} / ${height}` }}>
      {status === 'loading' ? <div className="absolute inset-0 animate-pulse bg-surface-muted" aria-hidden="true" /> : null}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={cn('h-full w-full object-cover transition-opacity duration-300', status === 'loaded' ? 'opacity-100' : 'opacity-0', className)}
        {...rest}
      />
    </div>
  );
}
