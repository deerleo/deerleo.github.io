'use strict';
// ───────── mundo: mapas, movimiento, personajes, historia ─────────
const MAPS = {
  pueblo: { w: 24, h: 45, rows: [
    '########################', '##########::############', '######....::......######', '####......::."""""..####', '###...S...::.""""""..###',
    '###.......::.""""""",###', '###"""""..:::.""""..,###', '###""""""..::........###', '###"""""""..:::::....###', '###LLLLLLLLLLL.::LLLL###',
    '###..........,.::....###', '###.~~~~~.....::."""",##', '###~~~~~~~....::.""""".#', '###~~~~~~~~..::..""""".#', '###.~~~~~~...::...""..##',
    '###...~~....::.......###', '####.......::...=====.##', '####"""""..::...=...=.##', '###""""""".::...=...=.##', '###""""""".::...==.==.##',
    '###.""""""::..........##', '###LLLLLL.::.LLLLLLLL.##', '###.......::....,.....##', '####..S...::.."""""..###', '#####.....::.""""""".###',
    '######....::.""""""..###', '########..::..""""..####', '#########.::.###########', '#########.::.###########', '###.......::.........###',
    '###..,....::.........###', '###.......::.........###', '###.......::.........###', '###.......::.........###', '###..:....::....:....###',
    '###..::::::::::::....###', '###.......::S.....,..###', '###.,.....::.........###', '###.......::..~~~~~..###', '###..::::::..~~~~~~~.###',
    '###..........~~~~~~~.###', '###..........,~~~~~..###', '###.=====.....,......###', '###..................###', '########################'],
    objects: [
      { k: 'casa', x: 4, y: 31, w: 4, h: 3, door: 1, roof: ['#f8a888', '#e86048', '#b84030', '#7a2820'] },
      { k: 'casa', x: 14, y: 30, w: 6, h: 4, door: 2, lab: 1, dc: '#58b8b0', roof: ['#b8ece4', '#58b8b0', '#308888', '#1c5c64'] },
      { k: 'casa', x: 4, y: 36, w: 4, h: 3, door: 1, dc: '#5878c8', roof: ['#a8c0f8', '#5878c8', '#3c50a0', '#283470'] },
      { k: 'poste', x: 13, y: 37, w: 1, h: 1 }, { k: 'chatarra', x: 17, y: 17, w: 3, h: 2 }, { k: 'valla', x: 10, y: 2, w: 1, h: 1 },
      { k: 'palo', x: 4, y: 22, w: 1, h: 1, to: [20, 22] }, { k: 'palo', x: 20, y: 22, w: 1, h: 1 }, { k: 'palo', x: 4, y: 10, w: 1, h: 1, to: [20, 10] }, { k: 'palo', x: 20, y: 10, w: 1, h: 1 },
    ],
    warps: { '16,33': { map: 'taller', x: 4, y: 7, dir: 1 }, '10,0': { map: 'ruta2', x: 10, y: 41, dir: 1 }, '11,0': { map: 'ruta2', x: 11, y: 41, dir: 1 } },
    area: y => y >= 28 ? ['PUEBLO BOBINA', 'pueblo'] : ['RUTA 1', 'ruta'],
  },
  taller: { w: 10, h: 8, indoor: 1, paint: paintTaller, rows: ['XXXXXXXXXX', 'XXXXXXXXXX', 'XX.....XXX', '...XXX....', '..........', 'X........X', '..........', '..........'],
    warps: { '4,8': { map: 'pueblo', x: 16, y: 34, dir: 0 }, '5,8': { map: 'pueblo', x: 16, y: 34, dir: 0 } }, area: () => ['TALLER ESTAÑO', 'pueblo'] },
  ruta2: { w: 24, h: 42, wild: 'RUTA 2', rows: [
    '########################', '#######..........#######', '####................####', '####..............,.####', '###.,................###',
    '###.....................', '###..::::::::::::::..:::', '###...,....::......,....', '###.S......::..""""".###', '###........::..""""".###',
    '##.LLLLLLLL::LLLLLLLL.##', '##.........::.......,.##', '##"""""....::....###..##', '##"""""....::...####..##', '##"""""....::...####..##',
    '##.........::...###...##', '#...~~~~...::::::::::.##', '#.~~~~~~~..::::::::::.##', '#.~~~~~~~~.........::.##', '#.~~~~~~~~...,.....::.##',
    '#.~~~~~~~~.."""""".::.##', '##.~~~~~...."""""".::.##', '##.........."""""".::.##', '##LLLLLLLLLLLLLLLLL::L##', '##....,.......:::::::.##',
    '##............:::::::.##', '##............::......##', '##............::......##', '##""""......,.::."""".##', '##""""........::."""".##',
    '##""""........::."""".##', '##........::::::......##', '##........::::::...,..##', '##....,...::S.........##', '####......::........####',
    '#####.....::.......#####', '######....::...,..######', '########..::....########', '#########.::.###########', '#########.::.###########',
    '#########.::.###########', '#########.::.###########'],
    objects: [
      { k: 'central', x: 7, y: 1, w: 10, h: 5, door: 4 }, { k: 'poste', x: 16, y: 7, w: 1, h: 1 },
      { k: 'torre', x: 21, y: 30, w: 1, h: 1, to: [21 * 16 + 8, 12 * 16 - 39] }, { k: 'torre', x: 21, y: 12, w: 1, h: 1, to: [15 * 16, 1 * 16 + 4] },
      { k: 'chatarra', x: 3, y: 31, w: 3, h: 2 }, { k: 'chatarra', x: 16, y: 34, w: 3, h: 2 },
      { k: 'barrera', x: 22, y: 5, w: 1, h: 3, until: 'luz', msg: 'Valla de la Compañía APAGÓN: «CIUDAD DINAMO, cerrada por apagón». Hasta que la Central vuelva a funcionar, no pasa nadie.' },
    ],
    warps: { '24,5': { map: 'ciudad', x: 0, y: 11, dir: 3 }, '24,6': { map: 'ciudad', x: 0, y: 12, dir: 3 }, '24,7': { map: 'ciudad', x: 0, y: 13, dir: 3 }, '10,42': { map: 'pueblo', x: 10, y: 1, dir: 0 }, '11,42': { map: 'pueblo', x: 11, y: 1, dir: 0 }, '11,5': { map: 'central', x: 6, y: 15, dir: 1 }, '12,5': { map: 'central', x: 7, y: 15, dir: 1 } },
    area: y => y >= 11 ? ['RUTA 2', 'ruta2'] : ['AFUERAS DE DINAMO', 'ruta2'],
  },
  central: { w: 14, h: 16, indoor: 1, dark: 1, cables: 1, paint: paintCentral, dyn: (cx, cy) => dynCentral(cx, cy), rows: [
    'XXXXXXXXXXXXXX', 'XXXXXXXXXXXXXX', 'XXXX......XXXX', 'XX..........XX', 'XX..........XX',
    'XXBB..XX..BBXX', 'X.....XX.....X', 'X.....XX.....X', 'X.....XX.....X', 'X............X',
    'XBB...BB...BBX', 'X.....BB.....X', 'X............X', 'X............X', 'X............X',
    'XXXXXX..XXXXXX'],
    objects: [{ k: 'turbina', x: 5, y: 0, w: 4, h: 3 }, { k: 'gen', n: 0, x: 2, y: 7, w: 2, h: 2 }, { k: 'gen', n: 1, x: 10, y: 7, w: 2, h: 2 }, { k: 'gen', n: 2, x: 2, y: 12, w: 2, h: 2 }],
    warps: { '6,16': { map: 'ruta2', x: 11, y: 6, dir: 0 }, '7,16': { map: 'ruta2', x: 12, y: 6, dir: 0 } },
    area: () => ['CENTRAL DINAMO', G.flags.luz ? 'ruta2' : 'central'],
  },
  ciudad: { w: 30, h: 26, rows: [
    '##############################', '#........####.PP.............#', '#........####.PP.............#', '#........####.PP.............#', '#........####.PP.............#',
    '#........####.PP.............#', '#.............PP.PPPPPPPPPPP.#', '#.............PP.PPPPPPPPPPP.#', '#..PPPP.......PP.PPPPPPPPPPP.#', '#..PPPP.......PP.PPPPPPPPPPP.#',
    '#..PPPP.......PPSPPPPPPPPPPP.#', 'PPPPPPPPPPPPPPPPPPPPPPPPPPPPPP', 'PPPPPPPPPPPPPPPPPPPPPPPPPPPPPP', 'PPPPPPPPPPPPPPPPPPPPPPPPPPPPPP', '#PPPPPPPPPPPPSPPPPPPPPPPPPPPP#',
    '#.......,.....PPPP...........#', '#...........,.PPPP...........#', '#.............PPPP...........#', '#.PPPPPP......PPPPPPPPPPPPPP.#', '#.............PP.............#',
    '#........,....PP.............#', '#....,.....,..PP....,......,.#', '#.............PP.............#', '#.PPPPP.......PP.......PPPPP.#', '#.............PP.............#',
    '##############PP##############'],
    objects: [
      { k: 'torreApagon', x: 2, y: 1, w: 6, h: 7, door: 2 }, { k: 'central', x: 18, y: 1, w: 8, h: 5, door: 3, sign: 'SUBESTACIÓN', lit: 1 },
      { k: 'edif', x: 2, y: 15, w: 5, h: 3, door: 2, sign: 'FERRETERÍA', wall: '#e8dcc0', roof: '#5c7c78', awning: ['#e84838', '#f8f0e0'], signBg: '#2c5c58' },
      { k: 'casa', x: 18, y: 15, w: 4, h: 3, door: 1, dc: '#5878c8', roof: ['#f8d888', '#e8a838', '#b87820', '#7a4c18'] },
      { k: 'estacion', x: 23, y: 15, w: 6, h: 3, door: 2 },
      { k: 'casa', x: 2, y: 20, w: 4, h: 3, door: 1, roof: ['#c8e8a8', '#78b858', '#4c8c3c', '#2c5c2c'] },
      { k: 'casa', x: 23, y: 20, w: 4, h: 3, door: 2, dc: '#a85878', roof: ['#e8b8d8', '#c878a8', '#985078', '#683050'] },
      { k: 'fuente', x: 8, y: 16, w: 3, h: 2 }, { k: 'poste', x: 12, y: 15, w: 1, h: 1 }, { k: 'banco', x: 10, y: 20, w: 2, h: 1 }, { k: 'banco', x: 6, y: 18, w: 2, h: 1 },
      { k: 'arbusto', x: 12, y: 22, w: 1, h: 1 }, { k: 'arbusto', x: 8, y: 23, w: 1, h: 1 }, { k: 'arbusto', x: 1, y: 16, w: 1, h: 1 },
      { k: 'farola', x: 8, y: 10, w: 1, h: 1 }, { k: 'farola', x: 13, y: 10, w: 1, h: 1 }, { k: 'farola', x: 28, y: 10, w: 1, h: 1 }, { k: 'farola', x: 17, y: 16, w: 1, h: 1 }, { k: 'farola', x: 13, y: 18, w: 1, h: 1 }, { k: 'farola', x: 28, y: 18, w: 1, h: 1 },
      { k: 'barrera', x: 28, y: 11, w: 1, h: 3, until: 'casco', msg: 'Un cartel: «RUTA 5 hacia la MINA IMANTA. Prohibido el paso sin CASCO MINERO». Hay un casco dibujado con mucha seriedad.' },
      { k: 'barrera', x: 14, y: 23, w: 2, h: 1, until: 'pase', msg: 'OBRAS DE LA RUTA 3. Prohibido el paso sin PASE DE OBRA firmado por la Subestación.' },
    ],
    warps: { '-1,11': { map: 'ruta2', x: 23, y: 5, dir: 2 }, '-1,12': { map: 'ruta2', x: 23, y: 6, dir: 2 }, '-1,13': { map: 'ruta2', x: 23, y: 7, dir: 2 },
      '4,7': { map: 'torre', x: 6, y: 10, dir: 1, need: 'llaveTorre', locked: 'La puerta de la TORRE APAGÓN tiene un lector de tarjetas. Pita en rojo y te mira mal.' },
      '21,5': { map: 'subestacion', x: 6, y: 12, dir: 1 }, '22,5': { map: 'subestacion', x: 7, y: 12, dir: 1 },
      '4,17': { map: 'ferreteria', x: 4, y: 5, dir: 1 }, '19,17': { map: 'casaReloj', x: 3, y: 4, dir: 1 }, '25,17': { map: 'estacion', x: 5, y: 6, dir: 1 },
      '3,22': { map: 'casaVerde', x: 3, y: 4, dir: 1 }, '25,22': { map: 'casaRosa', x: 3, y: 4, dir: 1 },
      '29,11': { map: 'ruta5', x: 0, y: 10, dir: 3 }, '29,12': { map: 'ruta5', x: 0, y: 11, dir: 3 }, '29,13': { map: 'ruta5', x: 0, y: 12, dir: 3 }, '14,26': { map: 'ruta3', x: 10, y: 1, dir: 0 }, '15,26': { map: 'ruta3', x: 11, y: 1, dir: 0 } },
    area: () => ['CIUDAD DINAMO', 'ciudad'],
  },
  subestacion: { w: 14, h: 14, indoor: 1, type: 'CHISPA', env: 'gym', paint: paintGym, rows: [
    'XXXXXXXXXXXXXX', 'XXXXXXXXXXXXXX', 'XX..........XX', 'XX..........XX', 'XXXXX....XXXXX',
    'X............X', 'X..B......B..X', 'X............X', 'XXXX......XXXX', 'X............X',
    'X..B......B..X', 'X............X', 'X............X', 'XXXXXX..XXXXXX'],
    objects: [{ k: 'barrera', kind: 'electrica', x: 4, y: 8, w: 6, h: 1, until: 'opDinamo1', msg: 'Una cerca electrificada. Se apaga cuando venzas al operario de esta sala.' },
      { k: 'barrera', kind: 'electrica', x: 5, y: 4, w: 4, h: 1, until: 'opDinamo2', msg: 'Otra cerca. El operario de arriba tiene el interruptor.' }],
    warps: { '6,14': { map: 'ciudad', x: 21, y: 6, dir: 0 }, '7,14': { map: 'ciudad', x: 22, y: 6, dir: 0 } },
    area: () => ['SUBESTACIÓN DINAMO', G.fusibles.includes('CHISPA') ? 'ciudad' : 'gimnasio'],
  },
  ferreteria: { w: 9, h: 7, indoor: 1, room: 'ferreteria', paint: paintRoom, rows: ['XXXXXXXXX', 'XXXXXXXXX', 'X.SS...pX', 'X...CCC.X', 'X.......X', 'XS..r..SX', 'XXXX.XXXX'],
    warps: { '4,7': { map: 'RET' } }, area: () => ['FERRETERÍA', 'tienda'] },
  casaReloj: { w: 8, h: 6, indoor: 1, room: 'casa', paint: paintRoom, rows: ['XXXXXXXX', 'XXXXXXXX', 'Xk..b.pX', 'X..T...X', 'X..r...X', 'XXX.XXXX'],
    warps: { '3,6': { map: 'ciudad', x: 19, y: 18, dir: 0 } }, area: () => ['CASA DE LOS TICTAC', 'ciudad'] },
  casaVerde: { w: 8, h: 6, indoor: 1, room: 'casa', paint: paintRoom, rows: ['XXXXXXXX', 'XXXXXXXX', 'XK.Sb.kX', 'X...T..X', 'X...r..X', 'XXX.XXXX'],
    warps: { '3,6': { map: 'ciudad', x: 3, y: 23, dir: 0 } }, area: () => ['CASA DE LOS ARANDA', 'ciudad'] },
  casaRosa: { w: 8, h: 6, indoor: 1, room: 'casa', paint: paintRoom, rows: ['XXXXXXXX', 'XXXXXXXX', 'Xp.S.bkX', 'X..T...X', 'X..r...X', 'XXX.XXXX'],
    warps: { '3,6': { map: 'ciudad', x: 25, y: 23, dir: 0 } }, area: () => ['CASA DE LA ABUELA OLVIDO', 'ciudad'] },
  estacion: { w: 11, h: 8, indoor: 1, room: 'estacion', paint: paintRoom, rows: ['XXXXXXXXXXX', 'XXXXXXXXXXX', 'XS.......SX', 'X...CCC...X', 'XT.T...T.TX', 'X.........X', 'X...rrr...X', 'XXXXX.XXXXX'],
    warps: { '5,8': { map: 'ciudad', x: 25, y: 18, dir: 0 } }, area: () => ['ESTACIÓN DE DINAMO', 'ciudad'] },
  ruta3: { w: 24, h: 40, wild: 'RUTA 3', rows: [
    '#########.::.###########', '##........::..........##', '#####.....::S....###..##', '#####..,..::.....###..##', '#####.....::..RRR###..##',
    '##........::..RRR###..##', '##........::..RRR.....##', '##...:::::::..RRR.....##', '##...:::::::..RRR.....##', '##...::.......RRR.....##',
    '##"""::...............##', '##"""::......"""""""..##', '##"""::......"""""""..##', '##"""::......"""""""..##', '##"""::........aa~~~~~~~',
    '##...::........aa~~~~~~~', '##...::........aa~~~~~~~', '##...::::::....aa~~~~~~~', '##LLL::::::LLLLaa~~~~~~~', '##.......::"""""a~~~~~~~',
    '##RR.....::"""""~~~~~~~~', '##RR.....::"""""~~~~~~~~', '##RR..,..::"""""~~~~~~~~', '##RR.....::"""""~~~~~~~~', '##RR.....::...aa~~~~~~~~',
    '##RR.....::...aa~~~~~~~~', '##.""""".::..aa~~~~~~~~~', '##.""""".::::aa~~~~~~~~~', '##.""""".::::aa~~~~~~~~~', '##.........::aa~~~~~~~~~',
    '##aaaaaaaaa::aa~~~~~~~~~', '##aaaaaaaaa::aa~~~~~~~~~', '##aaaaaaaaa::a~~~~~~~~~~', '##aaaaaaaaa::a~~~~~~~~~~', '##aaaaaaaaa::a~~~~~~~~~~',
    '##aaaaaaaaa::a~~~~~~~~~~', '##aaaaaaaaa::S~~~~~~~~~~', '##aaaaaaaaa::a~~~~~~~~~~', '##aaaaaaaaa::a~~~~~~~~~~', '#########aa::~~~~~~~~~~~'],
    objects: [{ k: 'torre', x: 21, y: 8, w: 1, h: 1 }, { k: 'arbusto', x: 13, y: 26, w: 1, h: 1 }, { k: 'arbusto', x: 2, y: 9, w: 1, h: 1 }],
    warps: { '10,-1': { map: 'ciudad', x: 14, y: 24, dir: 1 }, '11,-1': { map: 'ciudad', x: 15, y: 24, dir: 1 }, '11,40': { map: 'puerto', x: 11, y: 1, dir: 0 }, '12,40': { map: 'puerto', x: 12, y: 1, dir: 0 } },
    area: () => ['RUTA 3', 'costa'],
  },
  puerto: { w: 30, h: 26, rows: [
    '###########PP#################', '#aaaaaaaaaaPPaaaaaaaaaaaaaaaa#', '#aaaaaaaaaaPPaaaaaaaaaaaaaaaa#', '#aaaaaaaaaSPPaaaaaaaaaaaaa,aa#', '#aPPPPPPPPPPPaaaaaaaaaaaaaaaa#',
    '#aaaaaaaaaaPPaaaaaaaaaaaaaaaa#', '#aaaa,aaaaaPPaPPPPPPPPPPaaaaa#', '#aaaaaaaa,aPPaPPPPPPPPPPaaaaa#', '#aaaaaaaaaaPPaPPPPPPPPPPaaaaa#', '#aPPPPPPPaaPPSPPPPPPPPPPPPPPa#',
    'PPPPPPPPPPPPPPPPPPPPPPPPPPPPP#', 'PPPPPPPPPPPPPPPPPPPPPPPPPPP,P#', '#aaDDaaaaaaDDaaaaaaaaaaaaaaaa#', '~~~DD~~~~~~DD~~~~~~~~~~~~~~~~~', '~~~DD~~~~~~DD~~~~~~~~~~~~~~~~~',
    '~~~DDDDDDD~DD~~~~~~~~~~~~~~~~~', '~~~DDDDDDD~DD~~~~~~~~~~~~~~~~~', '~RRR~~~~~~~DD~~~~~~~~~~~~~~~~~', '~RaR~~~~~~~DDDDDDDDD~~~~~~~~~~', '~RRR~~~~~~~DD~~~~~~~~~~~~~~~~~',
    '~RRR~~~~~~~DD~~~~~~~~~~~~~~~~~', '~RRR~~~~~~~DD~~~~~~~~~~~~~~~~~', '~~~~~~~~~~~DD~~~~~~~~~~~~~~~~~', '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~', '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'],
    objects: [
      { k: 'edif', x: 2, y: 1, w: 5, h: 3, door: 2, sign: 'FERRETERÍA', wall: '#e8dcc0', roof: '#5c7c78', awning: ['#e84838', '#f8f0e0'], signBg: '#2c5c58' },
      { k: 'casa', x: 7, y: 1, w: 4, h: 3, door: 1, dc: '#3c78a8', roof: ['#a8d8f8', '#5898c8', '#3c6c98', '#284868'] },
      { k: 'edif', x: 2, y: 6, w: 6, h: 3, door: 2, sign: 'LONJA', wall: '#f0f0e8', roof: '#3c6c98', awning: ['#3c78c8', '#f8f8f0'], signBg: '#284868' },
      { k: 'edif', x: 15, y: 1, w: 8, h: 5, door: 3, sign: 'ASTILLERO', wall: '#b87850', roof: '#5c4c44', signBg: '#5a2a20', antena: 1 },
      { k: 'casa', x: 24, y: 6, w: 4, h: 3, door: 1, dc: '#a85838', roof: ['#f8c8a8', '#e88858', '#b85838', '#7a3820'] },
      { k: 'poste', x: 9, y: 9, w: 1, h: 1 }, { k: 'farola', x: 14, y: 12, w: 1, h: 1 }, { k: 'farola', x: 24, y: 12, w: 1, h: 1 }, { k: 'farola', x: 5, y: 12, w: 1, h: 1 },
      { k: 'faro', x: 2, y: 18, w: 1, h: 1 }, { k: 'barco', x: 20, y: 16, w: 9, h: 5 },
      { k: 'barrera', x: 1, y: 10, w: 1, h: 2, until: 'fusOXIDO', msg: 'La pasarela hacia la RUTA 4 está levantada. «La baja la capitana HERRÍN a quien se la gane», dice un cartel oxidado.' },
    ],
    warps: { '11,-1': { map: 'ruta3', x: 11, y: 39, dir: 1 }, '12,-1': { map: 'ruta3', x: 12, y: 39, dir: 1 }, '4,3': { map: 'ferreteria', x: 4, y: 5, dir: 1 }, '8,3': { map: 'casaPescador', x: 3, y: 4, dir: 1 },
      '4,8': { map: 'lonja', x: 4, y: 5, dir: 1 }, '18,5': { map: 'astillero', x: 6, y: 12, dir: 1, need: 'anclaVuelta', locked: 'Un cartel en la puerta: «CERRADO HASTA QUE ME DEVUELVAN MI ANCLA. La capitana.»' }, '19,5': { map: 'astillero', x: 7, y: 12, dir: 1, need: 'anclaVuelta', locked: 'Un cartel en la puerta: «CERRADO HASTA QUE ME DEVUELVAN MI ANCLA. La capitana.»' },
      '25,8': { map: 'casaFaro', x: 3, y: 4, dir: 1 }, '20,18': { map: 'barco', x: 7, y: 9, dir: 1 }, '-1,10': { map: 'ruta4', x: 39, y: 10, dir: 2 }, '-1,11': { map: 'ruta4', x: 39, y: 11, dir: 2 } },
    area: () => ['PUERTO ROÑA', 'puerto'],
  },
  astillero: { w: 14, h: 14, indoor: 1, type: 'OXIDO', env: 'gym', paint: paintGym, rows: [
    'XXXXXXXXXXXXXX', 'XXXXXXXXXXXXXX', 'XX..........XX', 'XX..........XX', 'XXXX......XXXX',
    'X.....XX.....X', 'X.....XX.....X', 'X..B..XX..B..X', 'X............X', 'XXXXX....XXXXX',
    'X............X', 'X..B......B..X', 'X............X', 'XXXXXX..XXXXXX'],
    objects: [{ k: 'barrera', kind: 'obra', x: 5, y: 9, w: 4, h: 1, until: 'marHerrin1', msg: 'Una valla de astillero. «Solo para quien gane al grumete», pone con pintura roja.' },
      { k: 'barrera', kind: 'obra', x: 4, y: 4, w: 6, h: 1, until: 'marHerrin2', msg: 'Otra valla. El contramaestre de la izquierda tiene la llave.' }],
    warps: { '6,14': { map: 'puerto', x: 18, y: 6, dir: 0 }, '7,14': { map: 'puerto', x: 19, y: 6, dir: 0 } },
    area: () => ['ASTILLERO ROÑA', G.fusibles.includes('OXIDO') ? 'puerto' : 'gimnasio'],
  },
  barco: { w: 14, h: 10, indoor: 1, paint: paintCentral, rows: ['XXXXXXXXXXXXXX', 'XXXXXXXXXXXXXX', 'XX..B....B..XX', 'X............X', 'X..BB....BB..X', 'X............X', 'XX..........XX', 'X....B..B....X', 'X............X', 'XXXXXXX.XXXXXX'],
    warps: { '7,10': { map: 'puerto', x: 19, y: 18, dir: 2 } }, area: () => ['BODEGA DE «EL APAGADO»', G.flags.anclaVuelta ? 'puerto' : 'apagon'] },
  lonja: { w: 10, h: 7, indoor: 1, room: 'ferreteria', paint: paintRoom, rows: ['XXXXXXXXXX', 'XXXXXXXXXX', 'X.CCCCCC.X', 'X........X', 'XT..rr..TX', 'X........X', 'XXXX.XXXXX'],
    warps: { '4,7': { map: 'RET' } }, area: () => ['LONJA DE ROÑA', 'puerto'] },
  casaPescador: { w: 8, h: 6, indoor: 1, room: 'casa', paint: paintRoom, rows: ['XXXXXXXX', 'XXXXXXXX', 'Xk..b.pX', 'X..T...X', 'X..r...X', 'XXX.XXXX'], warps: { '3,6': { map: 'RET' } }, area: () => ['CASA DEL PESCADOR', 'puerto'] },
  casaFaro: { w: 8, h: 6, indoor: 1, room: 'casa', paint: paintRoom, rows: ['XXXXXXXX', 'XXXXXXXX', 'XpS.b.kX', 'X...T..X', 'X...r..X', 'XXX.XXXX'], warps: { '3,6': { map: 'RET' } }, area: () => ['CASA DE LA FARERA', 'puerto'] },
  ruta4: { w: 40, h: 22, wild: 'RUTA 4', rows: [
    '########################################', '#............#####......"""""""........#', '#."""""......#####......"""""""..""""".#', '#."""""......#####,....."""""""..""""".#', '#."""""..........................""""".#',
    '#."""""..........................""""".#', '#........:::::::::::::...........""""".#', '#........:::::::::::::...........""""".#', '#..,.....::.,.......::.................#', '#.S......::.........::""""""".......,S.#',
    ':::::::::::.........::"""""""..:::::::::', '::::::::::..........::"""""""..:::::::::', '#........."""""""...::"""""""..::......#', '#...~~~~~."""""""...::"""""""..::.####.#', '#...~~~~~."""""""...::.........::.####.#',
    '#...~~~~~."""""""...:::::::::::::.####.#', '#...~~~~~."""""""...::::::::::::..####.#', '####~~~~~."""""""....LLLLLLLLL....####.#', '####......"""""""..........,......####.#', '####...................................#',
    '####...................................#', '########################################'],
    objects: [{ k: 'arbusto', x: 30, y: 4, w: 1, h: 1 }, { k: 'arbusto', x: 19, y: 19, w: 1, h: 1 }, { k: 'palo', x: 8, y: 5, w: 1, h: 1, to: [20, 5] }, { k: 'palo', x: 20, y: 5, w: 1, h: 1 }],
    warps: { '40,10': { map: 'puerto', x: 0, y: 10, dir: 3 }, '40,11': { map: 'puerto', x: 0, y: 11, dir: 3 }, '-1,10': { map: 'villa', x: 27, y: 10, dir: 2 }, '-1,11': { map: 'villa', x: 27, y: 11, dir: 2 } },
    area: () => ['RUTA 4', 'campo'],
  },
  villa: { w: 28, h: 24, rows: [
    '############################', '#.""""""""""...."""""""""".#', '#.""""....""...."""....""".#', '#.""""...."".::."""""""""".#', '#."""""""""".::."""""""""".#',
    '#."""""""""".::............#', '#............::............#', '#........,...::............#', '#............::............#', '#...........S::............#',
    '#...::::::::::::::::::::::::', '#...::::::::::::::::::::::::', '#...::.......::.....,...S..#', '#...::..,....::............#', '#...::.......::...~~~~~~~..#',
    '#.,.::.......::...~~~~~~~..#', '#...::.......::...~~~~~~~..#', '#...::.......::............#', '#...::.......::............#', '#...::.....,.::.........,..#',
    '#...::.......::............#', '#............::............#', '#..........................#', '############################'],
    objects: [
      { k: 'invernadero', x: 16, y: 5, w: 10, h: 5, door: 4 },
      { k: 'casa', x: 6, y: 13, w: 4, h: 3, door: 1, roof: ['#b8e0a0', '#6cac5c', '#4c8040', '#2c5428'] },
      { k: 'casa', x: 15, y: 17, w: 4, h: 3, door: 1, dc: '#a87838', roof: ['#d8f0b0', '#8cc070', '#5c9050', '#3c6838'] },
      { k: 'edif', x: 6, y: 17, w: 5, h: 3, door: 2, sign: 'FERRETERÍA', wall: '#e8dcc0', roof: '#4c7c48', awning: ['#58a848', '#f8f0e0'], signBg: '#2c5c2c' },
      { k: 'casa', x: 20, y: 18, w: 4, h: 3, door: 1, dc: '#c86848', roof: ['#f8e0a8', '#d8b060', '#a88038', '#6c5020'] },
      { k: 'poste', x: 11, y: 12, w: 1, h: 1 }, { k: 'farola', x: 15, y: 12, w: 1, h: 1 }, { k: 'farola', x: 3, y: 9, w: 1, h: 1 },
      { k: 'arbusto', x: 25, y: 13, w: 1, h: 1 }, { k: 'arbusto', x: 1, y: 21, w: 1, h: 1 }, { k: 'arbusto', x: 25, y: 22, w: 1, h: 1 },
      { k: 'barrera', kind: 'bomba', x: 7, y: 2, w: 2, h: 2, until: 'podadora' },
    ],
    warps: { '28,10': { map: 'ruta4', x: 0, y: 10, dir: 3 }, '28,11': { map: 'ruta4', x: 0, y: 11, dir: 3 }, '20,9': { map: 'invernadero', x: 6, y: 12, dir: 1 },
      '7,15': { map: 'casaMusgo', x: 3, y: 4, dir: 1 }, '16,19': { map: 'casaTallo', x: 3, y: 4, dir: 1 }, '8,19': { map: 'ferreteria', x: 4, y: 5, dir: 1 }, '21,20': { map: 'casaSemilla', x: 3, y: 4, dir: 1 } },
    area: y => y <= 5 ? ['HUERTO DE MUSGO', G.flags.podadora ? 'villa' : 'apagon'] : ['VILLA MUSGO', 'villa'],
  },
  invernadero: { w: 14, h: 14, indoor: 1, type: 'MUSGO', env: 'gym', paint: paintGym, rows: [
    'XXXXXXXXXXXXXX', 'XXXXXXXXXXXXXX', 'XX..........XX', 'XX..........XX', 'XX..........XX',
    'X..B......B..X', 'X............X', 'X.B...BB...B.X', 'X............X', 'X..B......B..X',
    'X............X', 'X.B........B.X', 'X............X', 'XXXXXX..XXXXXX'],
    objects: [{ k: 'barrera', kind: 'seto', x: 1, y: 8, w: 12, h: 1, until: 'jarTallo1', msg: 'Un seto recién podado. El jardinero de abajo tiene las tijeras.' },
      { k: 'barrera', kind: 'seto', x: 2, y: 4, w: 10, h: 1, until: 'jarTallo2', msg: 'Otro seto. Lo cuida la jardinera del medio con mucho mimo.' }],
    warps: { '6,14': { map: 'villa', x: 20, y: 10, dir: 0 }, '7,14': { map: 'villa', x: 20, y: 10, dir: 0 } },
    area: () => ['INVERNADERO MUSGO', G.fusibles.includes('MUSGO') ? 'villa' : 'gimnasio'],
  },
  casaMusgo: { w: 8, h: 6, indoor: 1, room: 'casa', paint: paintRoom, rows: ['XXXXXXXX', 'XXXXXXXX', 'Xp..b.pX', 'X..T...X', 'X..r...X', 'XXX.XXXX'], warps: { '3,6': { map: 'RET' } }, area: () => ['CASA DEL MUSGO', 'villa'] },
  casaTallo: { w: 8, h: 6, indoor: 1, room: 'casa', paint: paintRoom, rows: ['XXXXXXXX', 'XXXXXXXX', 'XppSbpkX', 'X..T...X', 'Xp.r..pX', 'XXX.XXXX'], warps: { '3,6': { map: 'RET' } }, area: () => ['CASA DE TALLO', 'villa'] },
  casaSemilla: { w: 8, h: 6, indoor: 1, room: 'casa', paint: paintRoom, rows: ['XXXXXXXX', 'XXXXXXXX', 'Xk..b.pX', 'X...T..X', 'X..r...X', 'XXX.XXXX'], warps: { '3,6': { map: 'RET' } }, area: () => ['CASA DE LAS SEMILLAS', 'villa'] },
  torre: { w: 14, h: 12, indoor: 1, room: 'oficina', paint: paintRoom, rows: ['XXXXXXXXXXXXXX', 'XXXXXXXXXXXXXX', 'Xp..........pX', 'X............X', 'X..CCC...T...X', 'X............X', 'X.T..T....T..X', 'X............X', 'X..K.....K...X', 'X............X', 'X............X', 'XXXXXX..XXXXXX'],
    objects: [{ k: 'ascensor', x: 6, y: 1, w: 1, h: 1, up: 1 }], warps: { '6,12': { map: 'ciudad', x: 4, y: 8, dir: 0 }, '7,12': { map: 'ciudad', x: 4, y: 8, dir: 0 }, '6,1': { map: 'torre2', x: 6, y: 2, dir: 0 } },
    area: () => ['TORRE APAGÓN · RECEPCIÓN', G.flags.ohmioTorre ? 'ciudad' : 'apagon'] },
  torre2: { w: 14, h: 12, indoor: 1, room: 'oficina', paint: paintRoom, rows: ['XXXXXXXXXXXXXX', 'XXXXXXXXXXXXXX', 'X............X', 'X.TT..TT.....X', 'X............X', 'X.K....K...K.X', 'X............X', 'XSS..TTTT..SSX', 'X............X', 'X.p.......p..X', 'X............X', 'XXXXXXXXXXXXXX'],
    objects: [{ k: 'ascensor', x: 6, y: 1, w: 1, h: 1 }, { k: 'ascensor', x: 11, y: 1, w: 1, h: 1, up: 1 }], warps: { '6,1': { map: 'torre', x: 6, y: 2, dir: 0 }, '11,1': { map: 'torre3', x: 6, y: 9, dir: 1, need: 'contadora2', locked: 'CONTADORA: ¿Adónde crees que vas sin pasar por caja?' } },
    area: () => ['TORRE APAGÓN · PLANTA 1', G.flags.ohmioTorre ? 'ciudad' : 'apagon'] },
  torre3: { w: 12, h: 11, indoor: 1, room: 'oficina', paint: paintRoom, rows: ['XXXXXXXXXXXX', 'XXXXXXXXXXXX', 'XS.KTTTTK.SX', 'X..........X', 'Xp........pX', 'X..........X', 'X...rrrr...X', 'X...rrrr...X', 'X..........X', 'X..........X', 'XXXXXXXXXXXX'],
    objects: [{ k: 'ascensor', x: 6, y: 10, w: 1, h: 1 }], warps: { '6,10': { map: 'torre2', x: 11, y: 2, dir: 0 } },
    area: () => ['DESPACHO DEL DIRECTOR', G.flags.ohmioTorre ? 'ciudad' : 'jefeApagon'] },
  ruta5: { w: 36, h: 22, wild: 'RUTA 5', rows: [
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', 'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', 'R........."""""..........."""......R', 'R.""""...."""""....RRRR..."""......R', 'R.""""...."""""....RRRR...""".::::::',
    'R.""""...."""""....RRRR...""".::::::', 'R.""""...."""""...........""".::...R', 'R.""""........................::...R', 'RLLLLLL.........::::::::::....:""".R', 'R.S......RRRRR..::::::::::....:""".R',
    ':::::::::RRRRR..::......::....:""".R', ':::::::::RRRRR..::""""".::....:""".R', ':::::::::RRRRR..::""""".::....:""".R', 'R...,..::RRRRR..::""""".::....::...R', 'R......::.......::""""".::::::::...R',
    'R###...::.....,.::""""".:::::::....R', 'R###...:::::::::::........RRR......R', 'R###...::::::::::.........RRR....,.R', 'R###......................RRR......R', 'R###......................RRR......R',
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', 'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR'],
    objects: [{ k: 'torre', x: 33, y: 15, w: 1, h: 1, to: [24 * 16 + 8, 2 * 16] }, { k: 'arbusto', x: 22, y: 18, w: 1, h: 1 }],
    warps: { '-1,10': { map: 'ciudad', x: 28, y: 11, dir: 2 }, '-1,11': { map: 'ciudad', x: 28, y: 12, dir: 2 }, '-1,12': { map: 'ciudad', x: 28, y: 13, dir: 2 }, '36,4': { map: 'poblado', x: 0, y: 4, dir: 3 }, '36,5': { map: 'poblado', x: 0, y: 5, dir: 3 } },
    area: () => ['RUTA 5', 'montana'],
  },
  poblado: { w: 24, h: 18, rows: [
    'RRRRRRRRRRRRRRRRRRRRRRRR', 'RRRRRRRR........RRRRRRRR', 'RRRRRRRR........RRRRRRRR', 'RRRRRRRR........RRRRRRRR', ':::::::::::::..........R',
    ':::::::::::::..........R', 'R........S.::..........R', 'R..........::..........R', 'R.,........::..........R', 'R..........::.......S..R',
    'R..........:::::::::::::', 'R..........:::::::::::::', 'R......................R', 'R......................R', 'R...,..................R',
    'R................,.....R', 'R......................R', 'RRRRRRRRRRRRRRRRRRRRRRRR'],
    objects: [{ k: 'bocamina', x: 9, y: 1, w: 6, h: 3 }, { k: 'casa', x: 2, y: 12, w: 4, h: 3, door: 1, roof: ['#c8c0d8', '#8c84a8', '#5c5480', '#3c3458'] },
      { k: 'edif', x: 14, y: 13, w: 5, h: 3, door: 2, sign: 'FERRETERÍA', wall: '#d8c8b0', roof: '#5c5480', awning: ['#9890d0', '#f8f0e0'], signBg: '#3c3458' },
      { k: 'casa', x: 18, y: 5, w: 4, h: 3, door: 1, dc: '#5a3a24', roof: ['#d8b898', '#a8805c', '#7c5838', '#4c3420'] },
      { k: 'poste', x: 8, y: 9, w: 1, h: 1 }, { k: 'lampara', x: 8, y: 1, w: 1, h: 1, walk: 1 }, { k: 'farola', x: 15, y: 7, w: 1, h: 1 },
      { k: 'barrera', x: 22, y: 10, w: 1, h: 2, until: 'fusIMAN', msg: 'Derrumbe en el camino a FRAGUA. «Lo despejará la cuadrilla de PIRITA cuando alguien la gane», dice un minero sudado.' }],
    warps: { '-1,4': { map: 'ruta5', x: 35, y: 4, dir: 2 }, '-1,5': { map: 'ruta5', x: 35, y: 5, dir: 2 }, '11,3': { map: 'mina', x: 14, y: 20, dir: 1 }, '12,3': { map: 'mina', x: 15, y: 20, dir: 1 },
      '3,14': { map: 'casaMinera', x: 3, y: 4, dir: 1 }, '16,15': { map: 'ferreteria', x: 4, y: 5, dir: 1 }, '19,7': { map: 'casaJacinto', x: 3, y: 4, dir: 1 }, '24,10': { map: 'ruta6', x: 0, y: 10, dir: 3 }, '24,11': { map: 'ruta6', x: 0, y: 11, dir: 3 } },
    area: () => ['POBLADO IMANTA', 'montana'],
  },
  mina: { w: 26, h: 22, indoor: 1, cave: 1, dark: 'mina', wild: 'MINA', paint: paintCave, rows: [
    'XXXXXXXXXXXXXXXXXXXXXXXXXX', 'XXXXXXXXXXXXXXXXXXXXXXXXXX', 'XX....o.....XXXX.......XXX', 'XX.rrrrrrr..XXXX..B....XXX', 'XX......v...XXXX.......XXX',
    'XXXXXX..v...o.....XXX..XXX', 'XXXXXX..v.........XXX..XXX', 'XX......v...XXXXX.......XX', 'XX.B....v...XXXXX..o....XX', 'XX......vrrrrrrrrrrrrr..XX',
    'XXXX..XXXXXXX...XXXXX...XX', 'XXXX..XXXXXXX...XXXXX...XX', 'XX......o...........o...XX', 'XX..................XXXXXX', 'XXXXXXXX...XXXXXX...XXXXXX',
    'XXXXXXXX...XXXXXX...XXXXXX', 'XX....B.........v...XXXXXX', 'XX..............v...XXXXXX', 'XX....XXXXXXXX..v.......XX', 'XX....XXXXXXXX..v.......XX',
    'XXXXXXXXXXXXXX..XXXXXXXXXX', 'XXXXXXXXXXXXXX..XXXXXXXXXX'],
    objects: [{ k: 'lampara', x: 5, y: 1, w: 1, h: 1 }, { k: 'lampara', x: 14, y: 4, w: 1, h: 1 }, { k: 'lampara', x: 3, y: 15, w: 1, h: 1 }, { k: 'lampara', x: 22, y: 6, w: 1, h: 1 }, { k: 'lampara', x: 10, y: 13, w: 1, h: 1 }, { k: 'ascensor', x: 19, y: 1, w: 1, h: 1, up: 1 }],
    warps: { '14,22': { map: 'poblado', x: 11, y: 4, dir: 0 }, '15,22': { map: 'poblado', x: 12, y: 4, dir: 0 }, '19,1': { map: 'salaImanta', x: 6, y: 12, dir: 1 } },
    area: () => ['MINA IMANTA', 'mina'],
  },
  salaImanta: { w: 14, h: 14, indoor: 1, type: 'IMAN', env: 'gym', paint: paintGym, rows: [
    'XXXXXXXXXXXXXX', 'XXXXXXXXXXXXXX', 'XX..........XX', 'XX..........XX', 'XXXXX....XXXXX',
    'X............X', 'X..B......B..X', 'X............X', 'XXXX......XXXX', 'X............X',
    'X..B......B..X', 'X............X', 'X............X', 'XXXXXX..XXXXXX'],
    objects: [{ k: 'barrera', kind: 'electrica', x: 4, y: 8, w: 6, h: 1, until: 'minPirita1', msg: 'Una reja imantada. Solo se abre al vencer al barrenero.' }, { k: 'barrera', kind: 'electrica', x: 5, y: 4, w: 4, h: 1, until: 'minPirita2', msg: 'Otra reja. La controla la capataza.' }],
    warps: { '6,14': { map: 'mina', x: 19, y: 2, dir: 0 }, '7,14': { map: 'mina', x: 19, y: 2, dir: 0 } },
    area: () => ['SALA DEL IMÁN', G.fusibles.includes('IMAN') ? 'mina' : 'gimnasio'],
  },
  casaMinera: { w: 8, h: 6, indoor: 1, room: 'casa', paint: paintRoom, rows: ['XXXXXXXX', 'XXXXXXXX', 'Xk..b.SX', 'X..T...X', 'X..r..pX', 'XXX.XXXX'], warps: { '3,6': { map: 'RET' } }, area: () => ['CASA MINERA', 'montana'] },
  casaJacinto: { w: 8, h: 6, indoor: 1, room: 'casa', paint: paintRoom, rows: ['XXXXXXXX', 'XXXXXXXX', 'XS..b.kX', 'X...T..X', 'Xp.r...X', 'XXX.XXXX'], warps: { '3,6': { map: 'RET' } }, area: () => ['CASA DE JACINTO', 'montana'] },
  ruta6: { w: 36, h: 20, wild: 'RUTA 6', rows: [
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', 'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', 'Rnnnnnnnnnnnnnnnnnnnnnnllllnn"""""nR', 'Rn""""""nnnnnnnnnnnnnnnllllnn"""""nR', 'Rn""""""nPPPPPPPPPPPPPnllllnn"""""nR',
    'Rn""""""nPPPPPPPPPPPPPnllllnn"""""nR', 'Rn""""""nPPnnnnnnnnnPPnllllnnnnnnnnR', 'Rn""""""nPPnllllllnnPPnllllnnnnnnnnR', 'RnnnnnnnnPPnllllllnnPPnnnnnnPPPPPPPP', 'RnSnnnnnnPPnllllllnnPPnnnnnnPPPPPPPP',
    'PPPPPPPPPPPnllllllnnPPnnnnnnPPnnnnnR', 'PPPPPPPPPPnnllllllnnPPnnnnnnPPnnnnnR', 'RnnnnnnnnnnnllllllnnPPnnnnnnPPllllnR', 'RnnnnnnnnnnnllllllnnPPPPPPPPPPllllnR', 'RnlllllnnnnnllllllnnPPPPPPPPPnllllnR',
    'Rnlllllnnnnnllllllnnnn"""""nnnllllnR', 'Rnlllllnnnnnnnnnnnnnnn"""""nnnllllnR', 'Rnlllllnnnnnnnnnnnnnnn"""""nnnnnnnnR', 'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', 'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR'],
    objects: [],
    warps: { '-1,10': { map: 'poblado', x: 23, y: 10, dir: 2 }, '-1,11': { map: 'poblado', x: 23, y: 11, dir: 2 }, '36,8': { map: 'fragua', x: 0, y: 8, dir: 3 }, '36,9': { map: 'fragua', x: 0, y: 9, dir: 3 } },
    area: () => ['RUTA 6', 'volcan'],
  },
  fragua: { w: 28, h: 22, rows: [
    'RRRRRRRRRRRRRPPRRRRRRRRRRRRR', 'RnnnnnnnnnnnnPPnnnnnnnnnnnnR', 'RnnnnnnnnnnnnPPnnnnnnnnnnnnR', 'RnnnnnnnnnnnnPPnnnnnnnnnnnnR', 'RnnnnnnnnnnnnPPnnnnnnnnnnnnR',
    'RnnnnnnnnnnnnPPnnnnnnnnnnnnR', 'RnnnnnnnnnnnnPPnnnnnnnnnnnnR', 'RnnnnnnnnnnnnPPnSnnnnnnnnnnR', 'PPPPPPPPPPPPPPPPPPPPPPPPPPPR', 'PPPPPPPPPPPPPPPPPPPPPPPPPPPR',
    'RnnnnnnnnnnnSPPnnnnnnnnnnnnR', 'RnnnnnnnnnnnnPPnnnnnnnnnnnnR', 'RnnnnnnnnnnnnPPnnnnnnnnnnnnR', 'RnnnnnnnnnnnnPPnnnnnnnnnnnnR', 'RnnPPPPPPPPnnPPnnPPPPPPPPnnR',
    'RnnnnnnnnnnnnPPnnnnnnnnnnnnR', 'RnnnnnnnnnnnnPPnnnnnnnnnnnnR', 'RllllnnnnnnnnPPnnnnnnnnllllR', 'RllllnnnnnnnnPPnnnnnnnnllllR', 'RllllnnnnnnnnPPnnnnnnnnllllR',
    'RllllnnnnnnnnPPnnnnnnnnllllR', 'RRRRRRRRRRRRRRRRRRRRRRRRRRRR'],
    objects: [
      { k: 'edif', x: 16, y: 2, w: 8, h: 5, door: 3, sign: 'GRAN FORJA', wall: '#7c6c60', roof: '#3c3430', signBg: '#5a2010', smoke: [20, 108] },
      { k: 'edif', x: 2, y: 2, w: 6, h: 4, door: 2, sign: 'HERRERÍA', wall: '#a89080', roof: '#4c3c34', signBg: '#3c2418', smoke: [80] },
      { k: 'casa', x: 2, y: 10, w: 4, h: 3, door: 1, roof: ['#c8a898', '#986c58', '#6c4838', '#442818'] },
      { k: 'edif', x: 17, y: 10, w: 5, h: 3, door: 2, sign: 'FERRETERÍA', wall: '#e8dcc0', roof: '#5c4c44', awning: ['#e86020', '#f8f0e0'], signBg: '#5a2010' },
      { k: 'casa', x: 22, y: 10, w: 4, h: 3, door: 1, dc: '#5a3a24', roof: ['#d8b8a0', '#a8806c', '#7c5848', '#4c3428'] },
      { k: 'poste', x: 10, y: 11, w: 1, h: 1 }, { k: 'farola', x: 12, y: 15, w: 1, h: 1 }, { k: 'farola', x: 15, y: 5, w: 1, h: 1 },
      { k: 'barrera', x: 13, y: 1, w: 2, h: 1, until: 'fusBRASA', msg: 'Una reja de hierro forjado. «La abre CANDIL a quien aguanta su calor», reza la placa.' },
    ],
    warps: { '-1,8': { map: 'ruta6', x: 35, y: 8, dir: 2 }, '-1,9': { map: 'ruta6', x: 35, y: 9, dir: 2 }, '19,6': { map: 'forja', x: 6, y: 12, dir: 1 }, '4,5': { map: 'herreria', x: 4, y: 5, dir: 1 },
      '3,12': { map: 'casaFragua', x: 3, y: 4, dir: 1 }, '19,12': { map: 'ferreteria', x: 4, y: 5, dir: 1 }, '23,12': { map: 'casaYunque', x: 3, y: 4, dir: 1 }, '13,-1': { map: 'ruta7', x: 13, y: 35, dir: 1 }, '14,-1': { map: 'ruta7', x: 14, y: 35, dir: 1 } },
    area: () => ['FRAGUA', 'volcan'],
  },
  forja: { w: 14, h: 14, indoor: 1, type: 'BRASA', env: 'gym', paint: paintGym, rows: ['XXXXXXXXXXXXXX', 'XXXXXXXXXXXXXX', 'XX..........XX', 'XX..........XX', 'XXXXX....XXXXX', 'X............X', 'X..B......B..X', 'X............X', 'XXXX......XXXX', 'X............X', 'X..B......B..X', 'X............X', 'X............X', 'XXXXXX..XXXXXX'],
    objects: [{ k: 'barrera', kind: 'electrica', x: 4, y: 8, w: 6, h: 1, until: 'herCandil1', msg: 'Una reja al rojo vivo. Solo se enfría si vences al aprendiz.' }, { k: 'barrera', kind: 'electrica', x: 5, y: 4, w: 4, h: 1, until: 'herCandil2', msg: 'Otra reja candente. La oficiala tiene la palanca.' }],
    warps: { '6,14': { map: 'fragua', x: 19, y: 7, dir: 0 }, '7,14': { map: 'fragua', x: 19, y: 7, dir: 0 } },
    area: () => ['GRAN FORJA', G.fusibles.includes('BRASA') ? 'volcan' : 'gimnasio'],
  },
  herreria: { w: 9, h: 7, indoor: 1, room: 'ferreteria', paint: paintRoom, rows: ['XXXXXXXXX', 'XXXXXXXXX', 'X.SS...kX', 'X...CCC.X', 'X.......X', 'XB..r..BX', 'XXXX.XXXX'], warps: { '4,7': { map: 'RET' } }, area: () => ['HERRERÍA', 'volcan'] },
  casaFragua: { w: 8, h: 6, indoor: 1, room: 'casa', paint: paintRoom, rows: ['XXXXXXXX', 'XXXXXXXX', 'Xk..b.SX', 'X..T...X', 'X..r..pX', 'XXX.XXXX'], warps: { '3,6': { map: 'RET' } }, area: () => ['CASA DE LOS FUELLES', 'volcan'] },
  casaYunque: { w: 8, h: 6, indoor: 1, room: 'casa', paint: paintRoom, rows: ['XXXXXXXX', 'XXXXXXXX', 'XS..b.kX', 'X...T..X', 'Xp.r...X', 'XXX.XXXX'], warps: { '3,6': { map: 'RET' } }, area: () => ['CASA DEL YUNQUE', 'volcan'] },
  ruta7: { w: 24, h: 36, wild: 'RUTA 7', rows: [
    '###########::###########', '#..........::""""......#', '#..........::"""".~~~~.#', '#..........::"""".~~~~.#', '#..........::"""".~~~~.#',
    '#.......,..::"""".~~~~.#', '#..........::..........#', '#..........::..........#', '#.~~~......:::::::.....#', '#.~~~......:::::::.....#',
    '#.~~~...........::"""".#', '#.~~~...........::"""".#', '#.~~~...........::"""".#', '#.""""""""......::"""".#', '#.""""""""......::"""".#',
    '#.""""""""......::"""".#', '#.""""""""......::"""".#', '#...............::.....#', '#.....::::::::::::.....#', '#.....:::::::::::......#',
    '#.....::.""""""........#', '#.....::.""""""........#', '#...,.::.""""""..~~~~~.#', '#.....::.""""""..~~~~~.#', '#LLLLL::L""""""LL~~~~~L#',
    '#.....::.""""""..~~~~~.#', '#..,..::.""""""..~~~~~.#', '#.....::...............#', '#.....:::::::::........#', '#.....:::::::::....,...#',
    '#.~~~~.."""""::........#', '#.~~~~.."""""::........#', '#.~~~~.."""""::........#', '#.~~~~.."""""::S.......#', '#............::........#',
    '#############::#########'],
    objects: [{ k: 'arbusto', x: 20, y: 19, w: 1, h: 1 }, { k: 'arbusto', x: 3, y: 6, w: 1, h: 1 }, ...[[3, 31], [18, 23], [20, 25], [3, 9], [19, 3]].map(([x, y]) => ({ k: 'vapor', x, y, w: 1, h: 1, walk: 1 }))],
    warps: { '13,36': { map: 'fragua', x: 13, y: 0, dir: 0 }, '14,36': { map: 'fragua', x: 14, y: 0, dir: 0 }, '11,-1': { map: 'termas', x: 11, y: 21, dir: 1 }, '12,-1': { map: 'termas', x: 12, y: 21, dir: 1 } },
    area: () => ['RUTA 7', 'termas'],
  },
  termas: { w: 28, h: 22, rows: [
    '#############PP#############', '#............PP............#', '#...~~~~.....PP............#', '#...~~~~.....PP............#', '#...~~~~.....PP............#',
    '#............PP............#', '#............PP............#', '#.,..........PP..........,.#', '#............PP............#', '#............PPS...........#',
    '#.PPPPPPPPPPPPPPPPPPPPPPPP.#', '#.PPPPPPPPPPPPPPPPPPPPPPPP.#', '#.........SPP..PPPPPPPPPPP.#', '#..........PP..PPPPPPPPPPP.#', '#..~~~~~~..PP..............#',
    '#..~~~~~~..PP.....~~~~~~...#', '#..~~~~~~..PP.....~~~~~~...#', '#..~~~~~~..PP.....~~~~~~...#', '#..........PP.....~~~~~~...#', '#........,.PP..............#',
    '#..........PP...,..........#', '###########PP###############'],
    objects: [
      { k: 'edif', x: 15, y: 5, w: 10, h: 4, door: 4, sign: 'BALNEARIO', wall: '#f0e8d8', roof: '#5c7c98', signBg: '#2c4c68', smoke: [30, 130], steam: 1 },
      { k: 'edif', x: 2, y: 5, w: 7, h: 4, door: 3, sign: 'CALDERA MADRE', wall: '#a8b0b8', roof: '#3c4250', signBg: '#2c323c', smoke: [56], steam: 1 },
      { k: 'casa', x: 16, y: 1, w: 4, h: 3, door: 1, roof: ['#c8e0f0', '#88b0d0', '#5880a8', '#385878'] },
      { k: 'casa', x: 22, y: 1, w: 4, h: 3, door: 1, dc: '#a85878', roof: ['#f0d0e0', '#d0a0b8', '#a07088', '#704860'] },
      { k: 'poste', x: 10, y: 13, w: 1, h: 1 }, { k: 'farola', x: 13, y: 15, w: 1, h: 1 }, { k: 'farola', x: 26, y: 12, w: 1, h: 1 }, { k: 'banco', x: 4, y: 19, w: 2, h: 1 },
      ...[[4, 15], [7, 16], [19, 16], [22, 17], [5, 3]].map(([x, y]) => ({ k: 'vapor', x, y, w: 1, h: 1, walk: 1 })),
      { k: 'barrera', x: 13, y: 1, w: 2, h: 1, until: 'seisFus', msg: 'Un portón antiguo con seis ranuras vacías. Encima, grabado: «CAMINO DEL RAYO».' },
    ],
    warps: { '11,22': { map: 'ruta7', x: 11, y: 0, dir: 0 }, '12,22': { map: 'ruta7', x: 12, y: 0, dir: 0 }, '19,8': { map: 'balneario', x: 6, y: 12, dir: 1, need: 'valvula', locked: 'BALNEARIO cerrado. «Sin VÁLVULA MADRE no hay vapor, y sin vapor no hay BRUMA», dice un papel mojado.' },
      '5,8': { map: 'caldera', x: 7, y: 9, dir: 1 }, '17,3': { map: 'casaTermas', x: 3, y: 4, dir: 1 }, '23,3': { map: 'casaVapor', x: 3, y: 4, dir: 1 }, '13,-1': { map: 'camino', x: 11, y: 39, dir: 1 }, '14,-1': { map: 'camino', x: 12, y: 39, dir: 1 } },
    area: () => ['TERMAS NIEBLA', 'termas'],
  },
  balneario: { w: 14, h: 14, indoor: 1, type: 'VAPOR', env: 'gym', paint: paintGym, rows: ['XXXXXXXXXXXXXX', 'XXXXXXXXXXXXXX', 'XX..........XX', 'XX..........XX', 'XXXXX....XXXXX', 'X............X', 'X..B......B..X', 'X............X', 'XXXX......XXXX', 'X............X', 'X..B......B..X', 'X............X', 'X............X', 'XXXXXX..XXXXXX'],
    objects: [{ k: 'barrera', kind: 'electrica', x: 4, y: 8, w: 6, h: 1, until: 'banBruma1', msg: 'Una cortina de vapor que quema. Se abre al vencer al bañero.' }, { k: 'barrera', kind: 'electrica', x: 5, y: 4, w: 4, h: 1, until: 'banBruma2', msg: 'Más vapor. La masajista controla la válvula.' }],
    warps: { '6,14': { map: 'termas', x: 19, y: 9, dir: 0 }, '7,14': { map: 'termas', x: 19, y: 9, dir: 0 } },
    area: () => ['BALNEARIO NIEBLA', G.fusibles.includes('VAPOR') ? 'termas' : 'gimnasio'],
  },
  caldera: { w: 14, h: 10, indoor: 1, paint: paintCentral, rows: ['XXXXXXXXXXXXXX', 'XXXXXXXXXXXXXX', 'XX.B..BB..B.XX', 'X............X', 'X.BB......BB.X', 'X............X', 'XX....BB....XX', 'X............X', 'X............X', 'XXXXXXX.XXXXXX'],
    objects: [{ k: 'turbina', x: 5, y: 0, w: 4, h: 2 }], warps: { '7,10': { map: 'termas', x: 5, y: 9, dir: 0 } }, area: () => ['CALDERA MADRE', G.flags.valvula ? 'termas' : 'apagon'] },
  casaTermas: { w: 8, h: 6, indoor: 1, room: 'casa', paint: paintRoom, rows: ['XXXXXXXX', 'XXXXXXXX', 'Xp..b.kX', 'X..T...X', 'X..r..pX', 'XXX.XXXX'], warps: { '3,6': { map: 'RET' } }, area: () => ['CASA DE LA NIEBLA', 'termas'] },
  casaVapor: { w: 8, h: 6, indoor: 1, room: 'casa', paint: paintRoom, rows: ['XXXXXXXX', 'XXXXXXXX', 'XS..b.pX', 'X...T..X', 'X..r...X', 'XXX.XXXX'], warps: { '3,6': { map: 'RET' } }, area: () => ['CASA DEL TERMALISTA', 'termas'] },
  camino: { w: 24, h: 40, wild: 'CAMINO', storm: 1, rows: [
    'RRRRRRRRRRRPPRRRRRRRRRRR', 'RnnnnnnnnnnPPnnnnnnnnnnR', 'RnnnnnnnnnnPP"""""nnnnnR', 'RnnnnnnnnnnPP"""""nnnnnR', 'RnnnnnnnnnnPP"""""nRRRnR',
    'RnnnnnnnnnnPP"""""nRRRnR', 'RnnnnnnnPPPPP"""""nRRRnR', 'RnnnnnnnPPPPn"""""nRRRnR', 'RnnnnnnnPPnnn"""""nRRRnR', 'RnnnnnnnPPnnn"""""nRRRnR',
    'RnnnnnnnPPnnnnnnnnnnnnnR', 'RnnnnnnnPPnnnnnnnnnnnnnR', 'Rn"""""nPPPPPPPPPPPPnnnR', 'Rn"""""nPPPPPPPPPPPPnnnR', 'Rn"""""llllnnnnnnnPPnnnR',
    'Rn"""""llllnnnnnnnP"""nR', 'Rn"""""llllnnnnnnnP"""nR', 'Rn"""""llllnnnnnnnP"""nR', 'Rn"""""llllnnnnnnnP"""nR', 'RnnnnnnllllnnnnnnnP"""nR',
    'RnnnnnnnnnnnnnnnnnP"""nR', 'RnnnnnnnnnnnnnnnnnPPnnnR', 'RnnnPPPPPPPPPPPPPPPPnnnR', 'RnnnPPPPPPPPPPPPPPPnnnnR', 'RnnnPPnnnnnnnnnnnnnnnnnR',
    'RnnnPPn"""""""""nnnnnnnR', 'RnnnPPn"""""""""nnnnnnnR', 'RnnnPPn"""""""""nnnnnnnR', 'RnnnPPn"""""""""nnnnnnnR', 'RnnnPPn"""""""""nnnnnnnR',
    'RnnnPPnnnnnnnn"""""""nnR', 'RnnnPPnnnnnnnn"""""""nnR', 'RnnnPPPPPPPPPn"""""""nnR', 'RnnnPPPPPPPPPn"""""""nnR', 'RnRRRnnnnnnPPn"""""""nnR',
    'RnRRRnnnnnnPPn"""""""nnR', 'RnRRRnnnnnnPPn"""""""nnR', 'RnRRRnnnnnnPPnnnnnnnnnnR', 'RnRRRnnnnnnPPnnnnnnnnnnR', 'RRRRRRRRRRRPPRRRRRRRRRRR'],
    objects: [{ k: 'torre', x: 21, y: 26, w: 1, h: 1, to: [16 * 16, 2 * 16] }, { k: 'torre', x: 2, y: 9, w: 1, h: 1 }],
    warps: { '11,40': { map: 'termas', x: 13, y: 1, dir: 0 }, '12,40': { map: 'termas', x: 14, y: 1, dir: 0 }, '11,-1': { map: 'fabrica', x: 12, y: 24, dir: 1 }, '12,-1': { map: 'fabrica', x: 13, y: 24, dir: 1 } },
    area: () => ['CAMINO DEL RAYO', 'camino'],
  },
  fabrica: { w: 26, h: 26, storm: 1, rows: [
    'RRRRRRRRRRRRRRRRRRRRRRRRRR', 'RnnnnnnnnnnnnnnnnnnnnnnnnR', 'RnnnnnnnnnnnnnnnnnnnnnnnnR', 'RnnnnnnnnnnnnnnnnnnnnnnnnR', 'RnnnnnnnnnnnnnnnnnnnnnnnnR',
    'RnnnnnnnnnnnnnnnnnnnnnnnnR', 'RnnnnnnnnnnnnnnnnnnnnnnnnR', 'RnnnnnnnnnnnnnnnnnnnnnnnnR', 'RnnnnnnnnnnnnnnnnnnnnnnnnR', 'RnnnnnnnnnnnnnnnnnnnnnnnnR',
    'RnnnnnnnnnnnnnnnnnnnnnnnnR', 'RnnnnnnnnnnnnnnnnnnnnnnnnR', 'RnnnnnnnnnnnnnnnnnnnnnnnnR', 'RnnnnnnnnnnnnnnnnnnnnnnnnR', 'RnnnnnnnnnnnnnnnnnnnnnnnnR',
    'RnnnnnnnnnnnnnnnnnnnnnnnnR', 'RnnnPPPPPPPPPPPPPPPPPPnnnR', 'RnnnPPPPPPPPPPPPPPPPPPnnnR', 'RnnnnnnnnnnnPPnnnnnnnnnnnR', 'RnnnnnnnnnnnPPnnnnnnnnnnnR',
    'RnnnnnnnnnnnPPnnnnnnnnnnnR', 'RnnnnnnnnnnnPPnnnnnnnnnnnR', 'RnnnnnnnnnnnPPnnnnnnnnnnnR', 'RnnnnnnnnnnnPPnnnnnnnnnnnR', 'RnnnnnnnnnnnPPnnnnnnnnnnnR',
    'RRRRRRRRRRRRPPRRRRRRRRRRRR'],
    objects: [{ k: 'granFabrica', x: 3, y: 8, w: 20, h: 8, door: 9 }, { k: 'poste', x: 9, y: 19, w: 1, h: 1 }, { k: 'farola', x: 15, y: 19, w: 1, h: 1 }, { k: 'farola', x: 4, y: 18, w: 1, h: 1 }, { k: 'farola', x: 21, y: 18, w: 1, h: 1 }],
    warps: { '12,26': { map: 'camino', x: 11, y: 0, dir: 0 }, '13,26': { map: 'camino', x: 12, y: 0, dir: 0 }, '12,15': { map: 'fabrica1', x: 8, y: 12, dir: 1 }, '13,15': { map: 'fabrica1', x: 9, y: 12, dir: 1 } },
    area: () => ['GRAN FÁBRICA MAKINA', G.flags.fin ? 'pueblo' : 'camino'],
  },
  fabrica1: { w: 18, h: 14, indoor: 1, dark: 'mina', cave: 1, wild: 'FABRICA', paint: paintCentral, rows: [
    'XXXXXXXXXXXXXXXXXX', 'XXXXXXXXXXXXXXXXXX', 'XX..B....B....B.XX', 'X................X', 'X..BB..BBBB..BB..X',
    'X................X', 'XXXX..XXXXXX..XXXX', 'X................X', 'X.B..B......B..B.X', 'X................X',
    'XXXXXXXX..XXXXXXXX', 'X................X', 'X..B..........B..X', 'XXXXXXXX..XXXXXXXX'],
    objects: [{ k: 'ascensor', x: 8, y: 1, w: 1, h: 1, up: 1 }, { k: 'lampara', x: 3, y: 1, w: 1, h: 1 }, { k: 'lampara', x: 14, y: 1, w: 1, h: 1 }, { k: 'lampara', x: 1, y: 6, w: 1, h: 1 }, { k: 'lampara', x: 16, y: 6, w: 1, h: 1 }, { k: 'lampara', x: 4, y: 10, w: 1, h: 1 }, { k: 'lampara', x: 13, y: 10, w: 1, h: 1 }],
    warps: { '8,14': { map: 'fabrica', x: 12, y: 16, dir: 0 }, '9,14': { map: 'fabrica', x: 13, y: 16, dir: 0 }, '8,1': { map: 'camara', x: 7, y: 12, dir: 1 } },
    area: () => ['NAVE DE LA FÁBRICA', G.flags.fin ? 'pueblo' : 'fabrica'],
  },
  camara: { w: 16, h: 14, indoor: 1, type: 'CHISPA', env: 'gym', paint: paintCentral, dyn: (cx, cy) => dynCamara(cx, cy), rows: [
    'XXXXXXXXXXXXXXXX', 'XXXXXXXXXXXXXXXX', 'XX............XX', 'XX............XX', 'XX............XX',
    'XX............XX', 'X..............X', 'X..............X', 'X..B........B..X', 'X..............X',
    'X..............X', 'X..B........B..X', 'X..............X', 'XXXXXXX..XXXXXXX'],
    objects: [{ k: 'granPila', x: 6, y: 5, w: 3, h: 3 }],
    warps: { '7,14': { map: 'fabrica1', x: 8, y: 2, dir: 0 }, '8,14': { map: 'fabrica1', x: 8, y: 2, dir: 0 } },
    area: () => ['CÁMARA DEL RAYO', G.flags.fin ? 'pueblo' : G.flags.ohmioFin ? 'fulgorCalma' : 'fabrica'],
  },
};
const STARTERS = ['tostik', 'hervi', 'bulbio'];
const world = {
  M: null, pl: { x: 0, y: 0, px: 0, py: 0, dir: 0, step: 0, moving: false, mt: 0, hop: 0, style: 'nia' }, fol: { fol: 1, x: 0, y: 0, px: 0, py: 0, dir: 0, step: 0, moving: false, mt: 0, hop: 0, hide: true, idle: 0 }, npcs: [], cam: { x: 0, y: 0 }, emotes: [], banner: { y: -20, t: '' }, area: '', grace: 4, rustle: [],
  load(name, x, y, dir) {
    const def = MAPS[name]; this.M = this.cache[name] || (this.cache[name] = buildMap(def)); const M = this.M;
    this.refresh();
    // si la posición cae en una pared (partidas viejas), la casilla libre más cercana
    if (this.solid(x, y, true) || x < 0 || y < 0 || x >= M.w || y >= M.h) { let best = null; for (let r = 1; r < M.w + M.h && !best; r++) for (let dy = -r; dy <= r && !best; dy++) for (let dx = -r; dx <= r; dx++) { const tx = x + dx, ty = y + dy; if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || tx < 0 || ty < 0 || tx >= M.w || ty >= M.h) continue; if (!this.solid(tx, ty, true) && M.at(tx, ty) !== 'L' && !(M.def.warps || {})[tx + ',' + ty]) { best = [tx, ty]; break; } } if (best) [x, y] = best; }
    G.map = name; const p = this.pl; p.x = x; p.y = y; p.px = x * 16; p.py = y * 16; p.dir = dir; p.moving = false; p.hop = 0;
    G.flags['v_' + name] = 1;
    this.npcs = NPCS[name]().filter(Boolean); this.area = ''; this.checkArea(true); this.camUpdate();
    // la primera del equipo aparece detrás de ti
    const f = this.fol, bx = x - DX[dir], by = y - DY[dir], free = !this.solid(bx, by, false) && !(M.at(bx, by) === 'L');
    Object.assign(f, { x: free ? bx : x, y: free ? by : y, dir, moving: false, hop: 0, hide: !free, idle: 0 }); f.px = f.x * 16; f.py = f.y * 16;
  },
  cache: {},
  refresh() { const M = this.M; M.blocked = new Set(); for (const o of M.def.objects || []) { if (o.k === 'barrera' && !barreraOn(o)) continue; if (o.walk) continue; for (let j = 0; j < o.h; j++) for (let i = 0; i < o.w; i++) M.blocked.add((o.x + i) + ',' + (o.y + j)); } },
  checkArea(silent) {
    const [nm, song] = this.M.def.area(this.pl.y);
    if (nm !== this.area) {
      this.area = nm; music(song);
      if (!silent || true) {
        const id = (this.banner.id = (this.banner.id || 0) + 1);
        for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].o === this.banner) tweens.splice(i, 1);
        this.banner.t = nm; this.banner.y = -20;
        tw(this.banner, { y: 3 }, 20, 'back').then(() => wait(110)).then(() => { if (this.banner.id === id) tw(this.banner, { y: -20 }, 16, 'in'); });
      }
    }
  },
  solid(x, y, ignoreNpc) {
    const M = this.M, ch = M.at(x, y);
    if (x < 0 || y < 0 || x >= M.w || y >= M.h) return true;
    if (SOLID.includes(ch) || ch === 'L' || M.blocked.has(x + ',' + y)) return true;
    if (!ignoreNpc && this.npcAt(x, y)) return true;
    if (!ignoreNpc && this.pl.x === x && this.pl.y === y) return true;
    return false;
  },
  npcAt(x, y) { return this.npcs.find(n => n.x === x && n.y === y && !n.gone); },
  camUpdate() {
    const M = this.M, p = this.pl, mw = M.w * 16, mh = M.h * 16;
    this.cam.x = mw <= W ? (mw - W) / 2 : clamp(Math.round(p.px) + 8 - W / 2, 0, mw - W);
    this.cam.y = mh <= H ? (mh - H) / 2 : clamp(Math.round(p.py) + 8 - H / 2, 0, mh - H);
  },
  update() {
    const p = this.pl, M = this.M; vinculoTick();
    for (const e of [p, this.fol, ...this.npcs]) if (e.moving) {
      const sp = e.speed || 1; e.mt += sp;
      const n = e.hop ? 32 : 16, k = Math.min(1, e.mt / n);
      e.px = e.fx + (e.x * 16 - e.fx) * k; e.py = e.fy + (e.y * 16 - e.fy) * k;
      e.step = Math.floor(e.mt / 8) + (e.stepBase || 1);
      if (k >= 1) { e.moving = false; e.step = 0; if (e.hop) { e.hop = 0; if (!e.fol) sfx.land(); burst(e.px + 8, e.py + 14, e.fol ? 5 : 8, { w: 1, c: ['#f6e4b0', '#fff'], v0: .3, v1: 1, a0: Math.PI, a1: Math.PI * 2, l0: 8, l1: 16 }); if (!e.fol) shake(1.5); } if (e.done) { const d = e.done; e.done = null; d(); } }
    }
    if (!p.moving && !busy) {
      if (hit.start && G.party.length) { startMenu(); return; }
      if (hit.a) { this.interact(); return; }
      let dir = -1, best = 1e9;
      ['down', 'up', 'left', 'right'].forEach((b, i) => { if (down[b] && heldT[b] < best) { best = heldT[b]; dir = i; } });
      if (dir >= 0) {
        if (dir !== p.dir && best < 6 && !p.justMoved) { p.dir = dir; }
        else if (dir !== p.dir) { p.dir = dir; this.tryMove(dir); }
        else if (best >= 6 || p.justMoved) this.tryMove(dir);
      } else p.justMoved = false;
    }
    if (M.def.storm && !busy && Math.random() < .004) { flash('#e8e0ff', .5); setTimeout(() => sfx.thunder(), 300); }
    // humo, chispas del poste
    if (M.smoke && frame % 14 === 0) for (const s of M.smoke) part(s.steam ? { w: 1, x: s.x, y: s.y, vx: rnd(.1, .35), vy: -.4, life: 30, c: '#ffffff', s: 2, kind: 'puff', drag: .98 } : { w: 1, x: s.x + rnd(-1, 1), y: s.y, vx: rnd(.05, .2), vy: -.25, life: 70, c: pick(['#f8f8f0', '#d8dce0', '#c0c8d0']), s: 3, kind: 'puff', drag: 1 });
    if (!M.def.indoor && frame % 16 === 0) { // vida en el aire: polen de día, luciérnagas de noche, ondas en el agua
      const ph = dayPhase();
      if (ph === 3) part({ w: 1, x: this.cam.x + rnd(W), y: this.cam.y + rnd(H), vx: rnd(-.12, .12), vy: rnd(-.12, .04), life: ri(90, 160), c: '#e0f880', kind: 'fly', drag: 1 });
      else if (frame % 32 === 0) part({ w: 1, x: this.cam.x - 3, y: this.cam.y + rnd(H), vx: rnd(.25, .5), vy: rnd(-.04, .1), life: 400, c: pick(['#fffbe0', '#fffbe0', '#f8c0d0', '#d8f8a0']), kind: 'pollen', drag: 1 });
      if (M.shore && M.shore.length && frame % 48 === 0) { const sh = pick(M.shore), tx = (sh[0] >> 4) * 16 + rnd(4, 12), ty = (sh[1] >> 4) * 16 + rnd(4, 12); if (M.at(tx >> 4, ty >> 4) === '~') part({ w: 1, x: tx, y: ty, kind: 'ring', s: 5, life: 34, c: '#d8f0ff' }); }
    }
    this.camUpdate();
  },
  tryMove(dir) {
    const p = this.pl, M = this.M, tx = p.x + DX[dir], ty = p.y + DY[dir];
    const wp = (M.def.warps || {})[tx + ',' + ty];
    if (wp) { if (wp.need && !G.flags[wp.need]) { p.dir = dir; run(() => talk(wp.locked)); return; } if (MAPS[wp.map] && MAPS[wp.map].indoor && !M.def.indoor) G.ret = { map: G.map, x: tx, y: ty + 1, dir: 0 }; this.warp(wp.map === 'RET' ? (G.ret || { map: 'ciudad', x: 4, y: 18, dir: 0 }) : wp); return; }
    if (M.at(tx, ty) === 'L' && dir === 0 && !this.solid(tx, ty + 1)) { this.begin(p, tx, ty + 1, 1.6); p.hop = 1; sfx.hop(); p.done = () => this.arrive(); return; }
    if (this.solid(tx, ty)) { if (frame - (this.lastBump || 0) > 20) { sfx.bump(); this.lastBump = frame; } p.step = 0; return; }
    this.begin(p, tx, ty, down.run || down.b ? 2 : 1); p.done = () => this.arrive(); p.justMoved = true;
  },
  begin(e, tx, ty, speed) {
    const ox = e.x, oy = e.y; e.fx = e.px; e.fy = e.py; e.x = tx; e.y = ty; e.mt = 0; e.moving = true; e.speed = speed; e.stepBase = e.stepBase === 1 ? 3 : 1;
    if (e === this.pl) this.follow(ox, oy, speed);
  },
  follow(ox, oy, speed) { // la seguidora ocupa la casilla que dejas
    const f = this.fol; if (f.x === ox && f.y === oy) return;
    const dx = ox - f.x, dy = oy - f.y, far = Math.abs(dx) + Math.abs(dy) > 1;
    f.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
    if (f.hide) { f.hide = false; f.x = ox; f.y = oy; f.px = ox * 16; f.py = oy * 16; f.pop = 10; return; }
    if (f.moving) { f.px = f.x * 16; f.py = f.y * 16; }
    this.begin(f, ox, oy, far ? Math.max(1.6, speed) : speed); f.hop = far ? 1 : 0; f.idle = 0;
  },
  // un personaje de una escena va a pisar la casilla de tu compañera: ella se aparta a una libre (mejor si queda a tu lado)
  apartaFol(tx, ty, quien) {
    const f = this.fol, p = this.pl; if (!this.folMon() || f.x !== tx || f.y !== ty) return;
    const libres = [0, 1, 2, 3].map(d => [f.x + DX[d], f.y + DY[d]]).filter(([x, y]) => !this.solid(x, y) && !(x === quien.x && y === quien.y) && this.M.at(x, y) !== 'L');
    if (!libres.length) { f.hide = true; return; }
    const [nx, ny] = libres.sort((a, b) => Math.abs(a[0] - p.x) + Math.abs(a[1] - p.y) - Math.abs(b[0] - p.x) - Math.abs(b[1] - p.y))[0];
    f.dir = nx < f.x ? 2 : nx > f.x ? 3 : ny < f.y ? 1 : 0; if (f.moving) { f.px = f.x * 16; f.py = f.y * 16; }
    this.begin(f, nx, ny, 1.6); f.hop = 1; f.idle = 0;
  },
  folMon() { const m = G && G.party[0]; return m && m.hp > 0 && !this.fol.hide ? m : null; },
  arrive() {
    const p = this.pl, M = this.M; G.steps++; this.checkArea(); if (G.steps % 48 === 0 && this.folMon()) darAfecto(this.folMon(), 1);
    const tr = TRIGGERS[G.map]; if (tr && tr(p.x, p.y)) return;
    if (M.def.cave && G.party.length && '.rv'.includes(M.at(p.x, p.y)) && --this.grace <= 0 && Math.random() < .09) { this.grace = 6; this.wild(); return; }
    if (M.at(p.x, p.y) === '"') {
      sfx.grass(); burst(p.px + 8, p.py + 11, 5, { w: 1, c: [PAL.g2, PAL.g0, PAL.g3], v0: .4, v1: 1.1, a0: Math.PI * 1.1, a1: Math.PI * 1.9, ay: .08, l0: 12, l1: 22 });
      this.rustle.push({ x: p.x, y: p.y, t: 0 });
      if (--this.grace <= 0 && G.party.length && Math.random() < .14) { this.grace = 4; this.wild(); return; }
    } else if (M.at(p.x, p.y) === ':' || (p.speed || 1) > 1) { part({ w: 1, x: p.px + 8 - DX[p.dir] * 5, y: p.py + 13, vx: -DX[p.dir] * .2, vy: -.12, life: (p.speed || 1) > 1 ? 16 : 10, c: M.at(p.x, p.y) === ':' ? '#e8d09c' : '#c4f094', s: 2, kind: 'puff', shrink: 1 }); if (G.steps % 2 === 0) sfx.step(); }
    // entrenadores que te ven
    for (const n of this.npcs) if (n.sight && !n.beaten && !n.gone) {
      for (let k = 1; k <= n.sight; k++) { const sx = n.x + DX[n.dir] * k, sy = n.y + DY[n.dir] * k; if (sx === p.x && sy === p.y) { this.spotted(n, k); return; } if (this.solid(sx, sy, true)) break; }
    }
  },
  async spotted(n, dist) {
    busy++; music(''); await emote(n, '!'); music('combate');
    for (let k = 1; k < dist; k++) await walk(n, n.dir);
    this.pl.dir = n.dir ^ 1; try { await n.talk(n); } finally { busy--; dlgOff(); }
  },
  async wild() {
    const tb = (WILD[this.M.def.wild || this.area] || WILD['RUTA 1'])[dayPhase()], tot = tb.reduce((a, t) => a + t[3], 0); let r = Math.random() * tot, t = tb[0];
    for (const e of tb) { r -= e[3]; if (r < 0) { t = e; break; } }
    await runBattle({ wild: makeMon(t[0], ri(t[1], t[2])) });
  },
  async warp(wp) {
    busy++; sfx.door(); await fade(1, 10); this.load(wp.map, wp.x, wp.y, wp.dir); await wait(4); await fade(0, 10); busy--;
    const e = ENTER[wp.map]; if (e) e();
  },
  interact() {
    const p = this.pl, tx = p.x + DX[p.dir], ty = p.y + DY[p.dir], n = this.npcAt(tx, ty), k = tx + ',' + ty;
    const f = this.fol, fm = this.folMon(); if (fm && f.x === tx && f.y === ty && !f.moving && !(INTER[G.map] || {})[k] && !n) { run(() => folTalk(fm)); return; }
    if (n) { if (!n.mon && !n.item && !n.noTurn) n.dir = p.dir ^ 1; if (!n.item) { n.bounce = -3; tw(n, { bounce: 0 }, 14, 'bounce'); } run(() => n.talk(n)); return; }
    const it = (INTER[G.map] || {})[k]; if (it) { run(it); return; }
    const ba = (this.M.def.objects || []).find(o => barreraOn(o) && o.msg && tx >= o.x && tx < o.x + o.w && ty >= o.y && ty < o.y + o.h); if (ba) { run(() => talk(ba.msg)); return; }
    const ch = this.M.at(tx, ty);
    if (ch === '~') run(() => talk('En el fondo brillan tuercas. Alguien pide deseos con ferretería.'));
  },
  draw() {
    const M = this.M, cx = Math.round(this.cam.x), cy = Math.round(this.cam.y), p = this.pl, out = !M.def.indoor, ph = out ? dayPhase() : 1;
    g.fillStyle = '#101018'; g.fillRect(0, 0, W, H);
    const x0 = Math.max(0, cx >> 4), y0 = Math.max(0, cy >> 4), x1 = Math.min(M.w - 1, (cx + W) >> 4), y1 = Math.min(M.h - 1, (cy + H) >> 4);
    const lean = (x, y) => { const r = this.rustle.find(r => r.x === x && r.y === y); return r ? ((r.t >> 1) & 1) * 2 : clamp(1 + Math.round(Math.sin(frame * .045 + x * .85 + y * .5) * .95), 0, 2); };
    if (M.wbg) {
      g.drawImage(M.wbg, -cx, -cy);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (M.rows[y][x] === '~') g.drawImage(TILE.water, (((frame >> 4) + x + y) & 3) * 16, 0, 16, 16, x * 16 - cx, y * 16 - cy, 16, 16);
    }
    g.drawImage(M.bg, -cx, -cy);
    if (M.shore) { // espuma que va y viene
      const t = frame >> 3, o = (frame >> 5) & 1; g.fillStyle = '#eefaff';
      for (const [sx, sy, sw] of M.shore) { const X = sx - cx, Y = sy - cy; if (X < -16 || Y < -16 || X > W || Y > H) continue;
        for (let i = 0; i < 16; i++) { if ((i + (sx >> 2) + (sy >> 3) + t) % 9 > 3) continue; if (sw) g.fillRect(X + i, Y + o + ((i * 7 + sx) % 5 === 0 ? 1 : 0), 1, 1); else g.fillRect(X + o, Y + i, 1, 1); } }
    }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const ch = M.rows[y][x];
      if (ch === '"') g.drawImage(TILE.tall, lean(x, y) * 16, 0, 16, 16, x * 16 - cx, y * 16 - cy, 16, 16);
      else if (ch === ',') g.drawImage(TILE.flower, (((frame + x * 13) >> 5) & 1) * 16, 0, 16, 16, x * 16 - cx, y * 16 - cy, 16, 16); }
    for (let i = this.rustle.length - 1; i >= 0; i--) if (++this.rustle[i].t > 16) this.rustle.splice(i, 1);
    if (M.def.dyn) M.def.dyn(cx, cy);
    drawBarreras(cx, cy);
    const fm = this.folMon(), ents = [p, ...(fm ? [this.fol] : []), ...this.npcs.filter(n => !n.gone)].sort((a, b) => a.py - b.py || (a === p ? 1 : -1));
    for (const e of ents) {
      let ex = Math.round(e.px) - cx, ey = Math.round(e.py) - cy - 3, j = 0;
      if (e.hop) j = Math.sin(e.mt / 32 * Math.PI) * 10;
      if (e.item) { drawCrate(ex, ey + 3); continue; }
      const fxT = Math.floor((e.px + 8) / 16), fyT = Math.floor((e.py + 12) / 16), inTall = M.at(fxT, fyT) === '"' && !e.hop;
      if (!inTall) { g.fillStyle = 'rgba(20,44,60,.3)'; const sw = j > 4 ? 6 : 10; g.fillRect(ex + 8 - sw / 2, ey + 15, sw, 2); g.fillRect(ex + 9 - sw / 2, ey + 17, sw - 2, 1); g.fillRect(ex + 9 - sw / 2, ey + 14, sw - 2, 1); }
      if (e.fol) { const o = MON[fm.sp], img = [o.fw, o.fb, o.fs, o.fr][e.dir], idleHop = !e.moving && (frame + 7) % 120 < 10 ? Math.round(Math.sin(((frame + 7) % 120) / 10 * Math.PI) * 3) : 0, b = e.moving ? ((e.mt >> 3) & 1) : 0, pop = e.pop > 0 ? e.pop-- : 0;
        if (pop) g.globalAlpha = 1 - pop / 10; g.drawImage(img, ex - 4, ey - 5 - b - idleHop - j - pop); g.globalAlpha = 1; if (fm.status && (frame >> 3) % 4 === 0) { g.fillStyle = '#f8e070'; g.fillRect(ex + 12, ey - 2, 2, 2); } }
      else if (e.mon) { const b = (frame + e.x * 9) % 50 < 8 ? 1 : 0; g.drawImage(MON[e.mon].fw, ex - 4, ey - 5 - b); }
      else drawChar(e.style, e.dir, e.moving ? e.step : 0, ex, ey - j + (e.bounce || 0), !e.moving && !e.hop && (frame + e.x * 17 + e.y * 29) % 76 < 24);
      if (inTall) g.drawImage(TILE.tallFront, lean(fxT, fyT) * 16, 0, 16, 16, fxT * 16 - cx, fyT * 16 - cy, 16, 16);
    }
    g.drawImage(M.fg, -cx, -cy); drawPostes(cx, cy);
    for (const c of M.cables) {
      const sag = 9; g.fillStyle = '#2a2a3a';
      for (let i = 0, N = Math.abs(c.x1 - c.x0); i <= N; i++) { const k = i / N, x = c.x0 + (c.x1 - c.x0) * k, y = c.y0 + Math.sin(k * Math.PI) * sag; g.fillRect(Math.round(x - cx), Math.round(y - cy), 1, 1); }
      const k = ((frame + c.x0) % 240) / 90; if (k <= 1) { const x = c.x0 + (c.x1 - c.x0) * k - cx, y = c.y0 + Math.sin(k * Math.PI) * sag - cy; g.fillStyle = '#fff8c0'; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); g.fillStyle = '#f8d030'; g.fillRect(Math.round(x) - 3, Math.round(y), 2, 1); if (frame % 3 === 0) part({ w: 1, x: x + cx, y: y + cy, vy: rnd(.2, .6), vx: rnd(-.3, .3), life: 10, c: '#f8e070' }); }
    }
    for (const b of M.blink) if (((frame >> (b.slow ? 5 : 4)) + b.x) & 1) { g.fillStyle = b.c; g.fillRect(b.x - cx, b.y - cy, b.w || 1, b.h || 1); }
    drawParts(true, cx, cy);
    if (out && ph < 3) { // sombras de nubes que pasan
      g.globalCompositeOperation = 'multiply';
      for (let i = 0; i < 2; i++) { const px = (((i * 190 + frame * .14 - cx) % 330) + 330) % 330 - 128, py = (((i * 150 + 40 + frame * .03 - cy) % 280) + 280) % 280 - 64; g.drawImage(TILE.cloud, Math.round(px), Math.round(py)); }
      g.globalCompositeOperation = 'source-over';
    }
    if (ph !== 1) {
      g.globalCompositeOperation = 'multiply'; g.fillStyle = ['#ffe6cc', '', '#ffb48c', '#7888dc'][ph]; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
      if (ph >= 2) for (const l of M.lights) {
        const lx = l.x - cx, ly = l.y - cy; if (lx < -20 || ly < -20 || lx > W + 20 || ly > H + 20) continue;
        if (l.win) { g.fillStyle = '#f8e488'; g.fillRect(l.win[0] - cx, l.win[1] - cy, 5, 4); g.fillRect(l.win[0] - cx + 7, l.win[1] - cy, 5, 4); g.fillRect(l.win[0] - cx, l.win[1] - cy + 6, 5, 4); g.fillRect(l.win[0] - cx + 7, l.win[1] - cy + 6, 5, 4); g.fillStyle = '#fffbd0'; g.fillRect(l.win[0] - cx, l.win[1] - cy, 5, 1); g.fillRect(l.win[0] - cx + 7, l.win[1] - cy, 5, 1); }
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = ph === 3 ? .15 : .07; disc(lx, ly, l.r + 5, l.c || '#f8c850'); disc(lx, ly, l.r, l.c || '#f8c850'); disc(lx, ly, Math.round(l.r * .55), l.c || '#f8c850'); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      }
    }
    drawParts(true, cx, cy, true);
    if (M.def.dark && !G.flags.luz) drawDark(cx, cy);
    g.drawImage(TILE.vig, 0, 0);
    for (const e of this.emotes) { const ex = Math.round(e.e.px) - cx + 1, ey = Math.round(e.e.py) - cy - 19 - Math.round(e.s * 3); drawEmote(ex, ey, e.ch); }
    if (this.banner.y > -20) { const w = tw_(this.banner.t) + 16; box(2, Math.round(this.banner.y), w, 17, { ac: '#f0c020' }); txt(this.banner.t, 10, Math.round(this.banner.y) + 8); }
  },
};
// folTalk (hablar con el que te sigue) está en vinculo.js
function run(f) { busy++; Promise.resolve().then(f).catch(e => console.error(e)).finally(() => { busy--; dlgOff(); }); }
async function emote(e, ch) { const o = { e, ch, s: 0 }; world.emotes.push(o); sfx.excl(); await tw(o, { s: 1 }, 8, 'back'); await wait(34); world.emotes.splice(world.emotes.indexOf(o), 1); }
function walk(e, dir, speed = 1) { e.dir = dir; if (e !== world.pl && !e.fol) world.apartaFol(e.x + DX[dir], e.y + DY[dir], e); return new Promise(r => { world.begin(e, e.x + DX[dir], e.y + DY[dir], speed); e.done = r; }); }
async function walkTo(e, tx, ty) { while (e.y !== ty && e.x !== tx && e.y > 5) await walk(e, 1); while (e.x !== tx) await walk(e, e.x < tx ? 3 : 2); while (e.y !== ty) await walk(e, e.y < ty ? 0 : 1); }
const npc = (o) => Object.assign({ px: o.x * 16, py: o.y * 16, dir: 0, step: 0, moving: false }, o);
function give(item, n) { G.bag[item] = (G.bag[item] || 0) + n; }
async function got(text) { const prev = curName; const f = jingle('objeto'); await say(text, { hold: true }); await wait(Math.max(10, f - 40)); dlg.arrow = true; await anyKey(); dlg.arrow = false; music(prev); }

