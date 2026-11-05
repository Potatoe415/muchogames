// Road lanes of a level: random cars (more models as levels go up), one car
// per lane on level 1, two from level 2, and a train on the middle verge
// from level 5.
const ROAD_ROWS = [6, 7, 8, 9];

function carPool(level) {
  const pool = ["car_blue", "car_green", "car_lambo", "car_taxi", "car_red"];
  if (level >= 3) pool.push("car_f1");
  if (level >= 4) pool.push("car_bus");
  if (level >= 6) pool.push("car_pink");
  return pool;
}

const pick = (pool) => pool[Math.floor(Math.random() * pool.length)];

export function getRoadObstacles(level, balance) {
  const pool = carPool(level);
  const obstacles = [];
  ROAD_ROWS.forEach((row) => {
    const speed = balance.roadLaneSpeeds[row];
    if (level === 1) {
      obstacles.push({ sprite: pick(pool), row, speed, x: Math.random() * 600 });
      return;
    }
    const x = Math.random() * 200;
    obstacles.push({ sprite: pick(pool), row, speed, x });
    obstacles.push({ sprite: pick(pool), row, speed, x: x + balance.roadCarGap });
  });
  if (level >= 5) obstacles.push(train(balance));
  return obstacles;
}

function train(balance) {
  const goesRight = Math.random() < 0.5;
  const speed = Math.abs(balance.trainSpeed);
  return {
    sprite: "train",
    row: 5,
    speed: goesRight ? speed : -speed,
    x: goesRight ? -balance.trainStartX : balance.trainStartX
  };
}
