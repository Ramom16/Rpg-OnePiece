export const RAIDS = [
  {
    id: "buggy_alliance",
    title: "Aliança dos Piratas Buggy",
    minLevel: 5,
    rewardBerries: 50000,
    rewardXp: 500,
    rewardRaceRolls: 1,
    description: "Enfrente o circo de horrores do Capitão Buggy e seus aliados.",
    waves: [
      { name: "Cabaji & Mohji", hp: 300, atk: 25 },
      { name: "Alvida da Clava de Ferro", hp: 500, atk: 40 },
      { name: "Capitão Buggy o Palhaço", hp: 800, atk: 60 }
    ]
  },
  {
    id: "cp9_invasion",
    title: "Invasão da CP9 em Enies Lobby",
    minLevel: 12,
    rewardBerries: 120000,
    rewardXp: 1200,
    rewardRaceRolls: 1,
    description: "Supere os assassinos do Governo Mundial do estilo Rokushiki.",
    waves: [
      { name: "Fukuro & Kumadori", hp: 1200, atk: 90 },
      { name: "Jabra & Kaku", hp: 2000, atk: 140 },
      { name: "Rob Lucci (Forma Leopardo)", hp: 3200, atk: 210 }
    ]
  },
  {
    id: "shichibukai_lineup",
    title: "Os Sete Corsários (Shichibukai)",
    minLevel: 18,
    rewardBerries: 250000,
    rewardXp: 2500,
    rewardRaceRolls: 2,
    description: "Testes de força contra os piratas aliados do Governo.",
    waves: [
      { name: "Sir Crocodile", hp: 3500, atk: 220 },
      { name: "Bartholomew Kuma", hp: 5000, atk: 290 },
      { name: "Dracule Mihawk", hp: 7500, atk: 380 }
    ]
  },
  {
    id: "navy_admirals",
    title: "Três Almirantes da Marinha",
    minLevel: 25,
    rewardBerries: 500000,
    rewardXp: 5000,
    rewardRaceRolls: 2,
    description: "Confronto direto contra a maior força militar do mundo.",
    waves: [
      { name: "Almirante Kizaru (Luz)", hp: 8000, atk: 450 },
      { name: "Almirante Aokiji (Gelo)", hp: 11000, atk: 550 },
      { name: "Almirante Akainu (Magma)", hp: 15000, atk: 700 }
    ]
  },
  {
    id: "whitebeard_crew",
    title: "Frota do Barba Branca",
    minLevel: 30,
    rewardBerries: 800000,
    rewardXp: 8000,
    rewardRaceRolls: 3,
    description: "Desafie os comandantes da frota do Homem Mais Forte do Mundo.",
    waves: [
      { name: "Vista da Espada Dupla", hp: 12000, atk: 600 },
      { name: "Marco a Fênix", hp: 18000, atk: 750 },
      { name: "Edward Newgate (Barba Branca)", hp: 25000, atk: 950 }
    ]
  },
  {
    id: "beast_pirates",
    title: "Piratas das Feras (Wano)",
    minLevel: 35,
    rewardBerries: 1200000,
    rewardXp: 12000,
    rewardRaceRolls: 3,
    description: "Sobreviva aos Três Astros Principais e ao Dragão de Wano.",
    waves: [
      { name: "Jack a Seca", hp: 20000, atk: 850 },
      { name: "Queen a Praga", hp: 28000, atk: 1050 },
      { name: "King a Chamas", hp: 38000, atk: 1300 },
      { name: "Kaido das Cem Feras", hp: 55000, atk: 1700 }
    ]
  },
  {
    id: "red_hair_pirates",
    title: "Bando do Ruivo",
    minLevel: 40,
    rewardBerries: 1800000,
    rewardXp: 18000,
    rewardRaceRolls: 4,
    description: "Uma das tripulações mais equilibradas e temidas dos mares.",
    waves: [
      { name: "Yasopp & Lucky Roux", hp: 32000, atk: 1200 },
      { name: "Benn Beckman", hp: 48000, atk: 1600 },
      { name: "Shanks o Ruivo", hp: 70000, atk: 2200 }
    ]
  },
  {
    id: "blackbeard_pirates",
    title: "Piratas do Barba Negra",
    minLevel: 42,
    rewardBerries: 2500000,
    rewardXp: 22000,
    rewardRaceRolls: 4,
    description: "Enfrente os criminosos mais perigosos libertados de Impel Down.",
    waves: [
      { name: "Shiryu da Chuva", hp: 45000, atk: 1500 },
      { name: "Kuzan (Ex-Almirante)", hp: 65000, atk: 2000 },
      { name: "Marshall D. Teach (Barba Negra)", hp: 90000, atk: 2800 }
    ]
  },
  {
    id: "roger_pirates",
    title: "A Lendária Tripulação de Gol D. Roger",
    minLevel: 48,
    rewardBerries: 4000000,
    rewardXp: 35000,
    rewardRaceRolls: 5,
    description: "Desafie os conquistadores que encontraram o One Piece.",
    waves: [
      { name: "Scopper Gaban", hp: 60000, atk: 2100 },
      { name: "Silvers Rayleigh (O Rei das Trevas)", hp: 95000, atk: 3000 },
      { name: "Gol D. Roger (O Rei dos Piratas)", hp: 140000, atk: 4200 }
    ]
  },
  {
    id: "god_valley_rocks",
    title: "Os Piratas de Rocks (Deus das Sombras)",
    minLevel: 50,
    rewardBerries: 10000000,
    rewardXp: 50000,
    rewardRaceRolls: 10,
    description: "A Raid mais difícil do jogo: a tripulação mais maligna da história.",
    waves: [
      { name: "Big Mom (Jovem)", hp: 80000, atk: 2500 },
      { name: "Kaido (Jovem)", hp: 110000, atk: 3400 },
      { name: "Barba Branca (Jovem)", hp: 150000, atk: 4500 },
      { name: "Rocks D. Xebec", hp: 220000, atk: 6500 }
    ]
  }
];