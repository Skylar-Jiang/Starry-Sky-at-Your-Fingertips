export const constellationTemplates = {
  happy: [
    { x: 0.22, y: 0.42 },
    { x: 0.34, y: 0.25 },
    { x: 0.48, y: 0.36 },
    { x: 0.63, y: 0.2 },
    { x: 0.76, y: 0.4 }
  ],
  calm: [
    { x: 0.24, y: 0.28 },
    { x: 0.36, y: 0.44 },
    { x: 0.5, y: 0.32 },
    { x: 0.64, y: 0.48 },
    { x: 0.78, y: 0.3 }
  ],
  wronged: [
    { x: 0.14, y: 0.16 },
    { x: 0.27, y: 0.06 },
    { x: 0.44, y: 0.29 },
    { x: 0.58, y: 0.18 },
    { x: 0.72, y: 0.38 },
    { x: 0.84, y: 0.24 }
  ],
  angry: [
    { x: 0.26, y: 0.34 },
    { x: 0.38, y: 0.18 },
    { x: 0.54, y: 0.2 },
    { x: 0.66, y: 0.36 },
    { x: 0.5, y: 0.5 }
  ],
  verySad: [
    { x: 0.2, y: 0.42 },
    { x: 0.34, y: 0.3 },
    { x: 0.48, y: 0.46 },
    { x: 0.62, y: 0.28 },
    { x: 0.78, y: 0.44 }
  ],
  anxious: [
    { x: 0.2, y: 0.2 },
    { x: 0.34, y: 0.42 },
    { x: 0.46, y: 0.18 },
    { x: 0.58, y: 0.46 },
    { x: 0.72, y: 0.24 },
    { x: 0.82, y: 0.4 }
  ],
  sad: [
    { x: 0.2, y: 0.38 },
    { x: 0.34, y: 0.2 },
    { x: 0.5, y: 0.34 },
    { x: 0.66, y: 0.18 },
    { x: 0.78, y: 0.42 }
  ]
};

export function getConstellationTemplate(emotion) {
  return constellationTemplates[emotion] || constellationTemplates.calm;
}