// ── personajes por mapa ──
const NPCS = {
  pueblo: () => [
    npc({ x: 12, y: 29, style: 'ayudante', dir: 2, talk: () => talk(G.flags.starter ? 'La hierba alta se mueve sola cuando hay un Makinamon dentro. Fíjate bien.' : 'Soy el ayudante de la profesora. Vigilo que nadie pise la hierba alta sin Makinamon.') }),
    npc({ x: 17, y: 37, style: 'abuelo', dir: 0, talk: () => talk('Yo era un crío la noche de la Tormenta Madre. El rayo cayó sobre la Gran Fábrica MAKINA…', '…y no se fue. Se quedó a vivir dentro de las máquinas. Lo llamamos el PULSO.', 'Desde entonces mi tostadora me mira raro. Con cariño, pero raro.') }),
    npc({ x: 9, y: 41, style: 'nina', dir: 3, talk: () => talk('TUERCOL lleva tres días cruzando el jardín. ¡Ya casi llega a la valla!') }),
    npc({ x: 10, y: 41, mon: 'tuercol', talk: async () => { sfx.cry(SPECIES.tuercol.cry); await talk('TUERCOL: ¡Tuuuerc!'); } }),
    npc({ x: 14, y: 36, style: 'vecina', dir: 0, talk: () => talk('Eso es un POSTE DE CARGA. Acércale a tus Makinamon y les devuelve el Pulso.', 'Es gratis. Lo paga el ayuntamiento con lo que ahorra en farolas: las farolas se fueron andando.') }),
    npc({ x: 17, y: 14, style: 'leo', dir: 2, sight: 4, beaten: G.flags.leo, talk: n => trainerTalk(n, { id: 'leo', name: 'LEO', cls: 'CHAVAL', party: [['enchufin', 3], ['tuercol', 4]], pre: '¡Alto! ¡Mis Makinamon llevan las pilas recién puestas!', lose: '¡Se me han gastado!', post: 'Tengo que pedirle más pilas a mi madre…', prize: async () => { give('celda', 2); await got('LEO te da 2 CELDAS por las molestias.'); } }) }),
    G.flags.rival1 && !G.flags.rival2 && npc({ x: 11, y: 3, style: 'cobre', dir: 0, sight: 3, talk: n => trainerTalk(n, { id: 'rival2', name: 'COBRE', cls: 'RIVAL', tier: 'rival', items: 1, itemHeal: 20, party: [['enchufin', 5], [G.flags.rivalSp, 7]], pre: '¡Por fin! Llevo un rato esperándote. He acoplado uno nuevo, ¿sabes?', lose: 'Vale. Vale, vale, vale.', post: 'COBRE: Bueno. Al menos ya estoy calentito.', after: () => cobreSeVa(n) }) }),
    G.flags.rival2 ? npc({ x: 10, y: 1, style: 'obrero', dir: 3, talk: () => talk('Detrás de mí empieza la RUTA 2. Al final está la CENTRAL DINAMO.', 'Si de verdad vas a echar a los de APAGÓN, llévate ACEITE. Esa gente no juega limpio.') })
      : npc({ x: 11, y: 1, style: 'obrero', dir: 0, talk: () => talk('La carretera a CIUDAD DINAMO está cortada.', 'Alguien ha vaciado el Pulso de la Central de la noche a la mañana. Dicen que fue la Compañía APAGÓN.', 'Por aquí solo pasa gente que sepa defenderse. Y tú todavía tienes cara de pueblo.') }),
    !G.flags.itemAceite && npc({ x: 4, y: 15, item: 1, talk: async n => { n.gone = true; G.flags.itemAceite = 1; give('aceite', 1); await got('¡Has encontrado un bote de ACEITE 3 EN 1!'); } }),
    G.flags.fin && npc({ x: 18, y: 34, style: 'cobre', dir: 0, talk: () => cobrePost() }),
  ],
  taller: () => [
    npc({ x: 6, y: 3, style: 'estano', dir: 0, noTurn: 0, talk: () => G.flags.fin ? estanoPost() : talk(...(G.flags.starter ? ['Baja el Pulso de un Makinamon salvaje antes de lanzarle la CELDA. Cuanto más agotado, mejor entra.', 'Y si los tuyos se quedan sin chispa, usa el POSTE DE CARGA del pueblo.'] : [`¡${G.name}! Justo a tiempo.`, 'En el banco hay tres CELDAS, y dentro de cada una, un Makinamon. Elige con calma: os vais a aguantar mucho tiempo.'])) }),
  ],
};
NPCS.ruta2 = () => [
  npc({ x: 9, y: 7, style: 'cobre', dir: 0, talk: () => G.flags.luz ? talk('COBRE: Has encendido la Central tú solo. Bueno, con tus Makinamon.', 'COBRE: La próxima vez la enciendo yo. Y más fuerte.') : talk('COBRE: Los de APAGÓN se han encerrado ahí dentro. He entrado y no veía ni mis zapatillas.', 'COBRE: Dicen que hay tres GENERADORES parados. Si alguien los rearmara… Yo vigilo la puerta. Por si acaso. No por miedo.') }),
  npc({ x: 18, y: 5, style: 'operaria', dir: 0, talk: () => G.flags.luz ? talk('¡Ha vuelto la corriente! Ya puedo calentarme el café en el microondas. Hacía tres días que me lo tomaba con lágrimas.') : talk('Trabajo en la Central. Bueno, trabajaba: llegaron los de APAGÓN con sus monos negros y nos echaron a todos.', 'Usa ese POSTE DE CARGA antes de entrar. Tiene batería de reserva para un rato.') }),
  npc({ x: 13, y: 9, style: 'apagon', dir: 2, sight: 2, beaten: G.flags.recluta0, talk: n => trainerTalk(n, { id: 'recluta0', name: 'RAMIRO', cls: 'RECLUTA APAGÓN', party: [['fundin', 8], ['chatarrata', 8]], pre: '¡Alto! Zona en mantenimiento. Indefinido. Por orden de la Compañía APAGÓN.', lose: '¡Se me ha ido la luz! Ah, no, que era yo.', post: 'Dentro está la jefa CONTADORA. Ella no se apaga nunca.' }) }),
  npc({ x: 10, y: 19, style: 'pescador', dir: 2, beaten: G.flags.pescador, talk: n => trainerTalk(n, { id: 'pescador', name: 'PACO', cls: 'PESCADOR', party: [['grifin', 8], ['grifin', 9]], pre: 'Llevo toda la mañana y solo pican grifos. ¿Tú sabes lo que cuesta pescar un grifo? ¡Pues ahora lo vas a saber!', lose: 'Se me ha enredado el sedal en el caño.', post: 'De noche salen cosas raras del estanque. Cables, sobre todo.' }) }),
  npc({ x: 16, y: 27, style: 'veraneante', dir: 2, sight: 2, beaten: G.flags.veraneante, talk: n => trainerTalk(n, { id: 'veraneante', name: 'MARI', cls: 'VERANEANTE', party: [['ventolin', 9], ['mecherin', 9]], pre: '¡Qué calor! Necesito un combate para airearme.', lose: 'Uf, ahora tengo más calor.', post: 'Un VENTOLÍN en agosto vale más que un coche. Te lo digo yo.' }) }),
  npc({ x: 6, y: 32, style: 'chatarrero', dir: 3, beaten: G.flags.chatarrero, talk: n => trainerTalk(n, { id: 'chatarrero', name: 'ELOY', cls: 'CHATARRERO', party: [['chatarrata', 9], ['brujulin', 10], ['latagato', 9]], pre: 'Todo lo que ves es mío. Hasta lo que no ves. ¡Defiende tus tornillos!', lose: 'Me has dejado para el desguace.', post: 'Los de APAGÓN vinieron a venderme fusibles fundidos. Fundidos. A mí. Les eché a escobazos.', prize: async () => { give('celda', 3); await got('ELOY te da 3 CELDAS recuperadas. Huelen a óxido.'); } }) }),
  !G.flags.itemR2a && npc({ x: 2, y: 22, item: 1, talk: async n => { n.gone = true; G.flags.itemR2a = 1; give('aceite', 2); await got('¡Has encontrado 2 botes de ACEITE 3 EN 1!'); } }),
  !G.flags.itemR2b && npc({ x: 21, y: 11, item: 1, talk: async n => { n.gone = true; G.flags.itemR2b = 1; give('celda', 3); await got('¡Has encontrado 3 CELDAS!'); } }),
  !G.flags.itemR2c && npc({ x: 8, y: 35, item: 1, talk: async n => { n.gone = true; G.flags.itemR2c = 1; give('aceite', 1); await got('¡Has encontrado un bote de ACEITE 3 EN 1!'); } }),
];
NPCS.central = () => [
  npc({ x: 9, y: 12, style: 'apagon', dir: 2, sight: 3, lamp: 1, beaten: G.flags.recluta1, talk: n => trainerTalk(n, { id: 'recluta1', name: 'SONIA', cls: 'RECLUTA APAGÓN', party: [['fundin', 8], ['mecherin', 9]], pre: '¿Quién ha encendido esa linterna? ¡Aquí se ahorra energía!', lose: 'Pues ya está. Me he gastado.', post: 'Los generadores tienen una palanca. No se lo digas a nadie.' }) }),
  npc({ x: 9, y: 5, style: 'apagon', dir: 0, sight: 4, lamp: 1, beaten: G.flags.recluta2, talk: n => trainerTalk(n, { id: 'recluta2', name: 'LUCAS', cls: 'RECLUTA APAGÓN', party: [['chatarrata', 9], ['fundin', 9]], pre: '¡Nadie pasa a ver a la jefa sin cita previa!', lose: 'Vale, te doy cita. Para ya.', post: 'La jefa CONTADORA está arriba, junto a la turbina. Cuenta hasta las ovejas.' }) }),
  npc({ x: 4, y: 5, style: 'apagon', dir: 0, sight: 4, lamp: 1, beaten: G.flags.recluta3, talk: n => trainerTalk(n, { id: 'recluta3', name: 'NURIA', cls: 'RECLUTA APAGÓN', party: [['fundin', 9], ['cablebra', 10]], pre: 'Somos la Compañía APAGÓN. Si no lo usas, ¿para qué lo quieres?', lose: 'Tienes demasiado Pulso para mi gusto.', post: 'Mi CABLEBRA me lo regaló la empresa. Era eso o la cesta de Navidad.' }) }),
  !G.flags.luz && npc({ x: 6, y: 3, style: 'contadora', dir: 0, lamp: 1, talk: n => contadora(n) }),
  !G.flags.itemC1 && npc({ x: 12, y: 13, item: 1, talk: async n => { n.gone = true; G.flags.itemC1 = 1; give('aceite', 2); await got('¡Has encontrado 2 botes de ACEITE 3 EN 1!'); } }),
];

