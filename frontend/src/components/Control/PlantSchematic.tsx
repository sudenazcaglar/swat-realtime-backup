import React from 'react';

interface PlantSchematicProps {
  valvePositions: { [key: string]: number };
  pumpStates: { [key: string]: boolean };
  flowRates: { [key: string]: number };
}

export const PlantSchematic: React.FC<PlantSchematicProps> = ({
  valvePositions,
  pumpStates,
  flowRates,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 1000, height: 700 });

  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(800, rect.width - 32),
          height: Math.max(600, rect.height - 32)
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  /** -------------------------
   *  Wave helpers (stroke only)
   *  ------------------------- */
  const makeWavePath = (
    x: number,            // left
    y: number,            // baseline (water top)
    width: number,        // span
    amplitude = 3,        // px (2–3 ideal)
    wavelength = 32       // px
  ) => {
    const segments = Math.ceil(width / (wavelength / 2));
    let d = `M ${x} ${y}`;
    for (let i = 1; i <= segments; i++) {
      const cx1 = x + (i - 0.5) * (wavelength / 2);
      const cy1 = i % 2 === 1 ? y - amplitude : y + amplitude;
      const x1  = x + i * (wavelength / 2);
      const y1  = y;
      d += ` Q ${cx1} ${cy1}, ${x1} ${y1}`;
    }
    return d;
  };

  const AnimatedFlow = ({ x1, y1, x2, y2, flowRate }: {
    x1: number; y1: number; x2: number; y2: number; flowRate: number;
  }) => {
    const strokeWidth = Math.max(3, flowRate / 4);
    const opacity = Math.min(1, flowRate / 15);
    return (
      <g>
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#06B6D4"
          strokeWidth={strokeWidth}
          opacity={opacity}
          filter="url(#flow-glow)"
        />
        <circle r="4" fill="#06B6D4" className="animate-pulse" opacity={opacity}>
          <animateMotion
            dur={`${Math.max(0.6, 3 - (flowRate / 10))}s`}
            repeatCount="indefinite"
            path={`M${x1},${y1} L${x2},${y2}`}
          />
        </circle>
      </g>
    );
  };

  /** Tank with solid fill + thin animated surface wave (stroke) */
  const Tank = ({ x, y, level, label }: {
    x: number; y: number; level: number; label: string;
  }) => {
    const clipId =
      label === 'Raw Water' ? 'tank1-water-clip' :
      label === 'Primary'   ? 'tank2-water-clip' :
      label === 'Secondary' ? 'tank3-water-clip' : 'tank4-water-clip';

    const innerX = x - 45;
    const innerY = y - 65;
    const innerW = 90;
    const innerH = 90;

    const waterTopY = innerY + (1 - level) * innerH;

    // Build the wave path once per render (no vertical animation)
    const waveD = React.useMemo(
      () => makeWavePath(innerX - 32, waterTopY, innerW + 64, 3, 32),
      [innerX, innerW, waterTopY]
    );

    return (
      <g>
        {/* Tank outline */}
        <rect
          x={x - 50} y={y - 70} width="100" height="100"
          fill="none" stroke="#4B5563" strokeWidth="3" rx="8"
        />

        {/* Water area (solid) + surface wave (stroke only) */}
        <g clipPath={`url(#${clipId})`} shapeRendering="geometricPrecision">
          {/* Solid water fill */}
          <rect
            x={innerX} y={waterTopY}
            width={innerW} height={level * innerH}
            fill="url(#water-gradient)" opacity="0.9"
          />

          {/* Surface wave stroke riding exactly on water top (no fill => no gaps) */}
          <g>
            <path
              d={waveD}
              stroke="#62D5EA"      // a bit lighter than fill for contrast
              strokeWidth={2.5}
              fill="none"
              opacity={0.85}
            >
              {/* horizontal phase shift only */}
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 0" to="32 0" dur="7s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        </g>

        {/* Tank label & percent */}
        <text x={x} y={y + 50} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
          {label}
        </text>
        <text x={x} y={y + 68} textAnchor="middle" fill="#06B6D4" fontSize="12">
          {(level * 100).toFixed(0)}%
        </text>

        {/* Level indicator bar */}
        <rect x={x + 55} y={y - 65} width="8" height="90" fill="#374151" stroke="#6B7280" strokeWidth="1" rx="4"/>
        <rect x={x + 57} y={y - 63 + (1 - level) * 86} width="4" height={level * 86} fill="#06B6D4" rx="2"/>
      </g>
    );
  };

  const Valve = ({ x, y, position, label }: {
    x: number; y: number; position: number; label: string;
  }) => {
    const angle = position * 90;
    const openness = position / 100;
    return (
      <g>
        <circle cx={x} cy={y} r="20" fill="#374151" stroke="#6B7280" strokeWidth="3" filter="url(#component-glow)"/>
        <line
          x1={x - 12} y1={y} x2={x + 12} y2={y}
          stroke="#F97316" strokeWidth="4"
          opacity={0.3 + openness * 0.7}
          transform={`rotate(${angle} ${x} ${y})`}
        />
        <text x={x} y={y + 45} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{label}</text>
        <text x={x} y={y + 60} textAnchor="middle" fill="#F97316" fontSize="11">
          {position.toFixed(0)}%
        </text>
      </g>
    );
  };

  const Pump = ({ x, y, isActive, label }: {
    x: number; y: number; isActive: boolean; label: string;
  }) => (
    <g>
      <circle cx={x} cy={y} r="25" fill={isActive ? "#10B981" : "#374151"} stroke="#6B7280" strokeWidth="3" filter="url(#component-glow)"/>
      <polygon
        points={`${x-10},${y} ${x+10},${y-8} ${x+10},${y+8}`}
        fill="white"
        className={isActive ? 'animate-spin' : ''}
        style={{ transformOrigin: `${x}px ${y}px`, animationDuration: '1s' }}
      />
      <text x={x} y={y + 50} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{label}</text>
      <text x={x} y={y + 65} textAnchor="middle" fill={isActive ? "#10B981" : "#6B7280"} fontSize="11">
        {isActive ? "ACTIVE" : "IDLE"}
      </text>
      {isActive && <circle cx={x + 18} cy={y - 18} r="4" fill="#10B981" className="animate-pulse" />}
    </g>
  );

  const Sensor = ({ x, y, label, isActive = true }: {
    x: number; y: number; label: string; isActive?: boolean;
  }) => (
    <g>
      <circle cx={x} cy={y} r="8" fill={isActive ? "#F97316" : "#6B7280"} opacity={isActive ? 0.9 : 0.5} className={isActive ? "animate-pulse" : ""}/>
      <text x={x} y={y + 25} textAnchor="middle" fill="#F97316" fontSize="10" fontWeight="medium">{label}</text>
    </g>
  );

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Plant Schematic - Live Process Flow</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" /><span className="text-gray-300">Active Flow</span></div>
          <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-green-500 rounded-full" /><span className="text-gray-300">Pump Active</span></div>
          <div className="flex items-center space-x-2"><div className="w-3 h-3 bg-orange-500 rounded-full" /><span className="text-gray-300">Sensors</span></div>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 bg-gray-800 rounded-lg p-4 overflow-auto">
        <svg width={dimensions.width} height={dimensions.height} className="w-full h-full">
          <defs>
            <pattern id="plant-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#374151" strokeWidth="1" opacity="0.15"/>
            </pattern>

            <linearGradient id="water-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.9"/>
              <stop offset="100%" stopColor="#0891B2" stopOpacity="0.95"/>
            </linearGradient>

            {/* tank clip paths */}
            <clipPath id="tank1-water-clip"><rect x="75" y="115" width="90" height="90" rx="4"/></clipPath>
            <clipPath id="tank2-water-clip"><rect x="305" y="55" width="90" height="90" rx="4"/></clipPath>
            <clipPath id="tank3-water-clip"><rect x="535" y="55" width="90" height="90" rx="4"/></clipPath>
            <clipPath id="tank4-water-clip"><rect x="765" y="115" width="90" height="90" rx="4"/></clipPath>

            <filter id="flow-glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="component-glow"><feGaussianBlur stdDeviation="1" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>

          {/* bg grid */}
          <rect width="100%" height="100%" fill="url(#plant-grid)" />

          {/* Tanks */}
          <Tank x={120} y={180} level={0.75} label="Raw Water" />
          <Tank x={350} y={120} level={0.6}  label="Primary" />
          <Tank x={580} y={120} level={0.8}  label="Secondary" />
          <Tank x={810} y={180} level={0.9}  label="Clean Water" />

          {/* Pumps */}
          <Pump x={230} y={180} isActive={pumpStates.pump1 || false} label="P1" />
          <Pump x={465} y={120} isActive={pumpStates.pump2 || false} label="P2" />
          <Pump x={695} y={150} isActive={pumpStates.pump3 || false} label="P3" />

          {/* Valves */}
          <Valve x={180} y={180} position={valvePositions.valve1 || 50} label="V1" />
          <Valve x={410} y={120} position={valvePositions.valve2 || 75} label="V2" />
          <Valve x={635} y={135} position={valvePositions.valve3 || 80} label="V3" />
          <Valve x={750} y={180} position={valvePositions.valve4 || 60} label="V4" />

          {/* Piping + flow (mevcut efektler korunuyor) */}
          {(valvePositions.valve1 || 0) > 10 && (
            <>
              <AnimatedFlow x1={170} y1={180} x2={210} y2={180} flowRate={flowRates.flow1 || 10} />
              <rect x="170" y="175" width="40" height="10" fill="#06B6D4" opacity="0.6" rx="2"/>
            </>
          )}
          {pumpStates.pump1 && (
            <>
              <AnimatedFlow x1={250} y1={180} x2={300} y2={150} flowRate={flowRates.flow2 || 8} />
              <polygon points="250,175 300,145 300,155 250,185" fill="#06B6D4" opacity="0.5"/>
              {/* (opsiyonel) diagonal hattı sade bırakıyoruz; gerekirse benzer stroke dalga eklenir */}
            </>
          )}
          {(valvePositions.valve2 || 0) > 10 && (
            <>
              <AnimatedFlow x1={400} y1={120} x2={445} y2={120} flowRate={flowRates.flow3 || 12} />
              <rect x="400" y="115" width="45" height="10" fill="#06B6D4" opacity="0.6" rx="2"/>
            </>
          )}
          {pumpStates.pump2 && (
            <>
              <AnimatedFlow x1={485} y1={120} x2={530} y2={120} flowRate={flowRates.flow4 || 9} />
              <rect x="485" y="115" width="45" height="10" fill="#06B6D4" opacity="0.6" rx="2"/>
            </>
          )}
          {(valvePositions.valve3 || 0) > 10 && (
            <>
              <AnimatedFlow x1={655} y1={135} x2={675} y2={150} flowRate={flowRates.flow5 || 11} />
              <polygon points="655,130 675,145 675,155 655,140" fill="#06B6D4" opacity="0.5"/>
            </>
          )}
          {pumpStates.pump3 && (
            <>
              <AnimatedFlow x1={715} y1={150} x2={760} y2={180} flowRate={flowRates.flow6 || 10} />
              <polygon points="715,145 760,175 760,185 715,155" fill="#06B6D4" opacity="0.5"/>
            </>
          )}

          {/* Sensors */}
          <Sensor x={280} y={250} label="pH" />
          <Sensor x={520} y={250} label="Turbidity" />
          <Sensor x={750} y={250} label="Flow" />
          <Sensor x={400} y={250} label="Temp" />
          <Sensor x={650} y={250} label="Pressure" />

          {/* Titles */}
          <g>
            <text x={50} y={50} fill="#9CA3AF" fontSize="14" fontWeight="bold">Water Treatment Process Flow</text>
            <text x={50} y={70} fill="#6B7280" fontSize="12">Raw Water → Primary Treatment → Secondary Treatment → Clean Water</text>
          </g>

          {/* Flow rates box */}
          <g>
            <rect x={50} y={dimensions.height - 120} width={200} height={80} fill="#374151" stroke="#6B7280" strokeWidth="1" rx="8" opacity="0.9"/>
            <text x={60} y={dimensions.height - 100} fill="white" fontSize="12" fontWeight="bold">Flow Rates (L/s)</text>
            {Object.entries(flowRates).slice(0, 3).map(([key, rate], index) => (
              <text key={key} x={60} y={dimensions.height - 80 + index * 15} fill="#06B6D4" fontSize="11">
                {key}: {rate.toFixed(1)}
              </text>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
};
