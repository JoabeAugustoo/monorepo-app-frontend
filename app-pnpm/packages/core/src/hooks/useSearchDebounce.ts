import { useState, useEffect } from 'react';

interface UseSearchDebounceReturn {
  debouncedValue: string;
  inputValue: string;
  setInputValue: (value: string) => void;
}

export const useSearchDebounce = (
  initialValue = '',
  delay = 500,
): UseSearchDebounceReturn => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, delay);
    return () => clearTimeout(timer);
  }, [inputValue, delay]);

  return { debouncedValue, inputValue, setInputValue };
};
