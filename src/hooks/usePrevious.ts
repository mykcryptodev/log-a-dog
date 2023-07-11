import { useEffect, useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function usePrevious(value: any) {
  const ref = useRef();
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    ref.current = value; //assign the value of ref to the argument
  },[value]); //this code will run when the value of 'value' changes
  return ref.current; //in the end, return the current ref value.
}
export default usePrevious;