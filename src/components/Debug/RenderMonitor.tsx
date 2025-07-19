import React, { useState, useCallback, useEffect } from 'react';

interface RenderEvent {
  componentName: string;
  renderCount: number;
  timestamp: number;
  dependencies?: Record<string, unknown>;
}

interface RenderMonitorProps {
  maxEvents?: number;
  enableNotifications?: boolean;
}

const RenderMonitor: React.FC<RenderMonitorProps> = ({ 
  maxEvents = 100,
  enableNotifications = true 
}) => {
  const [renderEvents, setRenderEvents] = useState<RenderEvent[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(5);

  const handleRender = useCallback((
    componentName: string, 
    renderCount: number, 
    dependencies?: Record<string, unknown>
  ) => {
    const event: RenderEvent = {
      componentName,
      renderCount,
      timestamp: Date.now(),
      dependencies
    };

    setRenderEvents(prev => {
      const updated = [...prev, event].slice(-maxEvents);
      
      // Check for problematic components
      if (enableNotifications && renderCount > alertThreshold) {
        const recentEvents = updated
          .filter(e => e.componentName === componentName)
          .slice(-10);
          
        if (recentEvents.length >= 5) {
          const timeSpan = recentEvents[recentEvents.length - 1]!.timestamp - recentEvents[0]!.timestamp;
          const rendersPerSecond = (recentEvents.length * 1000) / timeSpan;
          
          if (rendersPerSecond > 3) {
            console.warn(`⚠️ ${componentName} is rendering frequently: ${rendersPerSecond.toFixed(1)} renders/sec`);
          }
        }
      }
      
      return updated;
    });
  }, [maxEvents, enableNotifications, alertThreshold]);

  // Make handleRender available globally for RenderTracker components
  useEffect(() => {
    (window as typeof window & { __renderMonitorCallback?: typeof handleRender }).__renderMonitorCallback = handleRender;
    return () => {
      delete (window as typeof window & { __renderMonitorCallback?: typeof handleRender }).__renderMonitorCallback;
    };
  }, [handleRender]);

  const componentStats = React.useMemo(() => {
    const stats: Record<string, {
      totalRenders: number;
      lastRender: number;
      avgTimeBetweenRenders: number;
      isProblematic: boolean;
    }> = {};

    renderEvents.forEach(event => {
      const { componentName, timestamp } = event;
      
      if (!stats[componentName]) {
        stats[componentName] = {
          totalRenders: 0,
          lastRender: timestamp,
          avgTimeBetweenRenders: 0,
          isProblematic: false
        };
      }
      
      const stat = stats[componentName];
      if (!stat) return;
      stat.totalRenders++;
      
      if (stat.totalRenders > 1) {
        const timeDiff = timestamp - stat.lastRender;
        stat.avgTimeBetweenRenders = (stat.avgTimeBetweenRenders + timeDiff) / 2;
      }
      
      stat.lastRender = timestamp;
      stat.isProblematic = stat.totalRenders > alertThreshold || stat.avgTimeBetweenRenders < 1000;
    });

    return stats;
  }, [renderEvents, alertThreshold]);

  const clearEvents = () => setRenderEvents([]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          background: '#007acc',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 9998
        }}
      >
        📊 Render Monitor ({renderEvents.length})
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        width: '400px',
        height: '300px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 9998,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px',
        borderBottom: '1px solid #444',
        paddingBottom: '8px'
      }}>
        <h3 style={{ margin: 0, fontSize: '14px' }}>🔄 Render Monitor</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="number"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(Number(e.target.value))}
            style={{
              width: '40px',
              padding: '2px 4px',
              background: '#333',
              border: '1px solid #555',
              color: 'white',
              borderRadius: '2px'
            }}
            title="Alert threshold"
          />
          <button
            onClick={clearEvents}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '2px 6px',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '2px 6px',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#ccc' }}>
            Component Stats:
          </h4>
          {Object.entries(componentStats).map(([name, stat]) => (
            <div
              key={name}
              style={{
                padding: '4px 8px',
                margin: '2px 0',
                background: stat.isProblematic ? '#dc354520' : '#28a74520',
                border: `1px solid ${stat.isProblematic ? '#dc3545' : '#28a745'}`,
                borderRadius: '3px'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>
                {stat.isProblematic ? '🚨' : '✅'} {name}
              </div>
              <div style={{ fontSize: '10px', color: '#ccc' }}>
                Renders: {stat.totalRenders} | 
                Avg Interval: {stat.avgTimeBetweenRenders > 0 ? 
                  `${(stat.avgTimeBetweenRenders / 1000).toFixed(1)}s` : 'N/A'}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '8px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#ccc' }}>
            Recent Events ({renderEvents.length}):
          </h4>
          <div style={{ 
            maxHeight: '100px', 
            overflow: 'auto',
            fontSize: '10px'
          }}>
            {renderEvents.slice(-10).reverse().map((event, index) => (
              <div
                key={`${event.componentName}-${event.timestamp}-${index}`}
                style={{
                  padding: '2px 4px',
                  margin: '1px 0',
                  background: event.renderCount > alertThreshold ? '#dc354520' : '#333',
                  borderRadius: '2px'
                }}
              >
                <span style={{ fontWeight: 'bold' }}>
                  {event.componentName}
                </span>
                <span style={{ color: '#888' }}> #{event.renderCount}</span>
                <span style={{ color: '#666', marginLeft: '8px' }}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenderMonitor;