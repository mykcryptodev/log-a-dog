import { useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function usePrevious(value: any) {
  const ref = useRef();
  const previous = ref.current;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ref.current = value;
  return previous; // return the previous value on each render
}
export default usePrevious;