// ── Ciudad Dinamo ──
NPCS.ciudad = () => [
  npc({ x: 5, y: 8, style: 'apagon', dir: 0, talk: () => talk(G.flags.llaveTorre ? 'Eh, eh, ¿esa tarjeta de dónde la has sacado?' : 'Esto es la TORRE APAGÓN. Cerrada al público. Y al privado. Y a los curiosos con gorra.') }),
  npc({ x: 23, y: 11, style: 'abuelo', dir: 2, talk: () => talk('Cuando yo era joven, las vías de la ESTACIÓN llegaban hasta la GRAN FÁBRICA MAKINA.', 'Las cortaron después de la Tormenta Madre. Dicen que allí dentro el RAYO MADRE sigue durmiendo.', 'Para abrir la Fábrica hacen falta los seis FUSIBLES de las Centrales del valle. Así lo dejaron dicho los fundadores.') }),
  npc({ x: 9, y: 13, style: 'vecina', dir: 0, talk: () => talk('Los de APAGÓN van por las casas comprando electrodomésticos viejos. Pagan bien, ¿eh?', 'Lo raro es que luego los aparatos ya no hablan. Ni zumban. Ni nada.') }),
  npc({ x: 12, y: 19, style: 'leo', dir: 2, sight: 3, beaten: G.flags.colegial, talk: n => trainerTalk(n, { id: 'colegial', name: 'BRUNO', cls: 'COLEGIAL', party: [['pilin', 11], ['relojin', 12]], pre: '¡Ey! Mi PILÍN dura más que el tuyo. ¡Fijo!', lose: 'Vale, el tuyo dura más. Pero el mío es más mono.', post: 'Mi RELOJÍN lo encontré en la ESTACIÓN. Allí se esconden los que se escapan de casa.' }) }),
  npc({ x: 20, y: 19, style: 'nina', dir: 0, talk: relojQuest }),
  npc({ x: 15, y: 22, style: 'obrero', dir: 0, talk: () => talk(G.flags.pase ? '¡Adelante! La RUTA 3 baja hasta PUERTO ROÑA. Ojo con la arena, que se mete en las tuercas.' : 'OBRAS. Solo pasa quien traiga un PASE DE OBRA firmado por la jefa de la SUBESTACIÓN, VOLTA.', ...(G.flags.pase ? [] : ['Y VOLTA solo firma a quien la gana en un combate. Así es ella.'])) }),
  npc({ x: 26, y: 13, style: 'operaria', dir: 2, talk: () => talk('La SUBESTACIÓN reparte la luz que le llega de la Central Dinamo. Ahora que vuelve a haber Pulso, VOLTA está que trina de alegría.', 'Bueno, «de alegría» es un decir. Ella trina siempre.') }),
  !G.flags.itemCiudad && npc({ x: 1, y: 22, item: 1, talk: async n => { n.gone = true; G.flags.itemCiudad = 1; give('celdaplus', 2); await got('¡Has encontrado 2 CELDAS PLUS!'); } }),
];
NPCS.subestacion = () => [
  npc({ x: 9, y: 10, style: 'operaria', dir: 2, sight: 3, beaten: G.flags.opDinamo1, talk: n => trainerTalk(n, { id: 'opDinamo1', name: 'ÍÑIGO', cls: 'OPERARIO', type: 'CHISPA', party: [['enchufin', 12], ['pilin', 12]], pre: '¡Alto! Para ver a la jefa hay que pasar por mis enchufes.', lose: '¡Me has fundido los plomos!', post: 'La cerca de arriba la controla mi compañera. Es más lista que yo. Y lo sabe.' }) }),
  npc({ x: 3, y: 7, style: 'operaria', dir: 3, sight: 4, beaten: G.flags.opDinamo2, talk: n => trainerTalk(n, { id: 'opDinamo2', name: 'MARISA', cls: 'OPERARIA', type: 'CHISPA', party: [['cablebra', 13], ['enchufin', 13]], pre: 'VOLTA dice que si alguien llega hasta aquí, se merece un calambre de bienvenida.', lose: 'Bienvenido, pues.', post: 'VOLTA usa a REGLETÓN. Seis enchufes y ni una pizca de paciencia.' }) }),
  !G.fusibles.includes('CHISPA') && npc({ x: 6, y: 2, style: 'volta', dir: 0, talk: n => leaderTalk(n, 'CHISPA') }),
  G.fusibles.includes('CHISPA') && npc({ x: 6, y: 2, style: 'volta', dir: 0, talk: () => G.flags.fin ? leaderRematch('CHISPA') : talk('VOLTA: El PASE DE OBRA te lleva a la RUTA 3. Al final está PUERTO ROÑA.', 'VOLTA: Allí manda la CAPITANA HERRÍN. Si te pilla con prisa, te hunde. Si te pilla sin prisa, también.') }),
];
NPCS.ferreteria = () => [npc({ x: 5, y: 2, style: 'chatarrero', dir: 0, noTurn: 1, talk: () => talk('Habla conmigo por encima del mostrador.') })];
NPCS.casaReloj = () => [npc({ x: 5, y: 3, style: 'vecina', dir: 2, talk: () => talk(G.flags.relojDone ? 'Desde que volvió el despertador, mi hija llega puntual a todas partes. Hasta a las peleas.' : '¿Has visto a mi hija fuera? Lleva toda la mañana buscando el despertador.') })];
NPCS.casaVerde = () => [npc({ x: 5, y: 3, style: 'abuelo', dir: 2, talk: () => talk('Vendí mi vieja radio a la Compañía APAGÓN por cuatro tuercas.', 'Me arrepiento cada noche. Ella me cantaba los partes del tiempo con voz de soprano.') })];
NPCS.casaRosa = () => [npc({ x: 2, y: 3, style: 'vecina', dir: 0, talk: async () => { if (G.flags.abuelaOlvido) return talk('ABUELA OLVIDO: ¿Ya te has comido la merienda? Pues toma otra. Ay, no, que ya te di la grasa.'); await talk('ABUELA OLVIDO: ¡Ay, qué makinista tan delgada! Toma, para tus bichitos.'); G.flags.abuelaOlvido = 1; give('grasa', 2); await got('La ABUELA OLVIDO te da 2 GRASAS.'); } })];
NPCS.estacion = () => [
  npc({ x: 5, y: 2, style: 'obrero', dir: 0, noTurn: 1, talk: () => talk('JEFE DE ESTACIÓN: El último tren a la GRAN FÁBRICA salió hace cien años. Todavía lo estamos esperando.', 'JEFE DE ESTACIÓN: Si alguna vez se abre la Fábrica, aquí tienes billete. Ida, solo ida. Nadie ha vuelto a pedir vuelta.') }),
  npc({ x: 8, y: 5, style: 'veraneante', dir: 2, talk: () => talk('Estoy esperando el tren desde las ocho. ¿Cómo que no hay trenes? ¡Si ponía en el cartel!') }),
  !G.flags.relojFound && G.flags.relojAsked && npc({ x: 1, y: 6, mon: 'relojin', talk: async n => { n.gone = true; G.flags.relojFound = 1; sfx.cry(SPECIES.relojin.cry); give('reloj', 1); await got('¡Has encontrado el DESPERTADOR fugado! Tiembla de miedo. O de tic-tac.'); } }),
];
async function relojQuest() {
  if (G.flags.relojDone) return talk('¡Mi despertador ya no se escapa! Bueno, se escapa, pero vuelve a las siete.');
  if (G.flags.relojFound) {
    await say('¡MI DESPERTADOR! ¡Lo has encontrado!'); G.bag.reloj = 0; G.flags.relojDone = 1;
    await say('Mira, dentro de la caja estaba esto. Nació anoche y te sigue con la mirada.');
    const m = makeMon('relojin', 12); G.seen.relojin = G.got.relojin = 1; if (G.party.length < 6) G.party.push(m); else G.box.push(m);
    sfx.cry(SPECIES.relojin.cry); await got('¡Te llevas a RELOJÍN!'); return talk('¡Cuídalo! Y dale cuerda los domingos.');
  }
  G.flags.relojAsked = 1; return talk('Mi DESPERTADOR se ha escapado de casa. ¡Otra vez!', 'La última vez lo encontraron en la ESTACIÓN, escondido entre las maletas.', 'Si lo ves, tráemelo. ¡Es que sin él no me despierto ni para jugar!');
}
// ── líderes de las Centrales ──
const LEADERS = {
  CHISPA: { name: 'VOLTA', style: 'volta', party: [['pilin', 12], ['cablebra', 13], ['regleton', 15]], items: 1, map: 'subestacion',
    rematch: [['bateron', 50], ['torreton', 51], ['kilovato', 51], ['transformaton', 52], ['regleton', 53]],
    rAsk: 'VOLTA: ¡Mira quién vuelve con chispa! He subido el voltaje de la Subestación.\n¿Probamos mis nuevos fusibles?', rLose: '¡Fundida otra vez! Pero qué descarga tan buena.', rPost: 'VOLTA: Cuando quieras recargar adrenalina, ya sabes dónde estoy.',
    pre: ['VOLTA: ¡Por fin! Tú eres quien devolvió la luz a la Central. Te debo una.', 'VOLTA: Y aquí las deudas se pagan con un combate. Soy VOLTA, jefa de la SUBESTACIÓN DINAMO. ¡Que salten chispas!'],
    lose: '¡Cortocircuito total! Me has dejado a cero.', after: async () => { give('pase', 1); G.flags.pase = 1; await got('VOLTA te da un PASE DE OBRA firmado.'); give('cable', 1); await got('Y además… ¡un CABLE COMPARTIDO! Ahora todo tu equipo aprende de cada combate.'); await say('VOLTA: Con eso te dejan pasar a la RUTA 3. Abajo está PUERTO ROÑA. Y por cierto, cuida esa CELDA: los de APAGÓN no descansan.'); } },
  OXIDO: { name: 'HERRÍN', style: 'herrin', party: [['anclin', 18], ['bidongato', 19], ['ancladon', 21]], items: 1, map: 'astillero',
    rematch: [['bidongato', 50], ['desguazor', 51], ['cuadron', 51], ['fontanon', 52], ['ancladon', 53]],
    rAsk: 'HERRÍN: ¡A babor la campeona del valle! Mi tripulación ha sacado brillo hasta al óxido.\n¿Zarpamos a por una revancha?', rLose: '¡Tocada y hundida! Sigues teniendo mano de capitana.', rPost: 'HERRÍN: El mar siempre vuelve, y yo también. Pásate cuando quieras pelea.',
    pre: ['HERRÍN: Así que tú me has traído el ancla. Y has echado a ese TASADOR de mi puerto.', 'HERRÍN: Soy HERRÍN, capitana del ASTILLERO ROÑA. Te lo agradezco… y por eso no pienso dejarme ganar. ¡Todos a sus puestos!'],
    lose: '¡Hundida! Pero con honor, que es como se hunde una.', after: async () => { await say('HERRÍN: He mandado bajar la pasarela del oeste. La RUTA 4 lleva a VILLA MUSGO.'); await say('HERRÍN: Allí TALLO cuida el invernadero más grande del valle. Últimamente dice que sus plantas están tristes.'); } },
  MUSGO: { name: 'TALLO', cls: 'JEFE DE CENTRAL', style: 'tallo', party: [['asperson', 25], ['farolon', 25], ['invernadon', 26]], items: 1, map: 'invernadero',
    rematch: [['asperson', 51], ['farolon', 52], ['ventolon', 52], ['campanon', 53], ['invernadon', 54]],
    rAsk: 'TALLO: ¡Con el Pulso libre mis invernaderos han crecido hasta el techo!\n¿Quieres ver cómo pelean ahora mis brotes?', rLose: '¡Menuda poda! Mis plantas aplauden con las hojas.', rPost: 'TALLO: Vuelve siempre que quieras sombra… o un buen combate.',
    pre: ['TALLO: ¡Mis plantas vuelven a cantar! Y todo gracias a ti.', 'TALLO: Soy TALLO, jefe del INVERNADERO MUSGO. Te debo la vida de mi huerto… y por eso te voy a dar el combate de tu vida. ¡A crecer!'],
    lose: 'Me has segado. Pero volveré a brotar, como todo lo bueno.', after: async () => { await say('TALLO: Llévate también esto. Lo escondía LA PODADORA en mi cobertizo.'); give('lubricante', 2); await got('TALLO te da 2 LUBRICANTES.'); } },
  IMAN: { name: 'PIRITA', style: 'pirita', party: [['tornillon', 31], ['astrolabon', 32], ['gruiman', 34]], items: 2, map: 'salaImanta',
    rematch: [['tornillon', 51], ['astrolabon', 52], ['torreton', 52], ['campanon', 53], ['gruiman', 54]],
    rAsk: 'PIRITA: Sabía que volverías a la mina. El buen hierro siempre tira hacia el imán.\n¿Chocamos polos otra vez?', rLose: '¡Desimantada de pies a cabeza! Qué bárbara.', rPost: 'PIRITA: Ni la veta más dura de la mina aguanta tu pulso.',
    pre: ['PIRITA: Tú eres la que sacó a mi hermano de esa torre de corbatas. Gracias.', 'PIRITA: Soy PIRITA, jefa de la SALA DEL IMÁN. Y aquí abajo, cuando algo me gusta, me lo quedo pegado. ¡A ver si te despegas!'],
    lose: 'Me has desimantado. Eso no le pasaba a nadie desde mi abuela.', after: async () => { await say('PIRITA: Mi cuadrilla ya está despejando el camino a FRAGUA. Ve con cuidado: allí el aire quema.'); } },
  BRASA: { name: 'CANDIL', cls: 'JEFE DE CENTRAL', style: 'candil', party: [['sopleton', 35], ['planchon', 36], ['altohorno', 37]], items: 1, map: 'forja',
    rematch: [['hornazo', 51], ['sopleton', 52], ['planchon', 53], ['desguazor', 53], ['altohorno', 54]],
    rAsk: 'CANDIL: ¡Al fin alguien que aguanta el calor! He avivado la fragua al máximo.\n¿Ponemos tu equipo al rojo vivo?', rLose: '¡Ja, ja! ¡Me has vuelto a templar el yunque!', rPost: 'CANDIL: Aún no me jubilo, ¿eh? Vuelve cuando quieras chispas de las buenas.',
    pre: ['CANDIL: Vaya. Vienes con cuatro fusibles y cara de no tener frío. Eso me gusta.', 'CANDIL: Soy CANDIL, maestro de la GRAN FORJA. Aquí el que no aguanta el calor, sale templado. ¡Al yunque!'],
    lose: '¡Me has fundido! Cuarenta años sin apagarme… y me apagas tú.', after: async () => { await say('CANDIL: La reja del norte ya está abierta. Sube a las TERMAS NIEBLA.'); await say('CANDIL: Y llévate esto. Un buen herrero siempre paga sus deudas.'); give('lubricante', 2); give('recarga', 2); await got('CANDIL te da 2 LUBRICANTES y 2 RECARGAS.'); } },
  VAPOR: { name: 'BRUMA', style: 'bruma', party: [['cafeteron', 40], ['balizon', 40], ['locomoton', 42]], items: 2, map: 'balneario',
    rematch: [['calderon', 52], ['cafeteron', 53], ['balizon', 53], ['fontanon', 54], ['locomoton', 55]],
    rAsk: 'BRUMA: El vapor de las termas nunca había subido tan alto como hoy.\n¿Te apetece un duelo a toda presión?', rLose: 'Uf… qué baño de humildad. Y qué gusto.', rPost: 'BRUMA: La niebla siempre te guarda sitio. Vuelve cuando quieras.',
    pre: ['BRUMA: Gracias por devolverme el vapor. Llevaba tres días con los poros cerrados.', 'BRUMA: Soy BRUMA, jefa del BALNEARIO NIEBLA. El sexto fusible es el mío. Y el vapor no se rinde: se evapora y vuelve. ¡Respira hondo!'],
    lose: 'Me has dejado sin presión. Qué alivio, la verdad.', after: async () => { await say('BRUMA: Seis fusibles. Ve al portón del norte de las termas. Alguien te espera allí.'); } },
};
async function leaderRematch(type) {
  const L = LEADERS[type];
  if (!await ask(L.rAsk)) { dlgOff(); return talk(`${L.name}: Cuando te apetezca calentar motores, aquí me tienes.`); }
  dlgOff();
  const res = await runBattle({ trainer: { name: L.name, cls: L.cls || 'JEFA DE CENTRAL', tier: 'leader', type, style: L.style, party: L.rematch.map(([s, l]) => makeMon(s, l)), lose: L.rLose, items: 2, itemHeal: 999, base: 50 } });
  if (res !== 'win') return;
  G.flags['rem' + type] = 1; await talk(L.rPost); saveGame();
}
async function leaderTalk(n, type) {
  const L = LEADERS[type]; for (const l of L.pre) await say(l); dlgOff();
  const res = await runBattle({ trainer: { name: L.name, cls: L.cls || 'JEFA DE CENTRAL', tier: 'leader', type, style: L.style, party: L.party.map(([s, l]) => makeMon(s, l)), lose: L.lose, items: L.items, base: 30 } });
  if (res !== 'win') return;
  await fuseCeremony(type); if (L.after) await L.after(); dlgOff(); world.load(G.map, world.pl.x, world.pl.y, world.pl.dir); saveGame();
}
async function fuseCeremony(type) {
  const ty = TYPES[type], sc = { t: 0, a: 0, draw() { this.t++; g.globalAlpha = this.a; g.fillStyle = '#101820'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 16; i++) { const an = i * Math.PI / 8 + this.t * .015; g.fillStyle = i & 1 ? dark(ty.c, .6) : dark(ty.c, .75); g.beginPath(); g.moveTo(80, 56); g.lineTo(80 + Math.cos(an) * 160, 56 + Math.sin(an) * 160); g.lineTo(80 + Math.cos(an + .2) * 160, 56 + Math.sin(an + .2) * 160); g.fill(); }
    const s = Math.min(1, this.t / 30), up = this.t > 50; g.fillStyle = INK; g.fillRect(64, 24, 32, 64); g.fillStyle = '#f4f0e0'; g.fillRect(66, 26, 28, 60); g.fillStyle = ty.c; g.fillRect(66, 26, 28, 7);
    g.fillStyle = '#26262e'; g.fillRect(76, 40, 8, 34); g.fillStyle = ty.d; g.fillRect(73, up ? 41 : 64, 14, 10); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(73, up ? 41 : 64, 14, 1);
    if (up) { g.fillStyle = (this.t >> 3) & 1 ? '#58f890' : '#a8ffc8'; g.fillRect(77, 78, 6, 4); }
    txtO('FUSIBLE ' + ty.n, 80 - tw_('FUSIBLE ' + ty.n) / 2, 9, '#fff'); g.globalAlpha = 1; } };
  ui.push(sc); music(''); await tw(sc, { a: 1 }, 20, 'lin'); await wait(30); sfx.lock(); shake(3); flash(ty.c, .8); burst(80, 56, 30, { c: [ty.c, '#fff'], v0: 1, v1: 4, kind: 'star' });
  G.fusibles.push(type); G.flags['fus' + type] = 1; const f = jingle('reforja'); await say(`¡${G.name} recibe el FUSIBLE ${ty.n}!`, { hold: true }); await wait(f); dlg.arrow = true; await anyKey(); dlg.arrow = false;
  await tw(sc, { a: 0 }, 16, 'lin'); ui.splice(ui.indexOf(sc), 1);
}

