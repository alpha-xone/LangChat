import { useCallback, useState } from 'react';

export function useTemporaryState<T>(
  initialValue: T,
  resetDelay: number = 2000
) {
  const [value, setValue] = useState<T>(initialValue);

  const setTemporary = useCallback((newValue: T) => {
    setValue(newValue);
    setTimeout(() => {
      setValue(initialValue);
    }, resetDelay);
  }, [initialValue, resetDelay]);

  return [value, setTemporary, setValue] as const;
}