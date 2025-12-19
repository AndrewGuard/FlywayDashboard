import html2canvas from 'html2canvas';

/**
 * Export a DOM element as an image file
 * @param element The DOM element to capture
 * @param filename The name of the downloaded file (without extension)
 */
export const exportAsImage = async (element: HTMLElement, filename: string): Promise<void> => {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      logging: false,
      useCORS: true
    });

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create blob from canvas');
        return;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = url;
      link.click();

      // Cleanup
      URL.revokeObjectURL(url);
    });
  } catch (error) {
    console.error('Error exporting image:', error);
    throw error;
  }
};

/**
 * Export multiple elements as separate images
 * @param elements Array of {element, filename} objects
 */
export const exportMultipleAsImages = async (
  elements: Array<{ element: HTMLElement; filename: string }>
): Promise<void> => {
  for (const { element, filename } of elements) {
    await exportAsImage(element, filename);
    // Small delay between exports to avoid browser issues
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};