// ── Ruta 3 y Puerto Roña ──
NPCS.ruta3 = () => [
  npc({ x: 6, y: 11, style: 'pescador', dir: 3, sight: 4, beaten: G.flags.pescR3, talk: n => trainerTalk(n, { id: 'pescR3', name: 'LOLA', cls: 'PESCADORA', party: [['boyita', 15], ['grifin', 15], ['boyita', 16]], pre: '¡Has espantado a los peces! Bueno, a las boyas. ¡Lo pagarás!', lose: 'Ni una boya me queda.', post: 'Las BOYITAS de esta costa son las más simpáticas del valle. Y las más mojadas.' }) }),
  npc({ x: 16, y: 16, style: 'veraneante', dir: 2, sight: 3, beaten: G.flags.surfR3, talk: n => trainerTalk(n, { id: 'surfR3', name: 'IKER', cls: 'SURFISTA', party: [['cafetin', 16], ['planchita', 16]], pre: 'Ni una ola, tío. Necesito un combate para no aburrirme.', lose: 'Me has dado una buena revolcada.', post: 'Por la tarde salen PLANCHITAS a planchar la arena. En serio.' }) }),
  npc({ x: 8, y: 25, style: 'apagon', dir: 3, sight: 4, beaten: G.flags.reclutaR3, talk: n => trainerTalk(n, { id: 'reclutaR3', name: 'GERARDO', cls: 'RECLUTA APAGÓN', party: [['anclin', 16], ['fundin', 17]], pre: '¡Llevo prisa! Tengo que embarcar estas anclas antes de que zarpe EL APAGADO.', lose: 'Se me escapó la carga.', post: 'El barco está en PUERTO ROÑA. La capitana del puerto está que echa espuma por la boca.' }) }),
  !G.flags.rival3 && npc({ x: 10, y: 21, style: 'cobre', dir: 1, sight: 4, talk: n => rivalTalk(n, 3) }),
  !G.flags.itemR3a && npc({ x: 3, y: 29, item: 1, talk: async n => { n.gone = true; G.flags.itemR3a = 1; give('grasa', 1); await got('¡Has encontrado una GRASA!'); } }),
  !G.flags.itemR3b && npc({ x: 20, y: 6, item: 1, talk: async n => { n.gone = true; G.flags.itemR3b = 1; give('recarga', 1); await got('¡Has encontrado una RECARGA!'); } }),
];
NPCS.puerto = () => [
  npc({ x: 13, y: 7, style: 'pescador', dir: 0, talk: () => talk(G.flags.anclaVuelta ? '¡La capitana ha vuelto a abrir el ASTILLERO! Prepárate: pelea como pesca, sin soltar nunca.' : 'Esos de APAGÓN se han llevado las anclas del puerto. ¡Las anclas, que son ANCLINES vivos!', ...(G.flags.anclaVuelta ? [] : ['Y a la capitana HERRÍN le quitaron su ANCLA DE MANO. Se ha encerrado en el ASTILLERO y no recibe a nadie.'])) }),
  npc({ x: 20, y: 11, style: 'vecina', dir: 0, talk: () => talk('Mi marido dice que el barco negro se llama EL APAGADO. Le pega.', 'Lleva amarrado tres días cargando cosas que pitan y lloran. Así no hay quien duerma.') }),
  npc({ x: 6, y: 12, style: 'pescador', dir: 0, talk: () => talk('El faro del espigón lo encendió la FARERA cuando volvió la luz. Lleva cincuenta años subiendo esas escaleras.', 'Dice que desde arriba se ve la GRAN FÁBRICA en los días claros. Yo no me lo creo.') }),
  !G.flags.tasador && npc({ x: 12, y: 15, style: 'apagon', dir: 0, sight: 3, beaten: G.flags.guardaBarco, talk: n => trainerTalk(n, { id: 'guardaBarco', name: 'MATÍAS', cls: 'RECLUTA APAGÓN', party: [['imanin', 17], ['fundin', 17]], pre: 'Prohibido subir a bordo. Ni con billete.', lose: 'Vale, sube. Pero no toques nada que pite.', post: 'Abajo está EL TASADOR. Pone precio a todo, incluso a ti.' }) }),
  npc({ x: 27, y: 10, style: 'chatarrero', dir: 2, talk: () => talk(G.fusibles.includes('OXIDO') ? '¡La pasarela está bajada! Por ahí se va a la RUTA 4 y a VILLA MUSGO. Allí todo crece, hasta las tuercas.' : 'La pasarela de la RUTA 4 solo la baja la capitana. Es su manera de saber quién merece salir del puerto.') }),
];
NPCS.barco = () => [
  npc({ x: 3, y: 5, style: 'apagon', dir: 3, sight: 4, beaten: G.flags.barco1, talk: n => trainerTalk(n, { id: 'barco1', name: 'PALOMA', cls: 'RECLUTA APAGÓN', party: [['chatarrata', 17], ['imanin', 18]], pre: '¡Un polizón! El TASADOR te va a poner precio. Y será bajo.', lose: 'Valías más de lo que pensaba.', post: 'Esas jaulas tienen ANCLINES. Les sacamos el Pulso gota a gota para venderlo en botellas.' }) }),
  npc({ x: 11, y: 7, style: 'apagon', dir: 2, sight: 3, beaten: G.flags.barco2, talk: n => trainerTalk(n, { id: 'barco2', name: 'TOMÁS', cls: 'RECLUTA APAGÓN', party: [['fundin', 18], ['anclin', 18]], pre: 'El jefe está contando la mercancía. No le interrumpas, que se descuenta.', lose: 'Me he quedado sin saldo.', post: 'EL TASADOR es de los mandos. Dicen que tasó su propia casa y la vendió con él dentro.' }) }),
  !G.flags.tasador && npc({ x: 6, y: 2, style: 'tasador', dir: 0, talk: n => tasadorTalk(n) }),
  ...[3, 10].map((x, i) => !G.flags.tasador && npc({ x, y: 2, mon: 'anclin', talk: async () => { sfx.cry(SPECIES.anclin.cry); await talk('Un ANCLÍN en una jaula. Te mira con ojos de óxido.'); } })),
];
NPCS.astillero = () => [
  npc({ x: 10, y: 10, style: 'pescador', dir: 2, sight: 3, beaten: G.flags.marHerrin1, talk: n => trainerTalk(n, { id: 'marHerrin1', name: 'PEPE', cls: 'GRUMETE', type: 'OXIDO', party: [['anclin', 18], ['latagato', 18]], pre: '¡A sus órdenes! Digo… ¡en guardia!', lose: '¡Hombre al agua! Que soy yo.', post: 'El contramaestre tiene la llave de la valla de arriba.' }) }),
  npc({ x: 3, y: 6, style: 'chatarrero', dir: 0, sight: 2, beaten: G.flags.marHerrin2, talk: n => trainerTalk(n, { id: 'marHerrin2', name: 'BRAULIO', cls: 'CONTRAMAESTRE', type: 'OXIDO', party: [['chatarrata', 19], ['bidongato', 20]], pre: 'Cuarenta años en este astillero. Mis Makinamon tienen más óxido que yo canas.', lose: 'Me has dejado varado.', post: 'La capitana usa a ANCLADÓN. No suelta nunca. Ni el ancla ni la presa.' }) }),
  npc({ x: 10, y: 6, style: 'pescador', dir: 2, sight: 2, beaten: G.flags.marHerrin3, talk: n => trainerTalk(n, { id: 'marHerrin3', name: 'NEREA', cls: 'MARINERA', type: 'OXIDO', party: [['fundin', 19], ['anclin', 19]], pre: '¡Firmes! La capitana nos tiene a todos entrenados.', lose: 'Sin novedad en el frente. Bueno, con novedad.', post: 'El óxido no es suciedad. Es memoria del mar.' }) }),
  !G.fusibles.includes('OXIDO') && npc({ x: 6, y: 2, style: 'herrin', dir: 0, talk: n => leaderTalk(n, 'OXIDO') }),
  G.fusibles.includes('OXIDO') && npc({ x: 6, y: 2, style: 'herrin', dir: 0, talk: () => G.flags.fin ? leaderRematch('OXIDO') : talk('HERRÍN: La pasarela de la RUTA 4 ya está bajada. Navega derecho hasta VILLA MUSGO.', 'HERRÍN: Y si ves a esos de APAGÓN, dales recuerdos de mi parte. Con el ancla.') }),
];
NPCS.lonja = () => [npc({ x: 4, y: 3, style: 'pescador', dir: 0, talk: () => talk('Aquí antes se vendía pescado. Ahora vendemos las boyas que se jubilan.', 'Bueno, no se venden. Se adoptan. Las BOYITAS no se compran, que tienen su carácter.') }), npc({ x: 7, y: 5, style: 'vecina', dir: 2, talk: () => talk('¿Has probado a pescar en la RUTA 3 de noche? Salen IMANINES pegados a los anzuelos.') })];
NPCS.casaPescador = () => [npc({ x: 5, y: 3, style: 'pescador', dir: 2, talk: async () => { if (G.flags.cañaR) return talk('Lo que se pesca se comparte. Es la ley del puerto.'); G.flags.cañaR = 1; give('celdaplus', 3); await talk('Gracias por plantar cara a esos de APAGÓN. Toma, que en el mar todo flota menos la gratitud.'); await got('Te da 3 CELDAS PLUS.'); } })];
NPCS.casaFaro = () => [npc({ x: 5, y: 3, style: 'abuelo', dir: 2, talk: () => talk('LA FARERA: Cincuenta años subiendo al faro. Desde arriba, los días claros, se ve el humo de la GRAN FÁBRICA.', 'LA FARERA: Humo, digo. Lleva cien años cerrada y echa humo. Algo hay ahí dentro que sigue latiendo.') })];
async function tasadorTalk(n) {
  await say('EL TASADOR: Vaya, vaya. Una niña con gorra. ¿Cuánto vales tú? Veamos… unas doscientas tuercas, mal contadas.'); await say('EL TASADOR: Soy EL TASADOR, mando de la Compañía APAGÓN. Todo tiene precio. Hasta el Pulso. Sobre todo el Pulso.'); dlgOff();
  const res = await runBattle({ trainer: { name: 'TASADOR', cls: 'MANDO APAGÓN', tier: 'boss', style: 'tasador', items: 1, party: [makeMon('chatarrata', 18), makeMon('imanin', 19), makeMon('cuadron', 21)], lose: '¡Me has devaluado!' } });
  if (res !== 'win') return;
  await say('EL TASADOR: Bah. Quédate con las anclas. El Pulso de mar sabe a sal y no se vende bien.'); await say('EL TASADOR: Pero recuerda: el DIRECTOR OHMIO ya tiene comprador para la GRAN PILA. Y tú no tienes precio. Tienes coste.');
  dlgOff(); await walk(n, 3); await walk(n, 0); n.gone = true; sfx.door(); G.flags.tasador = 1; G.flags.anclaVuelta = 1; give('ancla', 1);
  for (const a of world.npcs) if (a.mon === 'anclin') { a.gone = true; burst(a.px + 8, a.py + 8, 10, { c: ['#c88458', '#fff'], v0: .5, v1: 2 }); }
  sfx.cry(SPECIES.anclin.cry); await got('¡Los ANCLINES salen corriendo de las jaulas! Uno se deja el ANCLA DE MANO de la capitana.');
  const m = makeMon('anclin', 16); G.seen.anclin = G.got.anclin = 1; if (G.party.length < 6) G.party.push(m); else G.box.push(m);
  await got('Un ANCLÍN se queda contigo. No te suelta la pierna.'); saveGame();
}
// combates contra Cobre: cada uno distinto, y él también crece
const RIVAL = {
  3: { lv: 17, team: sp => [['enchufin', 15], ['ventolin', 15], [sp, 17]], heal: 20, pre: ['COBRE: ¡Te he pillado! Vengo de PUERTO ROÑA y la capitana me ha echado a escobazos.', 'COBRE: Dice que hasta que no le devuelvan el ancla, no pelea con nadie. ¡Pues peleo contigo!'], lose: '¡Ni el mar me quita las ganas! Bueno, un poco sí.', post: ['COBRE: El barco de APAGÓN está en el muelle. Yo voy a mirar por la otra punta. ¡Tú por la pasarela!'] },
  4: { team: sp => [['regleton', 34], ['ventolon', 34], ['gruiman', 35], [sp, 37]], pre: ['COBRE: ¡Alto ahí! Cuatro fusibles tú, cero yo. Pero mira lo que he entrenado.', 'COBRE: Si te gano aquí, me dejas ir delante a la Fábrica. ¡Trato hecho!'], lose: 'Trato roto. Pero voy contigo igual, ¿eh?', post: ['COBRE: CANDIL está en la GRAN FORJA. Yo me quedo aquí calentándome las manos. Literalmente.'] },
};
const evoAt = (sp, lv) => { let s = sp; for (;;) { const e = SPECIES[s].evo; if (e && lv >= e.lv) s = e.to; else return s; } };
const COBRE_FINAL = sp => [['regleton', 46], ['ventolon', 46], ['gruiman', 46], ['campanon', 46], [sp, 48]].map(([s2, l]) => makeMon(evoAt(s2, l), l));
const COBRE_POST = sp => [['regleton', 53], ['ventolon', 53], ['gruiman', 54], ['campanon', 54], ['desguazor', 55], [sp, 56]].map(([s2, l]) => makeMon(evoAt(s2, l), l));
async function rivalTalk(n, k) {
  const R2 = RIVAL[k]; for (const l of R2.pre) await say(l); dlgOff();
  const party = R2.team(G.flags.rivalSp).map(([sp, lv]) => makeMon(evoAt(sp, lv), lv));
  const res = await runBattle({ trainer: { name: 'COBRE', cls: 'RIVAL', tier: 'rival', style: 'cobre', party, lose: R2.lose, items: 1, itemHeal: R2.heal || 60, noBlackout: k < 3 } });
  if (res !== 'win') return; for (const l of R2.post) await say(l); dlgOff();
  G.flags['rival' + k] = 1; await walk(n, 0); await walk(n, 0); n.gone = true; saveGame();
}

