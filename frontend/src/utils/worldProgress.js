/**
 * Cálculo de progresso de exploração de um mundo/mar.
 * Retorna a ilha em que o jogador está, a fração concluída dela e o percentual
 * do mundo inteiro — usado na barra da jornada e no rodapé dos cards de mar.
 */
export function getWorldProgress(world, level) {
  const totalIslands = Math.max(1, world.islands.length);
  const reachedCount = world.islands.filter((island) => level >= island.minLevel).length;
  const activeIslandIdx = Math.max(0, reachedCount - 1);
  const activeIsland = world.islands[activeIslandIdx];
  const nextIsland = world.islands[activeIslandIdx + 1];

  let islandFraction = 1;
  if (nextIsland && nextIsland.minLevel > activeIsland.minLevel) {
    islandFraction = Math.min(1, Math.max(0, (level - activeIsland.minLevel) / (nextIsland.minLevel - activeIsland.minLevel)));
  }

  return {
    activeIslandIdx,
    activeIsland,
    nextIsland,
    islandFraction,
    missionIdx: Math.min(3, Math.floor(islandFraction * 3) + 1),
    percent: Math.round(((activeIslandIdx + islandFraction) / totalIslands) * 100),
  };
}
