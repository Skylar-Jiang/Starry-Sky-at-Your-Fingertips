export const zodiacConstellations = [
  {
    key: "aries",
    label: "Aries",
    revealAt: 3,
    stars: [
      { id: "a1", x: 16, y: 30 },
      { id: "a2", x: 38, y: 34 },
      { id: "a3", x: 58, y: 42 },
      { id: "a4", x: 72, y: 56 }
    ],
    edges: [["a1", "a2"], ["a2", "a3"], ["a3", "a4"]]
  },
  {
    key: "taurus",
    label: "Taurus",
    revealAt: 3,
    stars: [
      { id: "t1", x: 16, y: 22 },
      { id: "t2", x: 32, y: 36 },
      { id: "t3", x: 48, y: 50 },
      { id: "t4", x: 64, y: 36 },
      { id: "t5", x: 82, y: 20 },
      { id: "t6", x: 38, y: 62 },
      { id: "t7", x: 58, y: 66 },
      { id: "t8", x: 72, y: 54 }
    ],
    edges: [
      ["t1", "t2"],
      ["t2", "t3"],
      ["t3", "t4"],
      ["t4", "t5"],
      ["t3", "t6"],
      ["t3", "t7"],
      ["t4", "t8"]
    ]
  },
  {
    key: "gemini",
    label: "Gemini",
    revealAt: 3,
    stars: [
      { id: "g1", x: 30, y: 18 },
      { id: "g2", x: 31, y: 36 },
      { id: "g3", x: 32, y: 56 },
      { id: "g4", x: 33, y: 76 },
      { id: "g5", x: 66, y: 18 },
      { id: "g6", x: 65, y: 36 },
      { id: "g7", x: 64, y: 56 },
      { id: "g8", x: 63, y: 76 }
    ],
    edges: [
      ["g1", "g2"],
      ["g2", "g3"],
      ["g3", "g4"],
      ["g5", "g6"],
      ["g6", "g7"],
      ["g7", "g8"],
      ["g1", "g5"],
      ["g2", "g6"],
      ["g3", "g7"],
      ["g4", "g8"]
    ]
  },
  {
    key: "cancer",
    label: "Cancer",
    revealAt: 3,
    stars: [
      { id: "c1", x: 35, y: 20 },
      { id: "c2", x: 47, y: 38 },
      { id: "c3", x: 54, y: 55 },
      { id: "c4", x: 45, y: 72 },
      { id: "c5", x: 70, y: 64 }
    ],
    edges: [["c1", "c2"], ["c2", "c3"], ["c3", "c4"], ["c3", "c5"]]
  },
  {
    key: "leo",
    label: "Leo",
    revealAt: 3,
    stars: [
      { id: "l1", x: 22, y: 66 },
      { id: "l2", x: 34, y: 54 },
      { id: "l3", x: 36, y: 38 },
      { id: "l4", x: 50, y: 26 },
      { id: "l5", x: 66, y: 34 },
      { id: "l6", x: 60, y: 50 },
      { id: "l7", x: 78, y: 62 },
      { id: "l8", x: 62, y: 74 },
      { id: "l9", x: 38, y: 74 }
    ],
    edges: [
      ["l1", "l2"],
      ["l2", "l3"],
      ["l3", "l4"],
      ["l4", "l5"],
      ["l5", "l6"],
      ["l6", "l1"],
      ["l1", "l9"],
      ["l9", "l8"],
      ["l8", "l7"],
      ["l7", "l6"]
    ]
  },
  {
    key: "virgo",
    label: "Virgo",
    revealAt: 3,
    stars: [
      { id: "v1", x: 18, y: 58 },
      { id: "v2", x: 30, y: 48 },
      { id: "v3", x: 42, y: 42 },
      { id: "v4", x: 54, y: 35 },
      { id: "v5", x: 66, y: 28 },
      { id: "v6", x: 76, y: 18 },
      { id: "v7", x: 58, y: 54 },
      { id: "v8", x: 48, y: 68 },
      { id: "v9", x: 36, y: 76 },
      { id: "v10", x: 70, y: 52 }
    ],
    edges: [
      ["v1", "v2"],
      ["v2", "v3"],
      ["v3", "v4"],
      ["v4", "v5"],
      ["v5", "v6"],
      ["v4", "v7"],
      ["v7", "v8"],
      ["v8", "v9"],
      ["v7", "v10"]
    ]
  },
  {
    key: "libra",
    label: "Libra",
    revealAt: 3,
    stars: [
      { id: "lb1", x: 24, y: 26 },
      { id: "lb2", x: 60, y: 24 },
      { id: "lb3", x: 40, y: 44 },
      { id: "lb4", x: 72, y: 48 },
      { id: "lb5", x: 52, y: 68 },
      { id: "lb6", x: 26, y: 64 }
    ],
    edges: [
      ["lb1", "lb2"],
      ["lb1", "lb3"],
      ["lb2", "lb4"],
      ["lb3", "lb4"],
      ["lb4", "lb5"],
      ["lb5", "lb6"]
    ]
  },
  {
    key: "scorpio",
    label: "Scorpio",
    revealAt: 3,
    stars: [
      { id: "s1", x: 18, y: 66 },
      { id: "s2", x: 28, y: 56 },
      { id: "s3", x: 38, y: 50 },
      { id: "s4", x: 48, y: 42 },
      { id: "s5", x: 60, y: 38 },
      { id: "s6", x: 68, y: 48 },
      { id: "s7", x: 66, y: 62 },
      { id: "s8", x: 58, y: 74 },
      { id: "s9", x: 46, y: 78 },
      { id: "s10", x: 38, y: 70 }
    ],
    edges: [
      ["s1", "s2"],
      ["s2", "s3"],
      ["s3", "s4"],
      ["s4", "s5"],
      ["s5", "s6"],
      ["s6", "s7"],
      ["s7", "s8"],
      ["s8", "s9"],
      ["s9", "s10"]
    ]
  },
  {
    key: "sagittarius",
    label: "Sagittarius",
    revealAt: 3,
    stars: [
      { id: "sg1", x: 24, y: 62 },
      { id: "sg2", x: 36, y: 48 },
      { id: "sg3", x: 50, y: 44 },
      { id: "sg4", x: 64, y: 34 },
      { id: "sg5", x: 74, y: 48 },
      { id: "sg6", x: 62, y: 62 },
      { id: "sg7", x: 46, y: 66 },
      { id: "sg8", x: 36, y: 76 },
      { id: "sg9", x: 56, y: 78 },
      { id: "sg10", x: 78, y: 70 }
    ],
    edges: [
      ["sg1", "sg2"],
      ["sg2", "sg3"],
      ["sg3", "sg4"],
      ["sg4", "sg5"],
      ["sg5", "sg6"],
      ["sg6", "sg7"],
      ["sg7", "sg1"],
      ["sg7", "sg8"],
      ["sg7", "sg9"],
      ["sg6", "sg10"]
    ]
  },
  {
    key: "capricorn",
    label: "Capricorn",
    revealAt: 3,
    stars: [
      { id: "cp1", x: 20, y: 50 },
      { id: "cp2", x: 34, y: 46 },
      { id: "cp3", x: 48, y: 50 },
      { id: "cp4", x: 66, y: 34 },
      { id: "cp5", x: 76, y: 28 },
      { id: "cp6", x: 70, y: 66 },
      { id: "cp7", x: 52, y: 72 },
      { id: "cp8", x: 36, y: 64 }
    ],
    edges: [
      ["cp1", "cp2"],
      ["cp2", "cp3"],
      ["cp3", "cp4"],
      ["cp4", "cp5"],
      ["cp4", "cp6"],
      ["cp6", "cp7"],
      ["cp7", "cp8"],
      ["cp8", "cp1"]
    ]
  },
  {
    key: "aquarius",
    label: "Aquarius",
    revealAt: 3,
    stars: [
      { id: "aq1", x: 18, y: 40 },
      { id: "aq2", x: 30, y: 34 },
      { id: "aq3", x: 42, y: 42 },
      { id: "aq4", x: 54, y: 36 },
      { id: "aq5", x: 68, y: 44 },
      { id: "aq6", x: 26, y: 60 },
      { id: "aq7", x: 40, y: 66 },
      { id: "aq8", x: 56, y: 62 },
      { id: "aq9", x: 72, y: 70 }
    ],
    edges: [
      ["aq1", "aq2"],
      ["aq2", "aq3"],
      ["aq3", "aq4"],
      ["aq4", "aq5"],
      ["aq1", "aq6"],
      ["aq6", "aq7"],
      ["aq7", "aq8"],
      ["aq8", "aq9"]
    ]
  },
  {
    key: "pisces",
    label: "Pisces",
    revealAt: 3,
    stars: [
      { id: "p1", x: 24, y: 28 },
      { id: "p2", x: 34, y: 20 },
      { id: "p3", x: 44, y: 28 },
      { id: "p4", x: 36, y: 40 },
      { id: "p5", x: 48, y: 54 },
      { id: "p6", x: 60, y: 62 },
      { id: "p7", x: 72, y: 70 },
      { id: "p8", x: 78, y: 58 },
      { id: "p9", x: 66, y: 50 },
      { id: "p10", x: 56, y: 48 }
    ],
    edges: [
      ["p1", "p2"],
      ["p2", "p3"],
      ["p3", "p4"],
      ["p4", "p1"],
      ["p4", "p5"],
      ["p5", "p6"],
      ["p6", "p7"],
      ["p7", "p8"],
      ["p8", "p9"],
      ["p9", "p10"],
      ["p10", "p6"]
    ]
  }
];