// ── Ruta 4 y Villa Musgo ──
NPCS.ruta4 = () => [
  npc({ x: 26, y: 15, style: 'vecina', dir: 1, sight: 3, beaten: G.flags.granjR4, talk: n => trainerTalk(n, { id: 'granjR4', name: 'CARMEN', cls: 'GRANJERA', party: [['macetin', 22], ['regadin', 22], ['asperson', 23]], pre: '¡Fuera de mis tomates! Bueno, de mis REGADINES. ¡Fuera igual!', lose: 'Me has dejado la huerta temblando.', post: 'Desde que APAGÓN puso esa bomba en el huerto de VILLA MUSGO, mis plantas tienen pena.' }) }),
  npc({ x: 15, y: 9, style: 'leo', dir: 2, sight: 4, beaten: G.flags.excR4, talk: n => trainerTalk(n, { id: 'excR4', name: 'DANI', cls: 'EXCURSIONISTA', party: [['relojin', 22], ['ventolin', 23]], pre: '¡Llevo veinte kilómetros andando! Unos cuantos más contigo no me matan.', lose: 'Vale, sí me matan.', post: 'Si oyes un tic-tac en la hierba alta, es un RELOJÍN. O una bomba. Mejor que sea un RELOJÍN.' }) }),
  npc({ x: 6, y: 7, style: 'apagon', dir: 3, sight: 4, beaten: G.flags.reclR4, talk: n => trainerTalk(n, { id: 'reclR4', name: 'IVÁN', cls: 'RECLUTA APAGÓN', party: [['fundin', 22], ['macetin', 22]], pre: 'Estoy vigilando el camino. La jefa LA PODADORA no quiere visitas en el huerto.', lose: 'La jefa me va a podar a mí.', post: 'La bomba saca el Pulso de las raíces. Luego lo embotellamos. ¡Es energía verde!' }) }),
  npc({ x: 35, y: 9, style: 'abuelo', dir: 2, talk: () => talk('Esta tierra era la más fértil del valle. Las plantas crecían cantando.', 'Ahora callan. Algo les chupa la alegría por las raíces.') }),
  !G.flags.itemR4a && npc({ x: 2, y: 4, item: 1, talk: async n => { n.gone = true; G.flags.itemR4a = 1; give('lubricante', 1); await got('¡Has encontrado un LUBRICANTE!'); } }),
  !G.flags.itemR4b && npc({ x: 37, y: 19, item: 1, talk: async n => { n.gone = true; G.flags.itemR4b = 1; give('celdaplus', 3); await got('¡Has encontrado 3 CELDAS PLUS!'); } }),
];
NPCS.villa = () => [
  !G.flags.podadora && npc({ x: 9, y: 3, style: 'podadora', dir: 2, talk: n => podadoraTalk(n) }),
  !G.flags.podadora && npc({ x: 13, y: 5, style: 'apagon', dir: 0, sight: 3, beaten: G.flags.huerto1, talk: n => trainerTalk(n, { id: 'huerto1', name: 'SARA', cls: 'RECLUTA APAGÓN', party: [['fundin', 23], ['chatarrata', 24]], pre: 'Prohibido el paso al huerto. Zona de… cosecha.', lose: 'Me has cosechado tú a mí.', post: 'LA PODADORA está junto a la bomba. Le gustan las tijeras más que las personas.' }) }),
  npc({ x: 19, y: 11, style: 'tallo', dir: 0, talk: () => G.fusibles.includes('MUSGO') ? talk('TALLO: ¡Mis plantas cantan otra vez! Escucha… ¿lo oyes? Es un poco desafinado, pero es precioso.') : G.flags.podadora ? talk('TALLO: ¡La bomba se ha parado! Ya noto a mis plantas respirar.', 'TALLO: Ven al INVERNADERO cuando quieras. Ahora sí tengo ganas de pelear.') : talk('TALLO: Soy TALLO, el jardinero del INVERNADERO. Y esto… esto es una tragedia.', 'TALLO: Esos de APAGÓN han clavado una bomba en el huerto. Les saca el Pulso a las raíces.', 'TALLO: Mis plantas no tienen fuerzas para nada. Y yo tampoco, sin ellas. Si paras la bomba, te debo un combate.') }),
  npc({ x: 23, y: 12, style: 'nina', dir: 2, talk: () => talk('En VILLA MUSGO todos tenemos un MACETÍN. El mío se llama Pepito. Bueno, todos se llaman Pepito.') }),
  npc({ x: 9, y: 21, style: 'veraneante', dir: 1, talk: () => talk('Dicen que después de la GRAN FÁBRICA no hay nada. Que el valle se acaba allí.', 'Yo creo que el valle empieza allí. Pero yo creo muchas cosas.') }),
  G.fusibles.includes('MUSGO') && !G.flags.cobreTorre && npc({ x: 24, y: 10, style: 'cobre', dir: 2, talk: () => cobreTorre() }),
];
NPCS.invernadero = () => [
  npc({ x: 10, y: 10, style: 'chatarrero', dir: 2, sight: 3, beaten: G.flags.jarTallo1, talk: n => trainerTalk(n, { id: 'jarTallo1', name: 'FAUSTINO', cls: 'JARDINERO', type: 'MUSGO', party: [['regadin', 25], ['macetin', 25]], pre: 'Este invernadero lo regamos con sudor. Y con REGADINES.', lose: 'Me has dejado mustio.', post: 'Mi compañera de arriba cuida los setos como si fueran nietos.' }) }),
  npc({ x: 3, y: 6, style: 'vecina', dir: 3, sight: 3, beaten: G.flags.jarTallo2, talk: n => trainerTalk(n, { id: 'jarTallo2', name: 'ROSA', cls: 'JARDINERA', type: 'MUSGO', party: [['bulbio', 25], ['asperson', 26]], pre: '¿Has venido a pisar mis flores o a pelear? Que no sea lo primero.', lose: 'Bien jugado. Has podado mi estrategia.', post: 'TALLO lleva a INVERNADÓN. Es tan grande que dentro tiene su propio clima.' }) }),
  !G.fusibles.includes('MUSGO') && npc({ x: 6, y: 2, style: 'tallo', dir: 0, talk: n => leaderTalk(n, 'MUSGO') }),
  G.fusibles.includes('MUSGO') && npc({ x: 6, y: 2, style: 'tallo', dir: 0, talk: () => G.flags.fin ? leaderRematch('MUSGO') : talk('TALLO: La tarjeta que soltó LA PODADORA abre la TORRE APAGÓN, en CIUDAD DINAMO.', 'TALLO: Yo no subiría solo. Pero tú no vas sola: llevas a tu equipo. Y a ese chico pelirrojo que te sigue a todas partes.') }),
];
NPCS.casaMusgo = () => [npc({ x: 5, y: 3, style: 'abuelo', dir: 2, talk: () => talk('El musgo crece en el lado norte de las piedras. Y de los Makinamon viejos.', 'Por eso mi FAROLEDO tiene la espalda verde. Es su abrigo.') })];
NPCS.casaTallo = () => [npc({ x: 5, y: 4, style: 'nina', dir: 2, talk: () => talk('Soy la sobrina de TALLO. Él habla con las plantas, y lo peor es que ellas le contestan.') })];
NPCS.casaSemilla = () => [npc({ x: 5, y: 3, style: 'vecina', dir: 2, talk: async () => { if (G.flags.semillaR) return talk('Que crezcan sanos.'); G.flags.semillaR = 1; const m = makeMon('macetin', 20); G.seen.macetin = G.got.macetin = 1; if (G.party.length < 6) G.party.push(m); else G.box.push(m); await talk('Gracias por salvar el huerto. Este MACETÍN nació esta mañana y quiere ver mundo.'); sfx.cry(SPECIES.macetin.cry); await got('¡Te llevas a MACETÍN!'); } })];
async function podadoraTalk(n) {
  await say('LA PODADORA: ¿Una niña en mi huerto? Las malas hierbas siempre vuelven.'); await say('LA PODADORA: Soy LA PODADORA, mando de la Compañía APAGÓN. Corto lo que sobra. Y tú sobras.'); dlgOff();
  const res = await runBattle({ trainer: { name: 'PODADORA', cls: 'MANDO APAGÓN', tier: 'boss', style: 'podadora', items: 1, party: [makeMon('mecherin', 24), makeMon('chatarrata', 24), makeMon('sopleton', 26)], lose: '¡Me has dejado sin filo!' } });
  if (res !== 'win') return;
  await say('LA PODADORA: Bah. El Pulso de las plantas es flojo de todas formas. La GRAN PILA necesita algo más… eléctrico.');
  await say('LA PODADORA: Se me cae la tarjeta, ¿ves? Qué torpe. Si subes a la TORRE, el DIRECTOR OHMIO te recibirá encantado. Encantado de apagarte.');
  dlgOff(); for (let i = 0; i < 3; i++) { flash('#58e890', .4); shake(2); sfx.bump(); await wait(10); }
  G.flags.podadora = 1; G.flags.llaveTorre = 1; give('llave', 1); n.gone = true; world.refresh();
  await got('¡La bomba se detiene! LA PODADORA huye y deja caer una LLAVE MAESTRA.'); music('villa'); saveGame();
}
async function cobreTorre() {
  await say('COBRE: ¡Ya está! Lo he oído todo: la TORRE APAGÓN, el DIRECTOR OHMIO, la GRAN PILA…');
  await say('COBRE: Esta vez no vamos a pelear entre nosotros. Vamos juntos. Bueno, tú delante, que tienes la tarjeta.');
  await say('COBRE: Te espero en la puerta de la TORRE, en CIUDAD DINAMO. ¡No tardes!'); dlgOff(); G.flags.cobreTorre = 1; world.load(G.map, world.pl.x, world.pl.y, world.pl.dir);
}

