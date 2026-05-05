export const constellationConfig = {
  bloom: {
    label: "绽光座",
    emotion: "happy",
    image: "/assets/constellations/constellation_bloom.png",
    lineColor: "#ffd76d",
    minimumStars: 3
  },
  quietOrbit: {
    label: "静环座",
    emotion: "calm",
    image: "/assets/constellations/constellation_quiet_orbit.png",
    lineColor: "#8fd3ff",
    minimumStars: 3
  },
  drizzleArc: {
    label: "细雨弧座",
    emotion: "wronged",
    image: "/assets/constellations/constellation_drizzle_arc.png",
    lineColor: "#a9c8ff",
    minimumStars: 3
  },
  emberRing: {
    label: "微烬环座",
    emotion: "angry",
    image: "/assets/constellations/constellation_ember_ring.png",
    lineColor: "#ff9a68",
    minimumStars: 3
  },
  tearLakeEmotion: {
    label: "泪湖座",
    emotion: "verySad",
    image: "/assets/constellations/constellation_tear_lake.png",
    lineColor: "#7fa7ff",
    minimumStars: 3
  },
  dustSpiral: {
    label: "星尘旋座",
    emotion: "anxious",
    image: "/assets/constellations/constellation_dust_spiral.png",
    lineColor: "#b8f2e6",
    minimumStars: 3
  },
  tearLake: {
    label: "泪湖座",
    image: "/assets/constellations/constellation_tear_lake.png",
    emotions: ["wronged", "verySad", "sad"],
    minimumStars: 3
  }
};

export function shouldShowTearLake(records) {
  const tearLake = constellationConfig.tearLake;
  return records.filter((record) => tearLake.emotions.includes(record.emotion)).length >= tearLake.minimumStars;
}
