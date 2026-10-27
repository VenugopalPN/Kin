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