// ── Torre APAGÓN ──
NPCS.torre = () => [
  npc({ x: 4, y: 3, style: 'apagon', dir: 0, noTurn: 1, talk: () => talk(G.flags.ohmioTorre ? 'RECEPCIÓN: Estamos de mudanza. Si busca al director, se ha ido a la GRAN FÁBRICA. Sin dejar dirección.' : 'RECEPCIÓN: Bienvenido a la Compañía APAGÓN. ¿Tiene cita? No. Pues hala, a pelear.') }),
  npc({ x: 10, y: 9, style: 'apagon', dir: 2, sight: 4, beaten: G.flags.torre1, talk: n => trainerTalk(n, { id: 'torre1', name: 'ESTEBAN', cls: 'RECLUTA APAGÓN', party: [['fundin', 28], ['imanin', 28], ['chatarrata', 29]], pre: '¿Una visita sin cita? Eso se paga.', lose: 'Me has dado de baja.', post: 'El ascensor sube a la planta 1. La CONTADORA está allí, de muy mal humor.' }) }),
  npc({ x: 2, y: 5, style: 'apagon', dir: 3, sight: 4, beaten: G.flags.torre2, talk: n => trainerTalk(n, { id: 'torre2', name: 'MARGA', cls: 'RECLUTA APAGÓN', party: [['mecherin', 28], ['cuadron', 29]], pre: 'La Compañía APAGÓN cuida de sus empleados. Sobre todo de que trabajen.', lose: 'Ay, ¿esto cuenta como horas extra?', post: 'Me prometieron un contrato fijo cuando se llene la GRAN PILA.' }) }),
  G.flags.cobreTorre && !G.flags.ohmioTorre && npc({ x: 8, y: 10, style: 'cobre', dir: 1, talk: () => talk('COBRE: Tú sube. Yo me encargo de que no bajen a por ti. ¡Vamos, que tengo las manos sudando!') }),
];
NPCS.torre2 = () => [
  npc({ x: 3, y: 6, style: 'apagon', dir: 0, sight: 3, beaten: G.flags.torre3, talk: n => trainerTalk(n, { id: 'torre3', name: 'RAÚL', cls: 'RECLUTA APAGÓN', party: [['bateron', 29], ['fundin', 29]], pre: '¡Aquí arriba solo suben los de traje!', lose: 'Me has arrugado el traje.', post: 'La jefa CONTADORA no perdona. Ni olvida. Ni redondea.' }) }),
  npc({ x: 9, y: 8, style: 'apagon', dir: 2, sight: 3, beaten: G.flags.torre4, talk: n => trainerTalk(n, { id: 'torre4', name: 'LIDIA', cls: 'RECLUTA APAGÓN', party: [['torreton', 29], ['imanin', 29]], pre: 'Seguridad de planta. Muéstreme su acreditación. ¿No? Combate.', lose: 'Acreditación aprobada. Qué remedio.', post: 'El despacho del director está en la última planta. Pero yo no he dicho nada.' }) }),
  !G.flags.contadora2 && npc({ x: 11, y: 3, style: 'contadora', dir: 0, talk: n => contadora2(n) }),
];
NPCS.torre3 = () => [
  !G.flags.ohmioTorre && npc({ x: 6, y: 3, style: 'ohmio', dir: 0, talk: n => ohmioTorre(n) }),
  !G.flags.casco && npc({ x: 2, y: 8, style: 'chatarrero', dir: 3, talk: async n => { await say('???: ¡Por fin alguien que no lleva corbata! Me llamo JACINTO, minero de la MINA IMANTA.'); await say('JACINTO: Me secuestraron para que les enseñara las vetas de Pulso de la mina. Mi hermana PIRITA debe de estar furiosa.'); await say('JACINTO: Toma mi CASCO MINERO. La MINA IMANTA está al este de CIUDAD DINAMO, pasada la RUTA 5. Sin casco no se entra.');
    G.flags.casco = 1; give('casco', 1); await got('¡Recibes el CASCO MINERO!'); await say('JACINTO: Yo me voy por las escaleras. Los ascensores me dan claustrofobia. Y los de APAGÓN, más.'); dlgOff(); n.gone = true; saveGame(); } }),
];
async function contadora2(n) {
  await say('CONTADORA: Tú otra vez. Me debes tres generadores, una turbina y mi dignidad.'); await say('CONTADORA: Esta vez he hecho las cuentas. Y salen a mi favor.'); dlgOff();
  const res = await runBattle({ trainer: { name: 'CONTADORA', cls: 'MANDO APAGÓN', tier: 'boss', style: 'contadora', items: 2, party: [makeMon('cuadron', 30), makeMon('torreton', 30), makeMon('kilovato', 32)], lose: '¡Error en la suma! ¡Imposible!' } });
  if (res !== 'win') return;
  await say('CONTADORA: Vale. Sube. El DIRECTOR OHMIO te está esperando. Yo me voy a revisar mis cálculos. Todos. Desde 1987.'); dlgOff();
  await walk(n, 3); n.gone = true; sfx.door(); G.flags.contadora2 = 1; saveGame();
}
async function ohmioTorre(n) {
  music('');
  await say('???: Bienvenida. Llevaba tiempo queriendo conocerte. Siéntate. Ah, no, que aquí no hay sillas para visitas.');
  await say('OHMIO: Soy el DIRECTOR OHMIO, de la Compañía APAGÓN. Y tú eres la niña que lleva meses estropeándome el negocio.'); music('jefeApagon');
  await say('OHMIO: ¿Sabes qué hay dentro de la GRAN FÁBRICA? El RAYO MADRE. Cien años repartiendo Pulso gratis entre cacharros. Un desperdicio.');
  await say('OHMIO: Mi GRAN PILA lo va a recoger entero. Ni un vatio suelto. Y luego, a quien quiera luz, que pague.');
  await say('OHMIO: El problema es la puerta de la Fábrica: solo se abre con los seis FUSIBLES de las Centrales.');
  await say('OHMIO: Y mira por dónde… alguien los está juntando por mí. Sigue así, chiquilla. Cuando tengas los seis, te estaré esperando.');
  dlgOff(); flash('#f8d030', .6); sfx.whoosh(); await wait(10);
  for (let i = 0; i < 2; i++) await walk(n, 0); await walk(n, 3); await walk(n, 3); n.gone = true; sfx.door(); shake(3); await wait(20);
  await talk('El DIRECTOR OHMIO sale por una puerta secreta. Desde la azotea se oye un helicóptero alejarse hacia el norte.');
  G.flags.ohmioTorre = 1; music('ciudad'); saveGame();
  const co = npc({ x: 6, y: 9, style: 'cobre', dir: 1 }); world.npcs.push(co); await walkTo(co, 6, 6);
  await say('COBRE: ¿Se ha escapado? ¡Será…! Bueno. Al menos ahora sabemos su plan.');
  await say('COBRE: Faltan tres FUSIBLES: la MINA IMANTA, FRAGUA y las TERMAS NIEBLA. Tú vas a por ellos. Yo voy a avisar a la profesora.');
  await say('COBRE: Y cuando tengas los seis… no se los des a ese señor. Dáselos a la puerta. Tú ya me entiendes.'); dlgOff();
  await walkTo(co, 6, 9); co.gone = true;
}

// ── Ruta 5, Poblado y Mina Imanta ──
NPCS.ruta5 = () => [
  npc({ x: 12, y: 16, style: 'chatarrero', dir: 1, sight: 4, beaten: G.flags.monR5, talk: n => trainerTalk(n, { id: 'monR5', name: 'ANSELMO', cls: 'MONTAÑERO', party: [['tuercol', 29], ['tornillon', 30]], pre: '¡Eh, novata! En la montaña se saluda. Y luego se pelea.', lose: 'Me has hecho rodar ladera abajo.', post: 'Las piedras de esta ruta están imantadas. Los BRUJULINES se vuelven locos.' }) }),
  npc({ x: 21, y: 8, style: 'apagon', dir: 2, sight: 4, beaten: G.flags.reclR5, talk: n => trainerTalk(n, { id: 'reclR5', name: 'CELIA', cls: 'RECLUTA APAGÓN', party: [['bateron', 30], ['fundin', 30]], pre: 'Me han mandado a vigilar la mina. Hace un frío que pela.', lose: 'Encima esto. Pido el traslado.', post: 'El jefe quiere el Pulso de las vetas de la mina. Pero PIRITA no deja entrar a nadie.' }) }),
  npc({ x: 30, y: 9, style: 'veraneante', dir: 1, sight: 3, beaten: G.flags.excR5, talk: n => trainerTalk(n, { id: 'excR5', name: 'ALBA', cls: 'ESCALADORA', party: [['brujulin', 29], ['relojin', 30], ['imanin', 30]], pre: '¡Cima! Ah, no, que eres tú. Bueno, combate de todas formas.', lose: 'Me he quedado sin cuerda.', post: 'Desde la cima se ve FRAGUA echando humo. Y más al norte, la GRAN FÁBRICA.' }) }),
  !G.flags.itemR5 && npc({ x: 4, y: 19, item: 1, talk: async n => { n.gone = true; G.flags.itemR5 = 1; give('lubricante', 1); give('recarga', 1); await got('¡Has encontrado un LUBRICANTE y una RECARGA!'); } }),
];
NPCS.poblado = () => [
  npc({ x: 12, y: 5, style: 'chatarrero', dir: 0, talk: () => talk(G.fusibles.includes('IMAN') ? '¡Camino despejado hacia FRAGUA! Allí forjan hasta las nubes.' : 'Esta es la MINA IMANTA. Dentro todo está a oscuras, pero tu casco alumbra lo justo.', ...(G.fusibles.includes('IMAN') ? [] : ['La SALA DEL IMÁN de PIRITA está al fondo, arriba a la derecha. Sigue los raíles.'])) }),
  npc({ x: 5, y: 9, style: 'nina', dir: 3, talk: () => talk('Mi papá dice que los IMANINES de la mina se pegan a las cucharas. Por eso aquí comemos con palillos.') }),
  G.flags.casco && npc({ x: 19, y: 9, style: 'chatarrero', dir: 2, talk: async () => { if (G.bag.linterna) return talk('JACINTO: ¡Gracias otra vez! PIRITA dice que ya no le debo nada. Que te lo debe a ti.'); await talk('JACINTO: ¡Has venido! Toma, para la mina. Con esto verás más que con el casco solo.'); give('linterna', 1); await got('¡Recibes la LINTERNA de dinamo!'); } }),
];
NPCS.mina = () => [
  npc({ x: 5, y: 12, style: 'chatarrero', dir: 3, sight: 4, lamp: 1, beaten: G.flags.minero1, talk: n => trainerTalk(n, { id: 'minero1', name: 'BENITO', cls: 'MINERO', party: [['tuercol', 30], ['anclin', 30], ['tornillon', 31]], pre: '¡Cuidado con la cabeza! Y con mis TUERCOLES.', lose: 'Me has dejado sin veta.', post: 'Al fondo a la derecha hay un ascensor que baja a la SALA DEL IMÁN.' }) }),
  npc({ x: 20, y: 8, style: 'pescador', dir: 2, sight: 3, lamp: 1, beaten: G.flags.minero2, talk: n => trainerTalk(n, { id: 'minero2', name: 'LUZ', cls: 'MINERA', party: [['imanin', 31], ['brujulin', 31]], pre: 'Me llamo LUZ. Sí, en una mina. Ríete y pelea.', lose: 'Me has apagado.', post: 'Los BRUJULINES de aquí abajo apuntan todos a la SALA DEL IMÁN.' }) }),
  npc({ x: 3, y: 4, style: 'apagon', dir: 3, sight: 3, lamp: 1, beaten: G.flags.reclMina, talk: n => trainerTalk(n, { id: 'reclMina', name: 'PACO', cls: 'RECLUTA APAGÓN', party: [['cuadron', 31], ['bateron', 31]], pre: '¡Estoy perdido! Digo… ¡estoy de guardia!', lose: 'Perdido y derrotado. Mi día.', post: '¿Sabes por dónde se sale? Es para un amigo.' }) }),
  !G.flags.itemMina1 && npc({ x: 21, y: 18, item: 1, talk: async n => { n.gone = true; G.flags.itemMina1 = 1; give('grasa', 2); await got('¡Has encontrado 2 GRASAS!'); } }),
  !G.flags.itemMina2 && npc({ x: 3, y: 17, item: 1, talk: async n => { n.gone = true; G.flags.itemMina2 = 1; give('celdaplus', 4); await got('¡Has encontrado 4 CELDAS PLUS!'); } }),
];
NPCS.salaImanta = () => [
  npc({ x: 9, y: 10, style: 'chatarrero', dir: 2, sight: 3, beaten: G.flags.minPirita1, talk: n => trainerTalk(n, { id: 'minPirita1', name: 'RAMÓN', cls: 'BARRENERO', type: 'IMAN', party: [['imanin', 31], ['tuercol', 32]], pre: 'Aquí abajo todo se pega. Hasta las derrotas.', lose: 'Me has despegado.', post: 'La capataza de arriba tiene el interruptor de la reja.' }) }),
  npc({ x: 3, y: 7, style: 'vecina', dir: 3, sight: 4, beaten: G.flags.minPirita2, talk: n => trainerTalk(n, { id: 'minPirita2', name: 'AMPARO', cls: 'CAPATAZA', type: 'IMAN', party: [['brujulin', 32], ['tornillon', 33]], pre: 'Cuarenta años en la mina y nunca he perdido el norte. Tampoco un combate.', lose: 'Hoy he perdido las dos cosas.', post: 'PIRITA lleva a GRUIMÁN. Levanta vagonetas con una mano. Y con la otra, a ti.' }) }),
  !G.fusibles.includes('IMAN') && npc({ x: 6, y: 2, style: 'pirita', dir: 0, talk: n => leaderTalk(n, 'IMAN') }),
  G.fusibles.includes('IMAN') && npc({ x: 6, y: 2, style: 'pirita', dir: 0, talk: () => G.flags.fin ? leaderRematch('IMAN') : talk('PIRITA: El derrumbe del camino a FRAGUA ya está despejado. Allí manda CANDIL, el forjador.', 'PIRITA: Dile que vas de mi parte. Igual te pega más flojo. O más fuerte. Con CANDIL nunca se sabe.') }),
];
NPCS.casaMinera = () => [npc({ x: 5, y: 3, style: 'vecina', dir: 2, talk: () => talk('En el poblado todos tenemos algún familiar en la mina. Y algún Makinamon pegado a la nevera.') })];
NPCS.casaJacinto = () => [npc({ x: 5, y: 3, style: 'nina', dir: 2, talk: () => talk(G.flags.casco ? '¡Mi tío JACINTO ha vuelto! Dice que una niña con gorra lo sacó de una torre. ¿Eras tú?' : 'Mi tío JACINTO no ha vuelto de la ciudad. Mamá dice que está «de reunión». Mamá miente fatal.') })];

