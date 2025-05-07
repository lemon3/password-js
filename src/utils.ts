export const copyTextToClipboard = (text: string): Promise<void> => {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);

  return new Promise((resolve, reject) => {
    // Fallback for older browsers & iOS
    const textArea = document.createElement('textarea');
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'absolute';
    textArea.style.left = '-9999px'; // Keep it out of viewport
    textArea.value = text;
    document.body.appendChild(textArea);

    // Prevent scrolling during selection
    // const scrollY = window.scrollY;
    // document.body.style.overflow = "hidden";

    textArea.select();
    textArea.setSelectionRange(0, text.length); // iOS requires explicit range

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      // document.body.style.overflow = ""; // Restore scrolling

      if (successful) {
        resolve();
      } else {
        reject(new Error('Copy command failed'));
      }
    } catch (err) {
      document.body.removeChild(textArea);
      // document.body.style.overflow = ""; // Restore scrolling
      reject(err);
    }

    // Restore original scroll position
    // window.scrollTo(0, scrollY);
  });
};
