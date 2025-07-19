import React, { useEffect, useRef, useState, memo } from 'react';

interface RenderTrackerProps {
  componentName: string;
  dependencies?: Record<string, unknown>;
  children?: React.ReactNode;
  onRender?: (componentName: string, renderCount: number, dependencies?: Record<string, unknown>) => void;
}

const RenderTrackerComponent: React.FC<RenderTrackerProps> = ({
  componentName,
  dependencies = {},
  children,
  onRender
}) => {
  const renderCount = useRef(0);
  const previousDependencies = useRef<Record<string, unknown>>({});
  const [renderLog, setRenderLog] = useState<Array<{
    count: number;
    timestamp: number;
    changedDeps: string[];
  }>>([]);

  // Track renders
  renderCount.current += 1;
  const currentRender = renderCount.current;

  // Detect changed dependencies
  const changedDeps: string[] = [];
  Object.keys(dependencies).forEach(key => {
    const current = dependencies[key];
    const previous = previousDependencies.current[key];
    
    if (current !== previous) {
      changedDeps.push(key);
    }
  });

  // Update ref with current dependencies
  previousDependencies.current = { ...dependencies };

  useEffect(() => {
    const timestamp = Date.now();
    
    // Log to console
    if (currentRender > 1) {
      console.group(`🔄 ${componentName} re-render #${currentRender}`);
      console.log('Timestamp:', new Date(timestamp).toISOString());
      
      if (changedDeps.length > 0) {
        console.log('Changed dependencies:', changedDeps);
        changedDeps.forEach(dep => {
          console.log(`  ${dep}:`, 
            previousDependencies.current[dep], 
            '→', 
            dependencies[dep]
          );
        });
      } else {
        console.warn('Re-render with no dependency changes detected!');
      }
      
      console.groupEnd();
    } else {
      console.log(`✨ ${componentName} initial render`);
    }

    // Update render log state
    setRenderLog(prev => {
      const newEntry = {
        count: currentRender,
        timestamp,
        changedDeps: [...changedDeps]
      };
      
      // Keep only last 20 renders to prevent memory issues
      const updated = [...prev, newEntry].slice(-20);
      return updated;
    });

    // Call external render callback
    onRender?.(componentName, currentRender, dependencies);
    
    // Also call global render monitor if available
    const globalCallback = (window as typeof window & { __renderMonitorCallback?: typeof onRender }).__renderMonitorCallback;
    if (globalCallback) {
      globalCallback(componentName, currentRender, dependencies);
    }

    // Check for infinite render loops (more than 10 renders in 1 second)
    if (currentRender > 10) {
      const oneSecondAgo = timestamp - 1000;
      const recentRenders = renderLog.filter(entry => entry.timestamp > oneSecondAgo);
      
      if (recentRenders.length > 8) {
        console.error(`🚨 INFINITE RENDER LOOP DETECTED in ${componentName}!`);
        console.error('Recent renders:', recentRenders);
        
        // Try to identify the problematic dependency
        const depChangeCounts: Record<string, number> = {};
        recentRenders.forEach(render => {
          render.changedDeps.forEach(dep => {
            depChangeCounts[dep] = (depChangeCounts[dep] ?? 0) + 1;
          });
        });
        
        const suspiciousDeps = Object.entries(depChangeCounts)
          .filter(([, count]) => count > 5)
          .map(([dep]) => dep);
          
        if (suspiciousDeps.length > 0) {
          console.error('Suspicious dependencies causing frequent changes:', suspiciousDeps);
        }
      }
    }
  }, [componentName, currentRender, onRender, changedDeps, renderLog, dependencies]);

  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && currentRender > 5 && (
        <div 
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(255, 0, 0, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 9999,
            maxWidth: '300px',
            wordBreak: 'break-word'
          }}
        >
          🚨 {componentName}: {currentRender} renders
          {changedDeps.length > 0 && (
            <div style={{ marginTop: '4px' }}>
              Changed: {changedDeps.join(', ')}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export const RenderTracker = memo(RenderTrackerComponent);

// Higher-order component version for easy wrapping
export const withRenderTracker = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
  getDependencies?: (props: P) => Record<string, unknown>
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    const dependencies = getDependencies ? getDependencies(props) : {};
    
    return (
      <RenderTracker componentName={componentName} dependencies={dependencies}>
        <Component {...props} />
      </RenderTracker>
    );
  };
  
  WrappedComponent.displayName = `withRenderTracker(${componentName})`;
  return memo(WrappedComponent);
};

export default RenderTracker;