// ── Ruta 6, Fragua, Ruta 7 y Termas Niebla ──
NPCS.ruta6 = () => [
  npc({ x: 15, y: 4, style: 'chatarrero', dir: 0, sight: 3, beaten: G.flags.herR6, talk: n => trainerTalk(n, { id: 'herR6', name: 'TOMASA', cls: 'HERRERA', party: [['planchita', 34], ['sopleton', 35]], pre: '¡Cuidado con la lava! Y conmigo, que quemo más.', lose: 'Me has templado el carácter.', post: 'En FRAGUA forjamos hasta los rayos. Bueno, los rayos no. Las rejas.' }) }),
  npc({ x: 24, y: 13, style: 'apagon', dir: 3, sight: 4, beaten: G.flags.reclR6, talk: n => trainerTalk(n, { id: 'reclR6', name: 'NICO', cls: 'RECLUTA APAGÓN', party: [['cuadron', 35], ['bateron', 35]], pre: 'Me han mandado a medir el calor de la lava. ¿Para qué? Para venderlo, claro.', lose: '¡Me he quemado!', post: 'El jefe dice que con seis fusibles se abre la Fábrica. Y que tú se los vas a dar. ¿Es verdad?' }) }),
  npc({ x: 31, y: 9, style: 'veraneante', dir: 2, sight: 3, beaten: G.flags.geoR6, talk: n => trainerTalk(n, { id: 'geoR6', name: 'NOEMÍ', cls: 'GEÓLOGA', party: [['tornillon', 34], ['mecherin', 34], ['planchon', 36]], pre: 'Estoy estudiando las rocas. Y las rocas me dicen que pierdes.', lose: 'Las rocas mienten.', post: 'Esta lava lleva caliente desde la Tormenta Madre. Como si algo la calentara desde abajo.' }) }),
  !G.flags.itemR6 && npc({ x: 34, y: 16, item: 1, talk: async n => { n.gone = true; G.flags.itemR6 = 1; give('lubricante', 2); await got('¡Has encontrado 2 LUBRICANTES!'); } }),
];
NPCS.fragua = () => [
  !G.flags.rival4 && npc({ x: 7, y: 9, style: 'cobre', dir: 2, sight: 6, forced: 'rival4', talk: n => rivalTalk(n, 4) }),
  npc({ x: 15, y: 11, style: 'chatarrero', dir: 2, talk: () => talk('En FRAGUA no se apaga nada. Ni las forjas, ni las discusiones.', 'CANDIL lleva cuarenta años en la GRAN FORJA. Dice que cuando gane alguien, por fin se tomará vacaciones.') }),
  npc({ x: 21, y: 15, style: 'nina', dir: 0, talk: () => talk('Mi abuelo forjó la verja de la GRAN FÁBRICA. Dice que tiene seis cerraduras y ninguna llave.') }),
];
NPCS.forja = () => [
  npc({ x: 9, y: 10, style: 'leo', dir: 2, sight: 3, beaten: G.flags.herCandil1, talk: n => trainerTalk(n, { id: 'herCandil1', name: 'LUCAS', cls: 'APRENDIZ', type: 'BRASA', party: [['mecherin', 36], ['planchita', 36]], pre: '¡Llevo un año aprendiendo a forjar! Y diez minutos a pelear.', lose: 'Se nota, ¿verdad?', post: 'La oficiala de arriba controla la reja. Tiene muy mal genio. Y muy buen pulso.' }) }),
  npc({ x: 3, y: 7, style: 'vecina', dir: 3, sight: 4, beaten: G.flags.herCandil2, talk: n => trainerTalk(n, { id: 'herCandil2', name: 'CHARO', cls: 'OFICIALA', type: 'BRASA', party: [['sopleton', 37], ['planchon', 37]], pre: 'Aquí se trabaja a mil grados. Si te quemas, te aguantas.', lose: 'Me has dejado fría.', post: 'CANDIL lleva un ALTOHORNO que nunca se apaga. Ni para dormir.' }) }),
  !G.fusibles.includes('BRASA') && npc({ x: 6, y: 2, style: 'candil', dir: 0, talk: n => leaderTalk(n, 'BRASA') }),
  G.fusibles.includes('BRASA') && npc({ x: 6, y: 2, style: 'candil', dir: 0, talk: () => G.flags.fin ? leaderRematch('BRASA') : talk('CANDIL: La reja del norte está abierta. La RUTA 7 sube a las TERMAS NIEBLA.', 'CANDIL: Allí manda BRUMA. Ojo, que pelea en albornoz y aun así da miedo.') }),
];
NPCS.herreria = () => [npc({ x: 5, y: 2, style: 'chatarrero', dir: 0, noTurn: 1, talk: () => talk('HERRERO: Forjo de todo menos excusas.') })];
NPCS.casaFragua = () => [npc({ x: 5, y: 3, style: 'vecina', dir: 2, talk: async () => { if (G.flags.regFragua) return talk('Que te dure el fuego.'); G.flags.regFragua = 1; const m = makeMon('planchita', 30); G.seen.planchita = G.got.planchita = 1; if (G.party.length < 6) G.party.push(m); else G.box.push(m); await talk('Esta PLANCHITA se ha cansado de mis camisas. Quiere aventuras.'); sfx.cry(SPECIES.planchita.cry); await got('¡Te llevas a PLANCHITA!'); } })];
NPCS.casaYunque = () => [npc({ x: 5, y: 3, style: 'abuelo', dir: 2, talk: () => talk('Yo forjé la verja de la GRAN FÁBRICA. Seis cerraduras, una por Central.', 'Los fundadores dijeron: «Que solo entre quien haya convencido a todo el valle». Y eso hicimos.') })];
NPCS.ruta7 = () => [
  npc({ x: 6, y: 25, style: 'veraneante', dir: 1, sight: 3, beaten: G.flags.banR7, talk: n => trainerTalk(n, { id: 'banR7', name: 'PILAR', cls: 'BAÑISTA', party: [['cafetin', 37], ['boyita', 37], ['grifin', 37]], pre: '¡Vengo de las termas, relajadísima! Bueno, ya no tanto.', lose: 'Necesito otro baño.', post: 'Las TERMAS llevan días frías. Dicen que alguien ha robado la VÁLVULA MADRE.' }) }),
  npc({ x: 16, y: 13, style: 'apagon', dir: 2, sight: 4, beaten: G.flags.reclR7, talk: n => trainerTalk(n, { id: 'reclR7', name: 'ELENA', cls: 'RECLUTA APAGÓN', party: [['fundin', 37], ['cuadron', 37], ['bateron', 38]], pre: 'Tengo orden de no dejar subir a nadie con más de cinco fusibles.', lose: '¿Cuántos llevas? Da igual. Pasa.', post: 'EL TASADOR está en la CALDERA MADRE. Le encanta el vapor. Dice que limpia la conciencia.' }) }),
  npc({ x: 13, y: 7, style: 'pescador', dir: 3, sight: 3, beaten: G.flags.pesR7, talk: n => trainerTalk(n, { id: 'pesR7', name: 'JULIO', cls: 'PESCADOR', party: [['balizon', 38], ['fontanon', 38]], pre: 'En estas pozas pican peces calientes. Y makinistas despistadas.', lose: 'Se me ha soltado.', post: 'Desde aquí arriba, en los días de niebla, se oye latir algo al norte.' }) }),
  !G.flags.itemR7 && npc({ x: 21, y: 30, item: 1, talk: async n => { n.gone = true; G.flags.itemR7 = 1; give('recarga', 2); await got('¡Has encontrado 2 RECARGAS!'); } }),
];
NPCS.termas = () => [
  npc({ x: 8, y: 12, style: 'abuelo', dir: 0, talk: () => talk(G.flags.valvula ? '¡Vuelve el vapor! Mis rodillas lo notan antes que yo.' : 'Llevo cincuenta años bañándome aquí todas las mañanas. Esta semana, en agua fría. Ay, mis rodillas.') }),
  npc({ x: 20, y: 12, style: 'veraneante', dir: 1, talk: () => talk('La CALDERA MADRE calienta todas las termas. Los de APAGÓN se han encerrado dentro con la válvula.', 'BRUMA, la del BALNEARIO, está que echa humo. Y eso, en ella, es literal.') }),
  G.fusibles.length >= 6 && !G.flags.seisFus && npc({ x: 13, y: 3, style: 'estano', dir: 0, talk: () => seisFusibles() }),
];
NPCS.balneario = () => [
  npc({ x: 9, y: 10, style: 'pescador', dir: 2, sight: 3, beaten: G.flags.banBruma1, talk: n => trainerTalk(n, { id: 'banBruma1', name: 'FERMÍN', cls: 'BAÑERO', type: 'VAPOR', party: [['cafetin', 39], ['boyita', 39]], pre: 'Prohibido correr por las instalaciones. Y ganarme.', lose: 'Me has empapado.', post: 'La masajista de arriba controla el vapor. Tiene unas manos…' }) }),
  npc({ x: 3, y: 7, style: 'vecina', dir: 3, sight: 4, beaten: G.flags.banBruma2, talk: n => trainerTalk(n, { id: 'banBruma2', name: 'SOLE', cls: 'MASAJISTA', type: 'VAPOR', party: [['cafeteron', 40], ['balizon', 40]], pre: 'Relaja los hombros. Así. Y ahora, ¡combate!', lose: 'Qué contractura me has hecho.', post: 'BRUMA usa a LOCOMOTÓN. Cuando silba, se paran los relojes.' }) }),
  !G.fusibles.includes('VAPOR') && npc({ x: 6, y: 2, style: 'bruma', dir: 0, talk: n => leaderTalk(n, 'VAPOR') }),
  G.fusibles.includes('VAPOR') && npc({ x: 6, y: 2, style: 'bruma', dir: 0, talk: () => G.flags.fin ? leaderRematch('VAPOR') : talk('BRUMA: Seis fusibles. El portón del norte ya te reconoce.', 'BRUMA: Al otro lado está el CAMINO DEL RAYO. Y al final, la GRAN FÁBRICA. Ve con calma… pero ve.') }),
];
NPCS.caldera = () => [
  npc({ x: 3, y: 5, style: 'apagon', dir: 3, sight: 4, beaten: G.flags.cal1, talk: n => trainerTalk(n, { id: 'cal1', name: 'HUGO', cls: 'RECLUTA APAGÓN', party: [['cuadron', 38], ['torreton', 38]], pre: 'Aquí dentro hace un calor de muerte. Así que date prisa en perder.', lose: 'Me he deshidratado.', post: 'El TASADOR está junto a la caldera grande. Con la válvula en el bolsillo.' }) }),
  npc({ x: 10, y: 7, style: 'apagon', dir: 2, sight: 3, beaten: G.flags.cal2, talk: n => trainerTalk(n, { id: 'cal2', name: 'RUTH', cls: 'RECLUTA APAGÓN', party: [['bateron', 38], ['gruiman', 39]], pre: '¡Alto! Esta caldera es propiedad de APAGÓN desde el martes.', lose: 'Desde el miércoles ya no.', post: 'Sin la válvula, el vapor de las termas va directo a nuestras botellas.' }) }),
  !G.flags.valvula && npc({ x: 7, y: 3, style: 'tasador', dir: 0, talk: n => tasador2(n) }),
];
NPCS.casaTermas = () => [npc({ x: 5, y: 3, style: 'vecina', dir: 2, talk: () => talk('La niebla de las termas sube hasta el CAMINO DEL RAYO. Dicen que allí arriba el aire hace cosquillas.') })];
NPCS.casaVapor = () => [npc({ x: 5, y: 3, style: 'abuelo', dir: 2, talk: async () => { if (G.flags.regTermas) return talk('Que el vapor te acompañe.'); G.flags.regTermas = 1; const m = makeMon('cafetin', 34); G.seen.cafetin = G.got.cafetin = 1; if (G.party.length < 6) G.party.push(m); else G.box.push(m); await talk('Este CAFETÍN me despierta cada mañana desde hace años. Ya es hora de que despierte a otra persona.'); sfx.cry(SPECIES.cafetin.cry); await got('¡Te llevas a CAFETÍN!'); } })];
async function tasador2(n) {
  await say('EL TASADOR: Tú otra vez. Te subí el precio la última vez y aun así me saliste cara.'); await say('EL TASADOR: Esta válvula vale más que tu pueblo entero. ¿La quieres? Gánatela.'); dlgOff();
  const res = await runBattle({ trainer: { name: 'TASADOR', cls: 'MANDO APAGÓN', tier: 'boss', style: 'tasador', items: 2, party: [makeMon('desguazor', 39), makeMon('gruiman', 39), makeMon('cuadron', 40), makeMon('bidongato', 41)], lose: '¡Bancarrota! ¡Bancarrota total!' } });
  if (res !== 'win') return;
  await say('EL TASADOR: Toma tu válvula. Total, el director ya no necesita vapor. Ahora lo que quiere es un rayo.'); dlgOff();
  await walk(n, 2); n.gone = true; sfx.door(); G.flags.valvula = 1; give('valvula', 1); await got('¡Recuperas la VÁLVULA MADRE!');
  for (let i = 0; i < 3; i++) { flash('#ffffff', .5); shake(2); sfx.spark(); await wait(10); } await talk('La caldera ruge. Por todas las termas vuelve a subir el vapor.'); saveGame();
}
async function seisFusibles() {
  const co = npc({ x: 12, y: 3, style: 'cobre', dir: 0 }); world.npcs.push(co);
  await say('ESTAÑO: ¡Seis fusibles! Lo sabía. Lo sabía desde que elegiste a tu primer Makinamon en mi taller.');
  await say('ESTAÑO: Escucha bien: el DIRECTOR OHMIO quiere que abras la Fábrica para robar el RAYO MADRE con su GRAN PILA.');
  await say('ESTAÑO: Pero la puerta no solo se abre con fusibles. Se abre con quien los lleva. Y tú no vas a dejarle pasar.');
  await say('COBRE: Y yo voy contigo. Bueno, detrás. Bueno, un poco detrás. ¡Vamos!');
  dlgOff(); G.flags.seisFus = 1; flash('#f8e070', .8); sfx.lock(); shake(3); world.refresh();
  await talk('Las seis ranuras del portón se iluminan una a una. El CAMINO DEL RAYO está abierto.'); world.load(G.map, world.pl.x, world.pl.y, world.pl.dir); saveGame();
}

