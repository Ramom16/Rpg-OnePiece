// ==========================================
// ESTRUTURA DE MUNDOS (ESTILO BLOX FRUITS)
// Cada Mundo possui Ilhas, e cada Ilha possui 3 Missões:
//   1. Minions  2. Sub-Chefe  3. Chefe da Ilha
// Progressão: Mundo 1 (1-15) -> Mundo 2 (15-30) -> Mundo 3 (30-50)
// As 3 missões de uma ilha dão ~1-2 níveis no início e sustentam
// a jornada até o nível 50 (cap). Sem necessidade de grind.
// ==========================================
export const WORLDS = [
  {
    id: "world1",
    name: "Mundo 1",
    subtitle: "Primeiro Mar",
    levels: "Níveis 1 ao 15",
    requiredLevel: 1,
    requiredProgress: 1,
    islands: [
      {
        id: "w1_i1",
        name: "Vila Foosha & Shells Town",
        area: "East Blue",
        minLevel: 1,
        quests: [
          { id: "w1_i1_q1", title: "Derrotar Bandidos de Higuma", type: "Minions", enemyHp: 80, enemyAtk: 10, rewardXp: 65, rewardBerries: 300 },
          { id: "w1_i1_q2", title: "Derrotar Marinheiros Corruptos", type: "Minions", enemyHp: 90, enemyAtk: 12, rewardXp: 70, rewardBerries: 350 },
          { id: "w1_i1_q3", title: "Capitão Morgan", type: "Chefe", isBoss: true, enemyHp: 130, enemyAtk: 16, rewardXp: 85, rewardBerries: 900 }
        ]
      },
      {
        id: "w1_i2",
        name: "Arlong Park",
        area: "East Blue",
        minLevel: 2,
        quests: [
          { id: "w1_i2_q1", title: "Batida nos Piratas Homens-Peixe", type: "Minions", enemyHp: 150, enemyAtk: 16, rewardXp: 105, rewardBerries: 700 },
          { id: "w1_i2_q2", title: "Derrotar Hatchan dos Seis Sabres", type: "Sub-Chefe", enemyHp: 180, enemyAtk: 18, rewardXp: 115, rewardBerries: 800 },
          { id: "w1_i2_q3", title: "Arlong", type: "Chefe", isBoss: true, enemyHp: 250, enemyAtk: 25, rewardXp: 140, rewardBerries: 2200 }
        ]
      },
      {
        id: "w1_i3",
        name: "Alabasta",
        area: "Grand Line",
        minLevel: 4,
        quests: [
          { id: "w1_i3_q1", title: "Combater Agentes da Baroque Works", type: "Minions", enemyHp: 220, enemyAtk: 22, rewardXp: 140, rewardBerries: 1400 },
          { id: "w1_i3_q2", title: "Derrotar Mr. 1 (Daz Bonez)", type: "Sub-Chefe", enemyHp: 270, enemyAtk: 26, rewardXp: 155, rewardBerries: 1600 },
          { id: "w1_i3_q3", title: "Sir Crocodile", type: "Chefe", isBoss: true, enemyHp: 360, enemyAtk: 36, rewardXp: 185, rewardBerries: 4500 }
        ]
      },
      {
        id: "w1_i4",
        name: "Enies Lobby",
        area: "Grand Line",
        minLevel: 7,
        quests: [
          { id: "w1_i4_q1", title: "Invadir a Ilha Judiciária (Agentes CP9)", type: "Minions", enemyHp: 300, enemyAtk: 30, rewardXp: 180, rewardBerries: 2800 },
          { id: "w1_i4_q2", title: "Derrotar Kaku", type: "Sub-Chefe", enemyHp: 360, enemyAtk: 35, rewardXp: 200, rewardBerries: 3200 },
          { id: "w1_i4_q3", title: "Rob Lucci", type: "Chefe", isBoss: true, enemyHp: 480, enemyAtk: 48, rewardXp: 240, rewardBerries: 9000 }
        ]
      },
      {
        id: "w1_i5",
        name: "Marineford",
        area: "Grand Line",
        minLevel: 9,
        quests: [
          { id: "w1_i5_q1", title: "Enfrentar os Pacifistas", type: "Minions", enemyHp: 400, enemyAtk: 38, rewardXp: 225, rewardBerries: 5000 },
          { id: "w1_i5_q2", title: "Batida contra os Vice-Almirantes", type: "Sub-Chefe", enemyHp: 480, enemyAtk: 45, rewardXp: 250, rewardBerries: 6000 },
          { id: "w1_i5_q3", title: "Almirante Akainu", type: "Chefe", isBoss: true, enemyHp: 640, enemyAtk: 62, rewardXp: 305, rewardBerries: 16000 }
        ]
      },
      {
        id: "w1_i6",
        name: "Dressrosa",
        area: "Novo Mundo",
        minLevel: 12,
        quests: [
          { id: "w1_i6_q1", title: "Enfrentar Executivos da Família Donquixote", type: "Minions", enemyHp: 520, enemyAtk: 50, rewardXp: 300, rewardBerries: 9000 },
          { id: "w1_i6_q2", title: "Derrotar Senor Pink", type: "Sub-Chefe", enemyHp: 620, enemyAtk: 58, rewardXp: 340, rewardBerries: 10000 },
          { id: "w1_i6_q3", title: "Donquixote Doflamingo", type: "Chefe", isBoss: true, unlockWorld: 2, enemyHp: 840, enemyAtk: 82, rewardXp: 420, rewardBerries: 28000 }
        ]
      }
    ]
  },
  {
    id: "world2",
    name: "Mundo 2",
    subtitle: "Segundo Mar",
    levels: "Níveis 15 ao 30",
    requiredLevel: 15,
    requiredProgress: 2,
    islands: [
      {
        id: "w2_i1",
        name: "Zou",
        area: "Novo Mundo",
        minLevel: 15,
        quests: [
          { id: "w2_i1_q1", title: "Repelir Invasores Piratas", type: "Minions", enemyHp: 700, enemyAtk: 65, rewardXp: 660, rewardBerries: 15000 },
          { id: "w2_i1_q2", title: "Enfrentar Guardiões de Zou", type: "Sub-Chefe", enemyHp: 830, enemyAtk: 76, rewardXp: 730, rewardBerries: 17000 },
          { id: "w2_i1_q3", title: "Jack a Seca", type: "Chefe", isBoss: true, enemyHp: 1150, enemyAtk: 108, rewardXp: 910, rewardBerries: 45000 }
        ]
      },
      {
        id: "w2_i2",
        name: "Whole Cake Island",
        area: "Novo Mundo",
        minLevel: 20,
        quests: [
          { id: "w2_i2_q1", title: "Destruir Soldados de Biscoito", type: "Minions", enemyHp: 950, enemyAtk: 85, rewardXp: 780, rewardBerries: 23000 },
          { id: "w2_i2_q2", title: "Derrotar Charlotte Cracker", type: "Sub-Chefe", enemyHp: 1150, enemyAtk: 100, rewardXp: 860, rewardBerries: 26000 },
          { id: "w2_i2_q3", title: "Imperatriz Big Mom", type: "Chefe", isBoss: true, enemyHp: 1550, enemyAtk: 145, rewardXp: 1060, rewardBerries: 70000 }
        ]
      },
      {
        id: "w2_i3",
        name: "Wano",
        area: "Novo Mundo",
        minLevel: 25,
        quests: [
          { id: "w2_i3_q1", title: "Derrotar Astros Principais", type: "Minions", enemyHp: 1300, enemyAtk: 115, rewardXp: 920, rewardBerries: 35000 },
          { id: "w2_i3_q2", title: "Derrotar King a Chamas", type: "Sub-Chefe", enemyHp: 1550, enemyAtk: 135, rewardXp: 1020, rewardBerries: 40000 },
          { id: "w2_i3_q3", title: "Kaido das Cem Feras", type: "Chefe", isBoss: true, unlockWorld: 3, enemyHp: 2100, enemyAtk: 200, rewardXp: 1260, rewardBerries: 105000 }
        ]
      }
    ]
  },
  {
    id: "world3",
    name: "Mundo 3",
    subtitle: "Terceiro Mar",
    levels: "Níveis 30 ao 50",
    requiredLevel: 30,
    requiredProgress: 3,
    islands: [
      {
        id: "w3_i1",
        name: "Egghead",
        area: "Red Line",
        minLevel: 30,
        quests: [
          { id: "w3_i1_q1", title: "Reter a invasão dos Seraphims", type: "Minions", enemyHp: 1800, enemyAtk: 155, rewardXp: 2250, rewardBerries: 52000 },
          { id: "w3_i1_q2", title: "Derrotar CP0 Lucci", type: "Sub-Chefe", enemyHp: 2150, enemyAtk: 180, rewardXp: 2500, rewardBerries: 58000 },
          { id: "w3_i1_q3", title: "Almirante Kizaru", type: "Chefe", isBoss: true, enemyHp: 2900, enemyAtk: 270, rewardXp: 3050, rewardBerries: 150000 }
        ]
      },
      {
        id: "w3_i2",
        name: "Elbaf",
        area: "O Arco Final",
        minLevel: 40,
        quests: [
          { id: "w3_i2_q1", title: "Provar-se aos Gigantes Guerreiros", type: "Minions", enemyHp: 2600, enemyAtk: 230, rewardXp: 2900, rewardBerries: 80000 },
          { id: "w3_i2_q2", title: "Derrotar Guardiões Anciões de Elbaf", type: "Sub-Chefe", enemyHp: 3100, enemyAtk: 265, rewardXp: 3200, rewardBerries: 90000 },
          { id: "w3_i2_q3", title: "O Rei / Lorde Supremo de Elbaf", type: "Chefe Final", isBoss: true, finalBoss: true, enemyHp: 4200, enemyAtk: 380, rewardXp: 3900, rewardBerries: 240000 }
        ]
      }
    ]
  }
];

