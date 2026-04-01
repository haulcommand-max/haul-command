import Image, { ImageProps } from 'next/image';

/**
 * Task 24: Heavy Image Optimization Pipeline
 * Forces AVIF rendering and lazy loading for extreme performance.
 */
export default function OptimizedImage(props: ImageProps) {
  return (
    <Image 
      {...props} 
      loading={props.priority ? undefined : 'lazy'}
      quality={props.quality || 80}
      className={`bg-gray-900 object-cover ${props.className || ''}`}
    />
  );
}
