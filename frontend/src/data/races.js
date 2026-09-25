export const RACES = [
  {
    id: "human",
    name: "Humano",
    rarity: "Comum",
    chance: 45, // 45% de chance
    hpMultiplier: 1.05,
    atkMultiplier: 1.05,
    dodgeChance: 0,
    description: "A raça mais populosa e dominante no mundo, responsável pela fundação do Governo Mundial. Possuem grande diversidade de tamanhos e aparências.",
    icon: "👤"
  },
  {
    id: "fishman",
    name: "Homem-Peixe (Gyojin)",
    rarity: "Rara",
    chance: 15,
    hpMultiplier: 1.25,
    atkMultiplier: 1.20,
    dodgeChance: 0,
    description: "Seres híbridos com força física descomunal (dez vezes maior que a de um humano comum) e grande resistência.",
    icon: "🦈"
  },
  {
    id: "merfolk",
    name: "Sereiano (Merfolk)",
    rarity: "Rara",
    chance: 10,
    hpMultiplier: 1.15,
    atkMultiplier: 1.15,
    dodgeChance: 10, // 10% de esquiva
    description: "Divididos entre tritões e sereias, possuem torso humano e cauda de peixe, com habilidade incomparável de natação e agilidade.",
    icon: "🧜"
  },
  {
    id: "skypiean",
    name: "Povo do Céu",
    rarity: "Rara",
    chance: 10,
    hpMultiplier: 1.10,
    atkMultiplier: 1.25, // Foco em poder de frutas/tecnologia
    dodgeChance: 5,
    description: "Divididos em Skypieans, Shandians e Bircans, caracterizados por pequenas asas nas costas e grande sintonia elemental.",
    icon: "🪽"
  },
  {
    id: "mink",
    name: "Mink",
    rarity: "Épica",
    chance: 6,
    hpMultiplier: 1.20,
    atkMultiplier: 1.30, // Dano extra de Electro
    dodgeChance: 8,
    description: "Tribo de humanóides mamíferos capazes de gerar eletricidade (Electro) e utilizar a transformação Sulong na lua cheia.",
    icon: "⚡"
  },
  {
    id: "giant",
    name: "Gigante",
    rarity: "Épica",
    chance: 5,
    hpMultiplier: 1.60, // Vida massiva
    atkMultiplier: 1.35,
    dodgeChance: 0,
    description: "Uma das raças mais fortes e resistentes do mundo, com tamanho colossal, famosos pelos guerreiros orgulhosos de Elbaph.",
    icon: "🗿"
  },
  {
    id: "dwarf",
    name: "Anão (Tontatta)",
    rarity: "Épica",
    chance: 4,
    hpMultiplier: 1.05,
    atkMultiplier: 1.25,
    dodgeChance: 25, // Agilidade/Esquiva altíssima
    description: "Pessoas minúsculas conhecidas por sua velocidade extrema, inocência e força física incrível apesar do tamanho.",
    icon: "🌱"
  },
  {
    id: "special_tribe",
    name: "Tribo Especial",
    rarity: "Épica",
    chance: 4,
    hpMultiplier: 1.25,
    atkMultiplier: 1.30,
    dodgeChance: 5,
    description: "Inclui as tribos dos Braços Longos, Pernas Longas, Pescoços de Cobra e a rara Tribo dos Três Olhos.",
    icon: "👁️"
  },
  {
    id: "lunarian",
    name: "Lunariano",
    rarity: "Lendária",
    chance: 1, // 1% de chance (Mítica/Lendária)
    hpMultiplier: 1.80, // Quase invulnerável
    atkMultiplier: 1.50,
    dodgeChance: 15,
    description: "Raça quase extinta de seres com asas negras, cabelos brancos e pele morena. Geram chamas e possuem resistência quase invulnerável.",
    icon: "🔥"
  }
];