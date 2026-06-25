// Lucide React Icons - Minimal subset for the app
const lucide = {
  Calendar: ({ size = 24, className = '' }) => 
    React.createElement('svg', {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className
    },
      React.createElement('rect', { x: 3, y: 4, width: 18, height: 18, rx: 2, ry: 2 }),
      React.createElement('line', { x1: 16, y1: 2, x2: 16, y2: 6 }),
      React.createElement('line', { x1: 8, y1: 2, x2: 8, y2: 6 }),
      React.createElement('line', { x1: 3, y1: 10, x2: 21, y2: 10 })
    ),
  
  Users: ({ size = 24, className = '' }) =>
    React.createElement('svg', {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className
    },
      React.createElement('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
      React.createElement('circle', { cx: 9, cy: 7, r: 4 }),
      React.createElement('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
      React.createElement('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })
    ),
  
  Mail: ({ size = 24, className = '' }) =>
    React.createElement('svg', {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className
    },
      React.createElement('path', { d: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' }),
      React.createElement('polyline', { points: '22,6 12,13 2,6' })
    ),
  
  Plus: ({ size = 24, className = '' }) =>
    React.createElement('svg', {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className
    },
      React.createElement('line', { x1: 12, y1: 5, x2: 12, y2: 19 }),
      React.createElement('line', { x1: 5, y1: 12, x2: 19, y2: 12 })
    ),
  
  Trash2: ({ size = 24, className = '' }) =>
    React.createElement('svg', {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className
    },
      React.createElement('polyline', { points: '3 6 5 6 21 6' }),
      React.createElement('path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }),
      React.createElement('line', { x1: 10, y1: 11, x2: 10, y2: 17 }),
      React.createElement('line', { x1: 14, y1: 11, x2: 14, y2: 17 })
    ),
  
  Edit2: ({ size = 24, className = '' }) =>
    React.createElement('svg', {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className
    },
      React.createElement('path', { d: 'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z' })
    ),
  
  Check: ({ size = 24, className = '' }) =>
    React.createElement('svg', {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className
    },
      React.createElement('polyline', { points: '20 6 9 17 4 12' })
    ),
  
  X: ({ size = 24, className = '' }) =>
    React.createElement('svg', {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className
    },
      React.createElement('line', { x1: 18, y1: 6, x2: 6, y2: 18 }),
      React.createElement('line', { x1: 6, y1: 6, x2: 18, y2: 18 })
    ),
  
  ArrowLeft: ({ size = 24, className = '' }) =>
    React.createElement('svg', {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className
    },
      React.createElement('line', { x1: 19, y1: 12, x2: 5, y2: 12 }),
      React.createElement('polyline', { points: '12 19 5 12 12 5' })
    ),
  
  Home: ({ size = 24, className = '' }) =>
    React.createElement('svg', {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className
    },
      React.createElement('path', { d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }),
      React.createElement('polyline', { points: '9 22 9 12 15 12 15 22' })
    )
};

window.lucide = lucide;
