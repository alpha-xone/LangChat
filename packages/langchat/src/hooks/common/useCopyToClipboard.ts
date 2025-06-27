import { useState } from 'react';
import { useFeedbackAnimation } from '../../lib/utils/animation-utils';
import { copyToClipboard } from '../../lib/utils/clipboard-utils';

export function useCopyToClipboard() {
  const [isCopied, setIsCopied] = useState(false);
  const { scaleAnim, triggerFeedback } = useFeedbackAnimation();

  const copy = async (text: string, onCopy?: (text: string) => void) => {
    if (!text) return false;

    const success = await copyToClipboard(text);
    if (success) {
      onCopy?.(text);
      setIsCopied(true);
      triggerFeedback();

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
    return success;
  };

  return { copy, isCopied, scaleAnim };
}