// ── el final ──
NPCS.camino = () => [
  npc({ x: 5, y: 26, style: 'leo', dir: 3, sight: 4, beaten: G.flags.vet1, talk: n => trainerTalk(n, { id: 'vet1', name: 'GABRIEL', cls: 'VETERANO', party: [['campanon', 43], ['gruiman', 43], ['torreton', 44]], base: 40, pre: 'Hace treinta años yo también llegué hasta aquí. Me faltó un fusible. A ti no.', lose: 'Lo que yo decía: a ti no te falta nada.', post: 'Ese rayo de la Fábrica no es de nadie. Recuérdalo cuando lo tengas delante.' }) }),
  npc({ x: 18, y: 17, style: 'vecina', dir: 2, sight: 4, beaten: G.flags.vet2, talk: n => trainerTalk(n, { id: 'vet2', name: 'MERCEDES', cls: 'VETERANA', party: [['astrolabon', 43], ['invernadon', 43], ['desguazor', 44]], base: 40, pre: 'Seis fusibles y esa cara de susto. ¡Me encanta! Demuéstrame que los mereces.', lose: 'Los mereces. Y alguno más.', post: 'La tormenta de este camino no ha parado en cien años. Dicen que es el RAYO MADRE, que sueña.' }) }),
  npc({ x: 9, y: 9, style: 'apagon', dir: 0, sight: 3, beaten: G.flags.reclCam, talk: n => trainerTalk(n, { id: 'reclCam', name: 'BORJA', cls: 'RECLUTA APAGÓN', party: [['cuadron', 43], ['bateron', 43], ['gruiman', 44]], pre: '¡Último puesto de control! ¡Nadie pasa! Bueno, menos el director.', lose: 'Vale, tú también.', post: 'Arriba está LA PODADORA. Ha afilado las tijeras tres veces esta mañana.' }) }),
  !G.flags.podadora2 && npc({ x: 11, y: 3, style: 'podadora', dir: 0, sight: 3, forced: 'podadora2', talk: n => podadora2(n) }),
  !G.flags.itemCam && npc({ x: 21, y: 37, item: 1, talk: async n => { n.gone = true; G.flags.itemCam = 1; give('lubricante', 3); give('recarga', 2); await got('¡Has encontrado 3 LUBRICANTES y 2 RECARGAS!'); } }),
];
NPCS.fabrica = () => [
  npc({ x: 10, y: 21, style: 'estano', dir: 1, talk: () => talk(G.flags.fin ? 'ESTAÑO: Mira la Fábrica. Ya no echa humo negro. Echa chispas. Como debe ser.' : 'ESTAÑO: Usa el POSTE antes de entrar. Dentro no hay vuelta atrás… bueno, sí la hay, pero es muy larga.') }),
];
NPCS.fabrica1 = () => [
  npc({ x: 3, y: 9, style: 'apagon', dir: 3, sight: 4, lamp: 1, beaten: G.flags.fab1, talk: n => trainerTalk(n, { id: 'fab1', name: 'ROBERTO', cls: 'RECLUTA APAGÓN', party: [['torreton', 44], ['cuadron', 44], ['bateron', 45]], pre: 'Turno de noche en la Fábrica. Paga doble. Peligro triple.', lose: 'No me pagan lo suficiente.', post: 'La GRAN PILA ya está casi llena. El director solo espera a que se abra la puerta de arriba.' }) }),
  npc({ x: 14, y: 5, style: 'apagon', dir: 2, sight: 4, lamp: 1, beaten: G.flags.fab2, talk: n => trainerTalk(n, { id: 'fab2', name: 'IRENE', cls: 'RECLUTA APAGÓN', party: [['gruiman', 45], ['desguazor', 45]], pre: 'Me han dicho que eres una niña. No me han dicho que fueras tan pesada.', lose: 'Y tan fuerte. Eso tampoco.', post: 'La jefa CONTADORA está junto al ascensor. Dice que esta vez las cuentas le salen.' }) }),
  !G.flags.contadora3 && npc({ x: 8, y: 2, style: 'contadora', dir: 0, lamp: 1, talk: n => contadora3(n) }),
];
NPCS.camara = () => [
  !G.flags.ohmioFin && npc({ x: 7, y: 9, style: 'ohmio', dir: 0, talk: n => ohmioFinal(n) }),
];
async function podadora2(n) {
  await say('LA PODADORA: Mira quién viene por el camino. La mala hierba con gorra.'); await say('LA PODADORA: Esta vez no corto plantas. Corto caminos. Y el tuyo se acaba aquí.'); dlgOff();
  const res = await runBattle({ trainer: { name: 'PODADORA', cls: 'MANDO APAGÓN', tier: 'boss', style: 'podadora', items: 2, base: 40, party: [makeMon('sopleton', 44), makeMon('desguazor', 44), makeMon('planchon', 45), makeMon('asperson', 46)], lose: '¡Me has dejado sin filo! Otra vez.' } });
  if (res !== 'win') return; await say('LA PODADORA: Pasa. El director te espera en la CÁMARA DEL RAYO. Y yo me voy a jubilar. A un huerto. Sin bombas.');
  dlgOff(); await walk(n, 3); await walk(n, 3); n.gone = true; G.flags.podadora2 = 1; saveGame();
}
async function contadora3(n) {
  await say('CONTADORA: Tres generadores, una torre y ahora la Fábrica. Te has convertido en mi peor partida de gastos.'); await say('CONTADORA: Último arqueo. Si gano, me quedo con tus fusibles. Si ganas, me retiro a contar ovejas.'); dlgOff();
  const res = await runBattle({ trainer: { name: 'CONTADORA', cls: 'MANDO APAGÓN', tier: 'boss', style: 'contadora', items: 2, base: 40, party: [makeMon('cuadron', 45), makeMon('torreton', 46), makeMon('gruiman', 46), makeMon('kilovato', 48)], lose: 'Cuentas cerradas. En números rojos.' } });
  if (res !== 'win') return; await say('CONTADORA: Sube. Pero que conste en acta: yo te avisé de que esto iba a salir caro.');
  dlgOff(); await walk(n, 2); n.gone = true; G.flags.contadora3 = 1; saveGame();
}
async function ohmioFinal(n) {
  music('');
  await say('OHMIO: Puntual. Me gusta. ¿Ves eso que brilla ahí arriba? Es el RAYO MADRE. Cien años regalando energía a tostadoras.');
  await say('OHMIO: Y esto de aquí es mi GRAN PILA. Con tus seis fusibles abiertos, la Fábrica por fin me deja enchufarla al rayo.');
  await say('OHMIO: Cuando esté llena, ningún cacharro del valle volverá a moverse sin pagar. Lo llamo «modelo de suscripción».');
  await say('OHMIO: Ah, ¿que has venido a impedirlo? Qué bonito. Te voy a dar un precio especial: TODO.'); dlgOff();
  const res = await runBattle({ trainer: { name: 'OHMIO', cls: 'DIRECTOR', tier: 'final', style: 'ohmio', items: 3, base: 50, party: [makeMon('kilovato', 47), makeMon('gruiman', 47), makeMon('desguazor', 47), makeMon('cuadron', 48), makeMon('transformaton', 50)], lose: '¡No! ¡Esto no estaba en el plan de negocio!' } });
  if (res !== 'win') return;
  await say('OHMIO: Mi TRAFOTÓN… mi pila… ¡No! ¡Se está sobrecargando! ¡Le he quitado el rayo a todo el valle y no le cabe!');
  dlgOff(); for (let i = 0; i < 6; i++) { flash(i & 1 ? '#f8e070' : '#ffffff', .8); shake(4); sfx.crit(); await wait(8); }
  G.flags.pilaRota = 1; burst(7 * 16 + 8, 6 * 16, 50, { c: ['#f8e070', '#fff', '#58b8f8'], v0: 1, v1: 5, kind: 'star', l0: 20, l1: 50 });
  await talk('¡La GRAN PILA revienta! Todo el Pulso que había robado sale disparado hacia el techo… y desde allí, hacia todo el valle.');
  await say('OHMIO: Mi inversión… Bah. Me voy a dedicar a vender paraguas. Con esta tormenta, me forraré.'); dlgOff();
  await walk(n, 0); await walk(n, 0); await walk(n, 0); n.gone = true; sfx.door(); G.flags.ohmioFin = 1;
  // Cobre: el último combate
  const co = npc({ x: 7, y: 12, style: 'cobre', dir: 1 }); world.npcs.push(co); await walkTo(co, 7, 10); world.pl.dir = 0;
  await say('COBRE: ¡Lo has hecho! El rayo vuelve a ser de todos. Y ahora… antes de que lo toques…');
  await say('COBRE: Quiero mi combate. El último. Desde el taller de mi abuela te estoy persiguiendo. Déjame alcanzarte una vez.'); dlgOff();
  const party = COBRE_FINAL(G.flags.rivalSp || 'hervi');
  const r2 = await runBattle({ trainer: { name: 'COBRE', cls: 'RIVAL', tier: 'final', style: 'cobre', items: 2, itemHeal: 60, base: 50, party, lose: 'Vale. Vale, vale, vale. Esta vez de verdad: vale.', noBlackout: true } });
  await say(r2 === 'win' ? 'COBRE: Lo sabía. Desde el primer día lo sabía. Eres la mejor makinista del valle.' : 'COBRE: ¡Te he ganado! …No me lo creo. Da igual: el rayo te ha elegido a ti, no a mí.');
  await say('COBRE: Mira arriba. Se está despertando.'); dlgOff(); co.dir = 1; music('');
  for (let i = 0; i < 3; i++) { flash('#ffffff', .6); sfx.thunder(); shake(3); await wait(14); }
  await fulgorBattle();
}
async function fulgorBattle() {
  await talk('El RAYO MADRE baja del techo. Tiene forma de pájaro, de chispa y de tormenta a la vez: es FULGOR.');
  for (const m of G.party) { m.hp = m.max; m.status = null; } flash('#fff8c0', .6); sfx.heal(); await talk('Su brillo recorre tus CELDAS. Tu equipo recupera todo el Pulso. Quiere verte a pleno rendimiento.');
  sfx.cry(SPECIES.fulgor.cry); G.seen.fulgor = 1;
  const res = await runBattle({ wild: makeMon('fulgor', 50), song: 'fulgor', noRun: true });
  if (res === 'lose') return;
  G.flags.fulgor = 1;
  if (res === 'caught') await talk('FULGOR se queda en tu CELDA. Ya no quiere esconderse en ninguna máquina: quiere ir contigo.');
  else await talk('FULGOR se deshace en mil chispas. Cada una vuela a una máquina del valle. El Pulso está a salvo.');
  await ending();
}
async function ending() {
  G.flags.fin = 1; saveGame(); music(''); await fade(1, 40);
  const mons = Object.keys(G.got), lines = [['MAKINAMON', '#f8e070'], ['VERSIÓN PULSO', '#58b8b0'], [''], [''], ['El Pulso vuelve', '#ffffff'], ['a ser de todos.', '#ffffff'], [''], ['', ''], ['IDEA Y DIRECCIÓN', '#a8d0f8'], ['NAHUEL GAVILÁN', '#ffffff'], [''], ['PROGRAMACIÓN, ARTE Y MÚSICA', '#a8d0f8'], ['hechos a mano, píxel a píxel,', '#ffffff'], ['con la ayuda de CLAUDE', '#ffffff'], [''],
    ['JEFES DE CENTRAL', '#a8d0f8'], ['VOLTA · HERRÍN · TALLO', '#ffffff'], ['PIRITA · CANDIL · BRUMA', '#ffffff'], [''], ['COMPAÑÍA APAGÓN', '#a8d0f8'], ['OHMIO · CONTADORA', '#ffffff'], ['TASADOR · PODADORA', '#ffffff'], [''], ['TU RIVAL', '#a8d0f8'], ['COBRE', '#ffffff'], [''], ['LA PROFESORA', '#a8d0f8'], ['ESTAÑO', '#ffffff'], [''],
    [`Acoplados: ${mons.length} de ${DEX.length}`, '#f8e070'], [`Pasos: ${G.steps}`, '#f8e070'], [''], [''], ['GRACIAS POR JUGAR', '#ffffff'], [''], ['FIN', '#f8e070']];
  const sc = { t: 0, y: H + 10, update() { this.t++; if (this.y > -lines.length * 12 + 64) this.y -= .32; }, draw() {
    g.fillStyle = '#0c0a1c'; g.fillRect(0, 0, W, H); for (const [x, y2, k] of storm.stars) { g.fillStyle = k ? '#58507c' : '#a8a0d0'; g.fillRect(x, (y2 * 2 + this.t * .1 * (k + 1)) % H, 1, 1); }
    lines.forEach(([tx, c], i) => { const yy = Math.round(this.y + i * 12); if (yy > -10 && yy < 110) txtC(tx, 80, yy, c || '#fff'); });
    g.fillStyle = '#16122c'; g.fillRect(0, 114, W, 30); g.fillStyle = '#2a2450'; g.fillRect(0, 114, W, 1);
    const show = mons.length ? mons : ['tostik']; const k = Math.floor(this.t / 90) % show.length, x = ((this.t % 90) / 90) * 220 - 30;
    drawMon(show[k], (this.t % 40) < 6 ? 'f1' : 'f0', x, 142, { sx: .5, sy: .5 });
  } };
  scene = sc; music('fin'); await fade(0, 30);
  await until(() => sc.y <= -lines.length * 12 + 64); await wait(120); await anyKey(); await fade(1, 40);
  // epílogo en Pueblo Bobina
  scene = world; world.load('pueblo', 13, 34, 1); G.respawn = { map: 'pueblo', x: 13, y: 38, dir: 1 }; await fade(0, 30);
  await talk('De vuelta en PUEBLO BOBINA. Las farolas zumban más contentas que nunca. Hasta la tostadora de casa canta.');
  await talk('ESTAÑO te espera en el TALLER, con un café y mil preguntas. Y COBRE ya está hablando de una «revancha de la revancha».', 'El valle es tuyo para recorrerlo. Y el Manual todavía tiene páginas en blanco.');
  saveGame();
}
MAPS.taller.dyn = (cx, cy) => { STARTERS.forEach((s, i) => { if (G.flags.starter !== s && G.flags.rivalSp !== s && G.flags.starter3 !== s) { const b = (frame + i * 20) % 90 < 6 ? 1 : 0; drawCelda(g, 51 + i * 16 - cx, 37 - b - cy, 3, TYPES[SPECIES[s].t].c); } }); };
const ENTER = {
  puerto: () => { if (G.flags.puertoVisto) return; G.flags.puertoVisto = 1; run(() => talk('Olor a sal y a herrumbre. En el muelle, un barco negro con franjas amarillas: EL APAGADO.')); },
  ciudad: () => { if (G.flags.ciudadVista) return; G.flags.ciudadVista = 1; run(llegadaCiudad); },
  central: () => { if (G.flags.luz || G.flags.centralVisto) return; G.flags.centralVisto = 1; run(() => talk('Está oscurísimo. Huele a aceite quemado y a goma.', 'Desde el fondo llega un zumbido… y alguien contando en voz baja.')); },
};
const forceTalk = (pred, flag) => (x, y) => { if (G.flags[flag] || !pred(x, y)) return false; const n = world.npcs.find(q => q.forced === flag && !q.gone); if (!n) return false; world.pl.dir = n.y < y ? 1 : n.x < x ? 2 : n.x > x ? 3 : 0; run(async () => { music(''); await emote(n, '!'); await n.talk(n); }); return true; };
const TRIGGERS = {
  fragua: forceTalk((x, y) => x >= 2 && x <= 6 && (y === 8 || y === 9), 'rival4'),
  camino: forceTalk((x, y) => y >= 4 && y <= 6 && (x === 11 || x === 12), 'podadora2'),
  ruta3: (x, y) => { if (G.flags.rival3 || y < 17 || y > 22) return false; const co = world.npcs.find(n => n.style === 'cobre' && !n.gone); if (!co) return false; co.dir = 1; world.pl.dir = 0; run(async () => { music(''); await emote(co, '!'); music('rival'); await co.talk(co); }); return true; },
  pueblo: (x, y) => {
    if (y === 28 && !G.flags.starter) {
      run(async () => { const a = world.npcs[0]; await emote(a, '!'); a.dir = 2; await say('¡Alto ahí! En la hierba alta viven Makinamon salvajes.'); await say('Sin uno propio no puedes pasar. La profesora ESTAÑO te espera en el TALLER: el edificio del engranaje.'); dlgOff(); await walk(world.pl, 0); });
      return true;
    }
  },
};
const sign = t => () => talk(t);
const INTER = {
  pueblo: {
    '6,4': sign('RUTA 1\n↑ CIUDAD DINAMO'), '6,23': sign('RUTA 1  ↓ PUEBLO BOBINA\nConsejo: la hierba alta esconde Makinamon.'), '12,36': sign('PUEBLO BOBINA\n«Aquí todo empieza enrollado.»'),
    '5,33': () => talk(G.flags.starter ? 'Tu casa. Huele a tostadas. Ya volverás: la Ruta 1 espera.' : 'Tu casa. Mamá ha dicho que no vuelvas sin un Makinamon.'),
    '5,38': () => talk('«Familia Arandela». No hay nadie.'),
    '13,37': () => poste(13, 37),
    '18,19': async () => { if (G.flags.chatarra) return talk('Chatarra. Algo dentro ronca.'); await say('Rebuscas entre la chatarra…'); G.flags.chatarra = 1; give('celda', 2); await got('¡Hay 2 CELDAS sin estrenar!'); },
    '10,2': sign('OBRAS EN LA CENTRAL\nDisculpen las molestias. Y los apagones.'),
  },
  taller: Object.fromEntries(STARTERS.map((s, i) => [(3 + i) + ',3', () => chooseStarter(i)])),
  ruta2: { '16,7': () => poste(16, 7), '4,8': sign('RUTA 2  ↑ CENTRAL DINAMO\n«Producimos la luz que usted no ve.»'), '12,33': sign('RUTA 2  ↓ PUEBLO BOBINA\nPrecaución: cables sueltos.'),
    '22,16': () => talk('Una torre de alta tensión. Los cables no zumban. Mal asunto.'), '22,28': () => talk('Una torre de alta tensión. Los cables no zumban. Mal asunto.') },
  ciudad: { '12,15': () => poste(12, 15), '16,10': sign('SUBESTACIÓN DINAMO\nJefa: VOLTA. «Aquí no se apaga nadie.»'), '13,14': sign('CIUDAD DINAMO\n«La ciudad que nunca se desenchufa.»') },
  ferreteria: { '4,3': () => shop(['celda', 'celdaplus', 'aceite', 'grasa', 'rearme', 'recarga']), '5,3': () => shop(['celda', 'celdaplus', 'aceite', 'grasa', 'rearme', 'recarga']), '6,3': () => shop(['celda', 'celdaplus', 'aceite', 'grasa', 'rearme', 'recarga']) },
  estacion: { '4,3': () => talk('JEFE DE ESTACIÓN: Billetes por la ventanilla. Aunque no haya trenes.'), '5,3': () => world.npcs[0] ? world.npcs[0].talk() : talk('JEFE DE ESTACIÓN: Billetes por la ventanilla. Aunque no haya trenes.'), '6,3': () => talk('JEFE DE ESTACIÓN: Billetes por la ventanilla. Aunque no haya trenes.') },
  ruta3: { '12,2': sign('RUTA 3  ↑ CIUDAD DINAMO\n↓ PUERTO ROÑA'), '13,36': sign('PUERTO ROÑA\n«Aquí hasta el óxido tiene salitre.»') },
  puerto: { '9,9': () => poste(9, 9), '10,3': sign('PUERTO ROÑA\nFerretería, lonja y astillero.'), '13,9': sign('ASTILLERO ROÑA\nCapitana: HERRÍN. «Lo que se oxida, se respeta.»') },
  lonja: Object.fromEntries([2, 3, 4, 5, 6, 7].map(x => [x + ',2', () => talk('Un mostrador de mármol. Huele a mar y a boya mojada.')])),
  ruta4: { '37,9': sign('RUTA 4  ← VILLA MUSGO\n→ PUERTO ROÑA'), '2,9': sign('RUTA 4  → PUERTO ROÑA') },
  villa: { '11,12': () => poste(11, 12), '12,9': sign('VILLA MUSGO\n«Aquí todo crece. Hasta las tuercas.»'), '24,12': sign('INVERNADERO MUSGO\nJardinero: TALLO.') },
  ruta5: { '2,9': sign('RUTA 5  → POBLADO IMANTA\nCuidado: piedras imantadas.') },
  poblado: { '8,9': () => poste(8, 9), '9,6': sign('POBLADO IMANTA\n«Aquí nadie pierde el norte.»'), '20,9': sign('→ FRAGUA') },
  ruta6: { '2,9': sign('RUTA 6  → FRAGUA\nNo pisar la lava. En serio.') },
  fragua: { '10,11': () => poste(10, 11), '12,10': sign('FRAGUA\n«Lo que no se forja, se funde.»'), '16,7': sign('GRAN FORJA\nMaestro: CANDIL.') },
  herreria: { '4,3': () => shop(['grasa', 'lubricante', 'rearme', 'recarga', 'celdaplus']), '5,3': () => shop(['grasa', 'lubricante', 'rearme', 'recarga', 'celdaplus']), '6,3': () => shop(['grasa', 'lubricante', 'rearme', 'recarga', 'celdaplus']) },
  ruta7: { '15,33': sign('RUTA 7  ↑ TERMAS NIEBLA') },
  fabrica: { '9,19': () => poste(9, 19) },
  camara: Object.fromEntries([[6, 6], [8, 6], [6, 7], [7, 7], [8, 7], [6, 8], [7, 8], [8, 8]].map(([x, y]) => [x + ',' + y, () => G.flags.ohmioFin && !G.flags.fulgor ? fulgorBattle() : G.flags.fin && !G.got.fulgor ? fulgorRematch() : talk(G.flags.pilaRota ? 'Los restos de la GRAN PILA. Ya no zumban.' : 'La GRAN PILA zumba como una nevera muy enfadada.')])),
  termas: { '10,13': () => poste(10, 13), '10,12': sign('TERMAS NIEBLA\n«Aquí hasta las tuercas se relajan.»'), '15,9': sign('BALNEARIO NIEBLA\nJefa: BRUMA.') },
  central: Object.fromEntries([0, 1, 2].flatMap(n => { const o = MAPS.central.objects[n + 1]; return [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dy]) => [(o.x + dx) + ',' + (o.y + dy), () => generador(n)]); })),
};
// el POSTE DE CARGA está en poste.js
async function generador(n) {
  if (G.flags.luz || G.flags['gen' + n]) return talk('El generador ronronea. Huele a motor caliente, que es como huele la felicidad aquí dentro.');
  if (!await ask('Un GENERADOR parado. Tiene una palanca roja.\n¿Rearmarlo?')) return;
  dlgOff(); const o = MAPS.central.objects[n + 1], cx = o.x * 16 + 16, cy = o.y * 16 + 14;
  sfx.bump(); shake(1); await wait(14); sfx.bump(); shake(1.5); await wait(10);
  for (let i = 0; i < 6; i++) { sfx.spark(); burst(cx + rnd(-10, 10), cy + rnd(-8, 4), 6, { w: 1, c: ['#f8e070', '#fff', '#58f890'], v0: .6, v1: 2, l0: 8, l1: 16 }); await wait(5 + i * 2); }
  G.flags['gen' + n] = 1; flash('#f8f0c0', .5); shake(2); sfx.statUp();
  const on = [0, 1, 2].filter(i => G.flags['gen' + i]).length;
  await talk(on < 3 ? `¡El generador arranca! (${on} de 3)` : '¡El tercer generador arranca! Las luces de emergencia se estabilizan.', ...(on === 3 ? ['Al fondo, alguien deja de contar.'] : []));
  saveGame();
}
async function contadora(n) {
  const on = [0, 1, 2].filter(i => G.flags['gen' + i]).length;
  if (on < 3) return talk('???: Siete mil cuatrocientos doce… siete mil cuatrocientos trece…', '???: ¿Quién anda ahí? No veo a quién cobrarle. Si quieres guerra, enciende los TRES GENERADORES.', '???: Y luego te paso la factura, claro.');
  await say('CONTADORA: Así que has sido tú quien ha encendido mis generadores. ¿Tienes idea de lo que cuesta eso?'); await say('CONTADORA: Soy la CONTADORA, jefa de lecturas de la Compañía APAGÓN. Y tú me debes mucho.'); dlgOff();
  const res = await runBattle({ trainer: { name: 'CONTADORA', cls: 'JEFA APAGÓN', tier: 'boss', items: 1, style: 'contadora', party: [makeMon('fundin', 9), makeMon('cablebra', 10), makeMon('kilovato', 11)], lose: '¡Imposible! ¡Mis números nunca fallan!' } });
  if (res !== 'win') return;
  await say('CONTADORA: Tch. Quédate con tu fusible. Esta Central gasta demasiado de todos modos.');
  await say('CONTADORA: La Compañía APAGÓN volverá. Siempre volvemos. A final de mes.'); dlgOff();
  const prev = curName; music(''); await walk(n, 3); n.gone = true; sfx.door();
  for (let i = 0; i < 3; i++) { flash('#ffffff', .6); shake(2); sfx.spark(); await wait(10); }
  G.flags.luz = 1; give('fusible', 1); music('ruta2');
  burst(world.pl.px + 8, world.pl.py, 30, { w: 1, c: ['#f8e070', '#fff'], v0: 1, v1: 3, kind: 'star' });
  await got(`¡${G.name} recupera el FUSIBLE MAYOR!`);
  await talk('La turbina arranca con un rugido. Por los cables de la Ruta 2 vuelve a correr el Pulso.');
  saveGame(); await endCard();
}
async function cobreSeVa(co) {
  const ob = world.npcs.find(n => n.style === 'obrero'); music('');
  await say('COBRE: Oye. El obrero dice que la Compañía APAGÓN se ha metido en la CENTRAL DINAMO.');
  await say('COBRE: Pues yo voy a sacarlos. ¡Paso!'); dlgOff();
  if (ob) { await emote(ob, '!'); await walk(ob, 2); ob.dir = 3; }
  await walk(co, 1, 2); await walk(co, 1, 2); co.gone = true; sfx.door();
  if (ob) { ob.dir = 0; await say('Ese chaval no ha mirado ni a los lados. En fin.'); await say('Pasa tú también. Así le vigilas.'); }
  G.flags.ruta2 = 1; dlgOff(); music('ruta'); saveGame();
}
async function estanoPost() {
  const n = Object.keys(G.got).length;
  if (n >= DEX.length) {
    await say(`ESTAÑO: ¡${G.name}! Trae acá ese MANUAL DE INSTRUCCIONES…`);
    await say('ESTAÑO: Cincuenta de cincuenta. ¡TODOS! Ni en sesenta años de taller había visto todas las páginas llenas.');
    await say('ESTAÑO: No solo has salvado el Pulso: has escuchado a cada máquina del valle. Toma esto, maestra makinista.');
    dlgOff(); G.flags.diploma = 1; await diplomaScreen(); saveGame(); return;
  }
  const tip = !G.flags.starter3 ? 'ESTAÑO: Por cierto, esa tercera CELDA del banco lleva todo el viaje mirando la puerta. Acércate a saludarla.'
    : !G.flags.cobreCria ? 'ESTAÑO: COBRE anda aquí fuera dando vueltas. Dice que tiene una revancha pendiente contigo… y una sorpresa.'
    : !G.got.fulgor ? 'ESTAÑO: Dicen que sobre los restos de la GRAN PILA, en la Cámara del Rayo, todavía saltan chispas doradas.'
    : 'ESTAÑO: Los seis JEFES DE CENTRAL han reforzado sus equipos y piden revancha. ¡Son ideales para entrenar y reforjar!';
  await talk(`ESTAÑO: ¡${G.name}! El café está recién hecho. A ver ese MANUAL… Llevas ${n} acoplados de ${DEX.length}.`, tip);
}
async function cobrePost() {
  if (!G.flags.cobrePostIntro) { G.flags.cobrePostIntro = 1; await say('COBRE: ¡Eh, campeona! Te prometí la «revancha de la revancha», ¿te acuerdas?'); }
  if (!await ask('COBRE: Llevo mi equipo a tope de Pulso.\n¿Echamos un combate?')) { dlgOff(); return talk('COBRE: ¡No tardes, que se me enfrían las celdas!'); }
  dlgOff(); const rsp = G.flags.rivalSp || 'hervi';
  const res = await runBattle({ trainer: { name: 'COBRE', cls: 'RIVAL', tier: 'final', style: 'cobre', items: 2, itemHeal: 999, base: 60, party: COBRE_POST(rsp), lose: '¡Ni con seis a tope! Eres increíble.', noBlackout: true } });
  for (const m of G.party) { m.hp = m.max; m.status = null; }
  if (res !== 'win') return talk('COBRE: ¡TOMA YA! ¡Una para mí! …Venga, ya te he recargado el equipo, pide la revancha cuando quieras.');
  if (!G.flags.cobreCria) {
    G.flags.cobreCria = 1;
    await say('COBRE: No hay manera de alcanzarte. Pero oye, ya no me da rabia. Bueno, solo un poquito.');
    await say('COBRE: Toma esto. Mi compañero tuvo una cría en el patio de mi abuela. Es igual de cabezota que él: se irá bien contigo.');
    const m = Object.assign(makeMon(rsp, 5), { afecto: 90 }), first = !G.got[rsp]; G.seen[rsp] = G.got[rsp] = 1;
    sfx.cry(SPECIES[rsp].cry); await got(`¡COBRE te confía a ${SPECIES[rsp].n}!`);
    if (G.party.length < 6) G.party.push(m); else { G.box.push(m); await say(`Tu equipo está lleno. ${SPECIES[rsp].n} te espera en el ALMACÉN del taller.`); }
    dlgOff(); if (first) await manualPage(rsp, { stamp: true }); saveGame(); return;
  }
  await talk('COBRE: ¡Qué combatazo! Mañana les ajusto los tornillos y repetimos.'); saveGame();
}
async function fulgorRematch() {
  if (!await ask('Entre los restos de la GRAN PILA saltan chispas doradas. FULGOR te observa desde lo alto.\n¿Llamarlo?')) { dlgOff(); return; }
  dlgOff(); for (const m of G.party) { m.hp = m.max; m.status = null; } flash('#fff8c0', .6); sfx.heal();
  sfx.cry(SPECIES.fulgor.cry); G.seen.fulgor = 1;
  const res = await runBattle({ wild: makeMon('fulgor', 50), song: 'fulgor', noRun: true });
  if (res === 'lose') return;
  if (res === 'caught') await talk('¡FULGOR se queda en tu CELDA! El RAYO MADRE ya tiene compañera de viaje.');
  else await talk('FULGOR vuelve a subir al techo entre mil chispas. Volverá cuando quieras intentarlo.');
  saveGame();
}
async function chooseStarter(i) {
  const sp = STARTERS[i], S2 = SPECIES[sp];
  if (G.flags.starter) {
    if (G.flags.starter === sp || G.flags.rivalSp === sp || G.flags.starter3 === sp) return talk('El hueco de una celda.');
    if (!G.flags.fin) return talk('Esta celda espera a su makinista.');
    const pv2 = { t: 0, draw() { this.t++; box(34, 4, 92, 74); const b = this.t % 60 < 8 ? 1 : 0; drawMon(sp, b ? 'f1' : 'f0', 80, 62 - b, {}); const ty = TYPES[S2.t]; g.fillStyle = ty.d; g.fillRect(52, 64, 56, 9); txtC(ty.n, 80, 65, '#fff'); } };
    ui.push(pv2); sfx.cry(S2.cry);
    await say(`ESTAÑO: Ese pequeño ${S2.n} lleva desde el primer día mirando la puerta cada vez que entraba alguien.`);
    await say('ESTAÑO: Después de todo lo que has hecho por el valle, creo que te estaba esperando a ti.');
    const ok2 = await ask(`¿Quieres acoger a ${S2.n}?`); ui.splice(ui.indexOf(pv2), 1);
    if (!ok2) { dlgOff(); return; }
    G.flags.starter3 = sp; const m = Object.assign(makeMon(sp, 5), { afecto: 100 }), first = !G.got[sp]; G.seen[sp] = G.got[sp] = 1;
    flash(); sfx.cry(S2.cry); burst(80, 60, 30, { c: [TYPES[S2.t].c, '#fff'], v0: 1, v1: 3, kind: 'star' });
    await got(`¡${G.name} acoge a ${S2.n}!`);
    if (G.party.length < 6) G.party.push(m); else { G.box.push(m); await say(`Tu equipo está lleno. ${S2.n} te espera en el ALMACÉN del taller.`); }
    dlgOff(); if (first) await manualPage(sp, { stamp: true }); saveGame(); return;
  }
  const pv = { t: 0, draw() { this.t++; box(34, 4, 92, 74); const b = this.t % 60 < 8 ? 1 : 0; drawMon(sp, b ? 'f1' : 'f0', 80, 62 - b, {}); const ty = TYPES[S2.t]; g.fillStyle = ty.d; g.fillRect(52, 64, 56, 9); txtC(ty.n, 80, 65, '#fff'); } };
  ui.push(pv); sfx.cry(S2.cry);
  await say(`${S2.n}, el ${S2.kind.replace('Mk.', 'Makinamon')}. ${S2.desc}`);
  const ok = await ask(`¿Te quedas con ${S2.n}?`); ui.splice(ui.indexOf(pv), 1);
  if (!ok) { dlgOff(); return; }
  G.flags.starter = sp; G.party.push(Object.assign(makeMon(sp, 5), { afecto: 100 })); G.seen[sp] = G.got[sp] = 1;
  flash(); sfx.cry(S2.cry); burst(80, 60, 30, { c: [TYPES[S2.t].c, '#fff'], v0: 1, v1: 3, kind: 'star' });
  await got(`¡${G.name} recibe a ${S2.n}!`);
  // llega el rival
  const prof = world.npcs[0], pl = world.pl; music(''); sfx.door(); dlgOff();
  const co = npc({ x: 4, y: 7, style: 'cobre', dir: 1 }); world.npcs.push(co);
  await say('???: ¡Abuela! ¡Que me quedo sin!'); dlgOff();
  const ri2 = (i + 1) % 3, rsp = STARTERS[ri2];
  await walkTo(co, 3 + ri2, 4); co.dir = 1; await wait(10);
  await say('COBRE: Soy COBRE, el nieto de la profesora. ¿Has cogido ese? Pues yo, este.');
  G.flags.rivalSp = rsp; sfx.cry(SPECIES[rsp].cry); flash(); await wait(20);
  co.dir = co.x < pl.x ? 3 : 2; pl.dir = co.dir ^ 1; await emote(co, '!');
  await say('COBRE: ¿A que el mío tiene más Pulso? ¡Vamos a comprobarlo!'); dlgOff();
  const res = await runBattle({ trainer: { name: 'COBRE', cls: 'RIVAL', tier: 'rival', style: 'cobre', party: [makeMon(rsp, 5)], lose: '¡¿Qué?! ¡Me he equivocado de celda!', noBlackout: true } });
  for (const m of G.party) { m.hp = m.max; m.status = null; }
  await say(res === 'win' ? 'COBRE: Ha sido suerte de principiante.' : 'COBRE: ¡Ja! Lo sabía. El Pulso no engaña.');
  prof.dir = 0; pl.dir = 3;
  await say('ESTAÑO: ¡COBRE, que eso es un taller, no un ring! En fin. Ya sois MAKINISTAS los dos.');
  await say('Un Makinamon no obedece a un botón: obedece a quien le da un sitio donde recargarse.');
  give('celda', 5); give('aceite', 2);
  await got(`¡${G.name} recibe 5 CELDAS y 2 botes de ACEITE!`);
  await say('Una CELDA es una pila vacía. Un Makinamon salvaje con el Pulso bajo busca refugio… y si se mete en la tuya, se ACOPLA contigo.');
  await say('Y esto es el MANUAL DE INSTRUCCIONES. Se rellena solo con cada Makinamon que acoples. Ábrelo con ENTER.');
  G.flags.rival1 = 1; co.dir = 0;
  await say('COBRE: Te espero al final de la RUTA 1. Y esta vez no me pillas frío.'); dlgOff();
  await walk(co, 0); await walkTo(co, 4, 7); co.gone = true; sfx.door(); music('pueblo'); saveGame();
}
async function trainerTalk(n, t) {
  if (n.beaten) return talk(t.post);
  await say(t.pre); dlgOff();
  const res = await runBattle({ trainer: { name: t.name, cls: t.cls, style: n.style, party: t.party.map(([s, l]) => makeMon(s, l)), lose: t.lose, tier: t.tier, items: t.items, itemHeal: t.itemHeal, env: t.env, type: t.type, base: t.base } });
  if (res !== 'win') return;
  n.beaten = true; G.flags[t.id] = 1; n.sight = 0; world.refresh();
  if (t.prize) await t.prize(); await say(t.post); dlgOff(); if (t.after) await t.after(); saveGame();
}
async function endCard() {
  await wait(20); const card = { a: 0, draw() { g.globalAlpha = this.a; g.fillStyle = '#101820'; g.fillRect(0, 0, W, H); txtC('CENTRAL DINAMO, ENCENDIDA', 80, 30, '#f8e070'); const got2 = Object.keys(G.got).length, mins = Math.floor((Date.now() - G.t0) / 60000);
    txtC(`Acoplados: ${got2} de ${DEX.length}`, 80, 50, '#f8f6e8'); txtC(`Pasos: ${G.steps}`, 80, 62, '#f8f6e8'); txtC(`Tiempo: ${mins} min`, 80, 74, '#f8f6e8'); txtC('Próxima parada:', 80, 102, '#58b8b0'); txtC('CIUDAD DINAMO', 80, 112, '#58b8b0'); txtC('FUSIBLE MAYOR recuperado', 80, 86, '#f8e070'); if ((frame >> 5) & 1) txtC('▼', 80, 126, '#f8f6e8'); g.globalAlpha = 1; } };
  ui.push(card); const f = jingle('reforja'); await tw(card, { a: 1 }, 30, 'lin'); await wait(f); dlg.arrow = true; await anyKey(); dlg.arrow = false; await tw(card, { a: 0 }, 20, 'lin'); ui.splice(ui.indexOf(card), 1); music(MAPS[G.map].area(world.pl.y)[1]);
}

async function llegadaCiudad() {
  for (let i = 0; i < 3; i++) { flash('#fff8c0', .5); sfx.spark(); await wait(10); }
  await talk('Las farolas de CIUDAD DINAMO parpadean… y se encienden todas a la vez.', 'Desde las ventanas, la gente aplaude. Algunos Makinamon silban.');
  const v = npc({ x: 6, y: 12, style: 'volta', dir: 2 }); world.npcs.push(v); music('');
  await walkTo(v, world.pl.x + 2, world.pl.y); v.dir = 2; world.pl.dir = 3; await emote(v, '!');
  await say('???: ¡Así que eres tú quien ha encendido la Central! Media ciudad lleva tres días cenando a oscuras.');
  await say('VOLTA: Soy VOLTA, jefa de la SUBESTACIÓN. Ven a verme cuando quieras. Tengo un FUSIBLE para quien me gane.');
  await say('VOLTA: Y tranquila, que no muerdo. Electrocuto, pero no muerdo.'); dlgOff();
  await walkTo(v, 14, 12); await walkTo(v, 14, 7); v.gone = true; music('ciudad');
}