// ==========================================
// MISSÕES SECUNDÁRIAS (CAÇAS REPETÍVEIS - FARM OPCIONAL)
// ==========================================
export const SIDE_QUESTS = [
  { id: "sec_1", title: "Caçar Piratas do East Blue", sea: "Mundo 1", minLevel: 1, enemyHp: 70, enemyAtk: 8, rewardXp: 120, rewardBerries: 600 },
  { id: "sec_2", title: "Limpar o Navio da Marinha", sea: "Mundo 1", minLevel: 6, enemyHp: 200, enemyAtk: 20, rewardXp: 250, rewardBerries: 3000 },
  { id: "sec_3", title: "Escoltar Mercadores de Water 7", sea: "Mundo 1", minLevel: 12, enemyHp: 400, enemyAtk: 38, rewardXp: 400, rewardBerries: 9000 },
  { id: "sec_4", title: "Mineração de Pedras do Mar (Seastone)", sea: "Mundo 2", minLevel: 20, enemyHp: 1000, enemyAtk: 95, rewardXp: 900, rewardBerries: 30000 },
  { id: "sec_5", title: "Patrulha do Segundo Mar", sea: "Mundo 2", minLevel: 28, enemyHp: 1800, enemyAtk: 160, rewardXp: 1600, rewardBerries: 70000 },
  { id: "sec_6", title: "Caçada de Alto Nível no Terceiro Mar", sea: "Mundo 3", minLevel: 38, enemyHp: 3000, enemyAtk: 260, rewardXp: 2800, rewardBerries: 150000 }
];