for (const constellation of zodiacConstellations) {
  constellation.id = constellation.key;
  constellation.name = constellation.label;
  constellation.requiredStarCount = constellation.stars.length;
  constellation.outlineRevealThreshold = constellation.revealAt;
  constellation.nodes = constellation.stars;
}

export const zodiacConstellationMap = Object.fromEntries(
  zodiacConstellations.map((constellation) => [constellation.key, constellation])
);

export const defaultConstellationKey = "aries";
export const activeConstellation = zodiacConstellations[0];

export function getConstellationByKey(key) {
  return zodiacConstellationMap[key] || zodiacConstellationMap[defaultConstellationKey];
}

export function getRandomConstellationKey(random = Math.random) {
  const index = Math.floor(random() * zodiacConstellations.length);
  return zodiacConstellations[Math.max(0, Math.min(zodiacConstellations.length - 1, index))].key;
}

export function getConstellationPoint(key, index) {
  const constellation = getConstellationByKey(key);
  return constellation.stars[index % constellation.stars.length] || constellation.stars[0];
}

export function getConstellationIndexByStarId(constellation, starId) {
  return constellation.stars.findIndex((star) => star.id === starId);
}

export function getLitConstellationCount(records = [], key = defaultConstellationKey) {
  return records.filter((record) => record?.star?.constellationKey === key).length;
}
