import { useEffect, useRef } from 'react';

type Props = {
  name: string;
  props?: Record<string, unknown>;
};

export const RenderLogger = ({ name, props }: Props) => {
  const renderCount = useRef(0);
  const prevProps = useRef(props);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`🔄 ${name} rendered ${renderCount.current} times`);
    
    if (props && prevProps.current) {
      const changedProps = Object.keys(props).filter(
        key => props[key] !== prevProps.current![key]
      );
      if (changedProps.length > 0) {
        console.log(`  📝 ${name} - Props changed:`, changedProps);
        changedProps.forEach(key => {
          const oldValue = prevProps.current![key];
          const newValue = props[key];
          console.log(`    ${key}: ${String(oldValue)} -> ${String(newValue)}`);
        });
      }
    }
    
    prevProps.current = props;
  });

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '5px 10px', 
      fontSize: '12px',
      zIndex: 9999,
      borderRadius: '4px'
    }}>
      {name}: {renderCount.current}
    </div>
  );
};

export default RenderLogger;