// ==========================================
// MISSÕES DE ARMAS LENDÁRIAS (QUIZ + CHEFÃO - BÔNUS OPCIONAL)
// ==========================================
export const LEGENDARY_WEAPON_QUESTS = [
  {
    id: "quest_enma",
    weaponReward: "enma",
    title: "O Domínio do Haki em Wano",
    sea: "Mundo 1",
    minLevel: 8,
    quiz: {
      question: "Quem foi o ferreiro original responsável por forjar a lendária espada Enma?",
      options: ["Tenguyama Hitetsu", "Shimotsuki Kozaburo", "Kurozumi Semimaru", "Roronoa Arashi"],
      correctIndex: 1
    },
    boss: { name: "Espírito de Enma", hp: 700, atk: 60, rewardXp: 600, rewardBerries: 30000 }
  },
  {
    id: "quest_yoru",
    weaponReward: "yoru",
    title: "O Duelo no Restaurante Baratie",
    sea: "Mundo 2",
    minLevel: 18,
    quiz: {
      question: "Qual o grau de classificação da espada Yoru do Mihawk?",
      options: ["Meito: Owazamono", "Saijo O Wazamono (12 Supramas)", "Ryo Wazamono", "Wazamono"],
      correctIndex: 1
    },
    boss: { name: "Dracule Mihawk (Projeção)", hp: 1300, atk: 110, rewardXp: 1200, rewardBerries: 90000 }
  },
  {
    id: "quest_gryphon",
    weaponReward: "gryphon",
    title: "A Vontade do Ruivo",
    sea: "Mundo 2",
    minLevel: 28,
    quiz: {
      question: "Em qual ilha Shanks usou o golpe 'Kamusari' (Departure) usando a Gryphon?",
      options: ["Marineford", "Fousha", "Elbaf", "Sphinx"],
      correctIndex: 2
    },
    boss: { name: "Shanks (Sombra)", hp: 2200, atk: 180, rewardXp: 2200, rewardBerries: 200000 }
  },
  {
    id: "quest_ace",
    weaponReward: "ace_sword",
    title: "A Herança do Rei dos Piratas",
    sea: "Mundo 3",
    minLevel: 42,
    quiz: {
      question: "Qual era o nome do navio principal utilizado por Gol D. Roger e sua tripulação?",
      options: ["Thousand Sunny", "Oro Jackson", "Red Force", "Dreadnaught Sabre"],
      correctIndex: 1
    },
    boss: { name: "Gol D. Roger (Memória de Batalha)", hp: 3600, atk: 300, rewardXp: 4000, rewardBerries: 500000 }
  }
];