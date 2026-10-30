/** Shrink an uploaded image before it is stored in the browser. */
export function readScaledImage(file: File, maxWidth: number, type: 'image/jpeg' | 'image/png'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Could not read that image'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Could not read that image'));
          return;
        }
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL(type, 0.82));
      };
      img.onerror = () => reject(new Error('Could not read that image'));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export interface StockPhoto {
  id: string;
  label: string;
  /** Root path; schoolLook adds the deploy prefix when it is shown. */
  src: string;
}

/** Ready-made banners, so nobody has to find and upload a photo to get a good-looking page. */
export const STOCK_PHOTOS: StockPhoto[] = [
  { id: 'books', label: 'Books', src: '/cover.jpg' },
  { id: 'playground', label: 'Playground', src: '/stock/playground.jpg' },
  { id: 'sports', label: 'Sports', src: '/stock/sports.jpg' },
  { id: 'winter', label: 'Warm clothes', src: '/stock/winter.jpg' },
  { id: 'art-music', label: 'Art and music', src: '/stock/art-music.jpg' },
  { id: 'garden', label: 'Garden', src: '/stock/garden.jpg' },
];
