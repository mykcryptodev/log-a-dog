import { useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  const previous = ref.current;
  ref.current = value;
  return previous;
}
export default usePrevious;