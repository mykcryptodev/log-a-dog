import { useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function usePrevious(value: any) {
  const ref = useRef();
  const previous = ref.current;
  // update the ref with the latest value for next render
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ref.current = value;
  return previous;
}

export default usePrevious;