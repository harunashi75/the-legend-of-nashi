const { test } = require('node:test');
const {
  assert,
  path,
  source,
  PIXEL_PLACES_COUNT
} = require('./helpers/context.cjs');

test('Île unique : six biomes, un seul camp sûr, route continue et lieux accessibles',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 assert.equal(run('ZONES.map(z=>z.name).join()'),'Plaines verdoyantes,Forêt ancienne,Marais brumeux,Forêt automnale,Désert oublié,Forêt enchantée');
 // Un seul camp, une seule zone sûre, un seul marchand ; le héros y apparaît.
 assert.equal(run('villages.length'),1);assert.equal(run('villages[0].name'),'Camp de l’Aurore');
 assert.equal(run("npcs.filter(n=>n.type==='shop'&&!n.layer).length"),1);
 assert.equal(run("npcs.filter(n=>n.type==='shop'&&!n.layer).every(n=>isSafe(n.x/TS,n.y/TS))"),true);
 assert.equal(run('canWalk(CANAAN_SPAWN.x,CANAAN_SPAWN.y)&&isSafe(CANAAN_SPAWN.x/TS,CANAAN_SPAWN.y/TS)'),true);
 assert.equal(run('regionAt(villages[0].x,villages[0].y).name'),'Plaines verdoyantes');
 run('P.x=CANAAN_SPAWN.x;P.y=CANAAN_SPAWN.y');assert.equal(run('currentZoneName()'),'Camp de l’Aurore');
 // Tout est accessible à pied depuis le camp ; chaque lieu est dans son biome.
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_WORLD_AUDIT().unreachable)')),[]);
 assert.equal(run('instances.filter(d=>!d.under).every(d=>ZONES.indexOf(regionAt(d.x,d.y))===d.biome)'),true);
 assert.equal(run('instances.map(d=>d.biome).join()'),'0,1,1,2,3,3,4,4,5,5,6,7,8,9');
 assert.equal(run('WORLD_BOSSES.every(b=>ZONES.indexOf(regionAt(b.x,b.y))===b.biome&&!isSafe(b.x,b.y))'),true);
 assert.equal(run("npcs.filter(n=>n.type==='portal').every(n=>n.x===instances[n.instance].x*TS&&n.y===instances[n.instance].y*TS)"),true);
 // 65 coffres secrets distincts sur la terre ferme ; la Forêt ancienne en cache le plus.
 assert.equal(run("new Set(hiddenChestSpots.map(c=>c.x+','+c.y)).size"),65);
 assert.equal(run('hiddenChestSpots.every(c=>!SOLID.includes(overworld[c.y][c.x])&&!isSafe(c.x,c.y))'),true);
 const perBiome=JSON.parse(run('JSON.stringify(ZONES.map((z,i)=>hiddenChestSpots.filter(c=>ZONES.indexOf(regionAt(c.x,c.y))===i).length))'));
 assert.equal(Math.max(...perBiome),perBiome[1],perBiome.join());
 // La route relie le camp à chaque portail sans quitter les chemins et les ponts.
 const roads=run(`(()=>{const v=villages[0],seen=new Set(),q=[[v.x,v.y]];seen.add(v.y*MAPW+v.x);
  for(let h=0;h<q.length;h++){const [x,y]=q[h];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,k=yy*MAPW+xx;
   if(seen.has(k)||overworld[yy][xx]!==2)continue;seen.add(k);q.push([xx,yy])}}
  return instances.filter(d=>!d.under&&seen.has(d.y*MAPW+d.x)).length})()`);
 assert.equal(roads,10);
 // Crête : impossible de passer des Plaines à la Forêt enchantée sans traverser les autres biomes.
 const crossed=run(`(()=>{const v=villages[0],seen=new Uint8Array(MAPW*MAPH),q=[v.y*MAPW+v.x];seen[q[0]]=1;let e=0;
  for(let h=0;h<q.length;h++){const k=q[h],x=k%MAPW,y=(k-x)/MAPW;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,nk=yy*MAPW+xx;
   if(seen[nk]||SOLID.includes(overworld[yy][xx]))continue;const b=ZONES.indexOf(regionAt(xx,yy));if(b!==0&&b!==5)continue;seen[nk]=1;if(b===5)e++;q.push(nk)}}return e})()`);
 assert.equal(crossed,0);
 // Chaque biome a son sol et son décor propres.
 const has=(tile,deco,biome)=>run(`overworld.some((row,y)=>row.some((t,x)=>t===${tile}&&ZONES.indexOf(regionAt(x,y))===${biome}))&&overdecor.some((row,y)=>row.some((d,x)=>d==='${deco}'&&ZONES.indexOf(regionAt(x,y))===${biome}))`);
 assert.ok(has(1,'flower',0));assert.ok(has(5,'bigtree',1));assert.ok(has(15,'twisted',2));assert.ok(has(16,'autumn_red',3));
 assert.ok(has(10,'palm',4));assert.ok(has(3,'ruin',4));assert.ok(has(18,'glowtree',5));
 assert.ok(run('[...BRIDGE_TILES].some(k=>ZONES.indexOf(regionAt(k%MAPW,(k-k%MAPW)/MAPW))===2)'),'ponts du marais');
 assert.equal(run('SOLID.includes(15)'),false);assert.equal(run('SOLID.includes(18)'),true);
 assert.ok(run("['bigtree','twisted','lilypad','autumn_red','autumn_orange','autumn_gold','leafpile','dune','glowtree','magicplant','ruin'].every(k=>PIXEL_DECOR[k])"));
 // Génération reproductible : une seconde génération donne exactement la même île.
 const before=run('overworld.map(r=>r.join("")).join("|")+JSON.stringify(hiddenChestSpots)');
 run('newRegionWorld()');assert.equal(run('world.map(r=>r.join("")).join("|")+JSON.stringify(hiddenChestSpots)'),before);
});

test('Sylvaëlle, la cité elfique : palissade sans trou, porte au niveau 60, Grand Arbre, bénédiction, armurerie, atelier, zone sûre',async()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 // Plus de massif ni de crête de roche : la palissade (37) ceint la cité et sépare toujours Plaines et Forêt enchantée.
 assert.equal(run('SOLID.includes(37)'),true);
 assert.equal(run('(()=>{let n=0;for(let y=150;y<250;y++)for(let x=150;x<250;x++)if(overworld[y][x]===4)n++;return n})()'),0,'plus de roche au centre');
 assert.equal(run('canaanInCity(200,200)&&!canaanInCity(200,140)'),true);
 const reach=run('(()=>{const r=CANAAN_WORLD_TOOLS.reachableFrom(CANAAN_CAMP.x,CANAAN_CAMP.y),g=CANAAN_CITY_PLAN.gate;let inside=0;for(let y=150;y<250;y++)for(let x=150;x<250;x++)if(canaanInCity(x,y)&&r[y*MAPW+x])inside++;return JSON.stringify({out:r[g.out.y*MAPW+g.out.x],inside})})()');
 assert.deepEqual(JSON.parse(reach),{out:1,inside:0},'porte accessible dehors, cité fermée à pied');
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_WORLD_AUDIT().unreachable)')),[]);
 // Plan : porte au sud-ouest (côté Forêt enchantée, près du lac), Grand Arbre au nord-ouest, bâtiments elfiques.
 const plan=JSON.parse(run('JSON.stringify({deg:CANAAN_CITY_PLAN.gate.deg,tree:CANAAN_CITY_PLAN.tree,b:CANAAN_CITY_PLAN.buildings.map(b=>b.id),level:CANAAN_CITY_PLAN.level})'));
 assert.ok(plan.deg>100&&plan.deg<150,String(plan.deg));assert.ok(plan.tree.x<200&&plan.tree.y<200,'Grand Arbre au nord-ouest');
 assert.ok(['elfe_armurerie','elfe_couture','elfe_temple','elfe_tour','elfe_maison','elfe_taverne','elfe_palais'].every(id=>plan.b.includes(id)));assert.equal(plan.level,60);
 assert.equal(run('CANAAN_BUILDING_ART.has("elfe_tour")&&CANAAN_BUILDING_ART.has("elfe_couture")'),true);
 // Zone sûre (aucun monstre n'y apparaît), nom de zone.
 assert.equal(run('isSafe(200,205)'),true);run('P.x=200.5*TS;P.y=206*TS');assert.equal(run('currentZoneName()'),'Sylvaëlle, la Cité des Elfes');
 // Porte : le garde refuse sous le niveau 60, ouvre au niveau 60 ; on ressort par la même porte.
 const go=(p)=>run('P.x=(CANAAN_CITY_PLAN.gate.'+p+'.x+0.5)*TS;P.y=(CANAAN_CITY_PLAN.gate.'+p+'.y+0.5)*TS');
 run('started=true;game.hero.level=40');go('out');assert.equal(run('CANAAN_CITY.interact()'),true);assert.equal(run('canaanInCity(P.x/TS,P.y/TS)'),false,'trop jeune');
 run('game.hero.level=60');go('out');run('CANAAN_CITY.interact()');assert.equal(run('canaanInCity(P.x/TS,P.y/TS)'),true,'entré');
 run('CANAAN_CITY.interact()');assert.equal(run('canaanInCity(P.x/TS,P.y/TS)'),false,'ressorti');
 // Résurrection à la cité pour un héros de niveau 60 tombé dans la Forêt enchantée.
 go('out');assert.ok(run('!!CANAAN_CITY.respawnFor(game.hero)'));run('game.hero.level=30');assert.equal(run('CANAAN_CITY.respawnFor(game.hero)'),null);run('game.hero.level=60');
 // Grand Arbre : histoire et bénédiction quotidienne (+10 % de dégâts), une fois par jour.
 assert.ok(run('CANAAN_CITY.LORE.length')>=5);
 run('P.x=(CANAAN_CITY_PLAN.tree.x+0.5)*TS;P.y=(CANAAN_CITY_PLAN.tree.y+2)*TS;game.hero.blessing=null');
 assert.equal(run('CANAAN_CITY.handle(game.hero,{op:"city-bless"})'),true);assert.equal(run('CANAAN_CITY.blessMult(game.hero)'),1.1);
 assert.equal(run('CANAAN_CITY.handle(game.hero,{op:"city-bless"})'),false,'une fois par jour');
 assert.equal(JSON.parse(run('JSON.stringify(CANAAN_PERSISTENCE.heroSnapshot({x:0,y:0}).blessing)')).day.length,10,'gardée dans la sauvegarde');
 // Armurerie : la boutique commune (shop.js), chaque pièce visible et choisie, Rare ou Épique, de niveau 60.
 // Les marchands sont dans leur boutique (pièces de house.js) : Thalion derrière son comptoir, Elwyn à son métier.
 const near=id=>{const [rid,lx,ly]=id==='elfe_armurerie'?['sylv_armurerie',6.5,4.2]:['sylv_couture',4.5,5.6];run('{const r=CANAAN_ROOMS.find(r=>r.id==="'+rid+'");P.x=(r.x+'+lx+')*TS;P.y=(r.y+'+ly+')*TS}');};
 near('elfe_armurerie');run('P.gold=10000;game.hero.inventory=[]');
 assert.equal(run('CANAAN_CITY.nearArmorer(game.hero)&&nearMerchant()'),true,'Thalion achète aussi le butin');
 const view=JSON.parse(run('JSON.stringify(CANAAN_SHOP.view(game.hero))'));
 assert.equal(view.kind,'elfe');assert.equal(view.items.length,36,'(8 pièces + 10 armes) × 2 qualités');
 assert.deepEqual([...new Set(view.items.map(i=>i.rarity))],['Rare','Épique']);assert.deepEqual([...new Set(view.prices)],[2500,7500]);
 assert.ok(view.items.every(i=>i.level===60&&i.origin==='elfique'));
 const weapons=view.items.filter(i=>i.slot==='weapon'&&i.rarity==='Épique').map(i=>i.weaponType);
 assert.deepEqual(weapons,JSON.parse(run('JSON.stringify(CANAAN_GEAR_ENGINE.weaponTypes)')),'une arme de chaque famille');
 assert.ok(view.items.some(i=>i.slot==='artifact'));
 const bow=view.items.findIndex(i=>i.weaponType==='bow'&&i.rarity==='Épique'),id=view.items[bow].id;
 assert.equal(run('CANAAN_SHOP.handle(game.hero,{op:"shop-buy",index:'+bow+'})'),true);
 assert.deepEqual(JSON.parse(run('JSON.stringify(game.hero.inventory.map(i=>[i.id,i.slot,i.weaponType,i.rarity,i.level,i.origin]))')),[[id,'weapon','bow','Épique',60,'elfique']]);assert.equal(run('P.gold'),2500);
 assert.equal(run('CANAAN_SHOP.view(game.hero).items['+bow+'].weaponType'),'bow','remplacé par un autre arc');
 assert.equal(run('CANAAN_SHOP.handle(game.hero,{op:"shop-buy",index:'+bow+'})'),false,'pas assez d’or');
 // La fenêtre est celle du marchand du camp : marchandise à gauche, sac à vendre à droite.
 run('globalThis.__html="";showPanel=h=>{__html=h;document.getElementById("overlay").style.display="flex"};CANAAN_CITY.interact()');
 assert.match(run('__html'),/Thalion/);assert.match(run('__html'),/shop-columns/);assert.match(run('__html'),/data-action="shopBuy"/);assert.match(run('__html'),/Ton sac/);
 // Atelier : apparences elfiques exclusives (jamais tirées au butin).
 assert.equal(run('SKINS.filter(s=>s.shop).length'),4);assert.equal(run('(()=>{for(let i=0;i<400;i++){const id=CANAAN_WARDROBE.roll("secretBoss",()=>Math.random()*0.18);if(id&&SKINS.find(s=>s.id===id).shop)return false}return true})()'),true);
 near('elfe_couture');run('P.gold=5000;game.hero.skins={owned:[]}');
 assert.equal(run('CANAAN_CITY.handle(game.hero,{op:"city-skin",id:"elfe_rodeur"})'),true);assert.equal(run('CANAAN_WARDROBE.has(game.hero,"elfe_rodeur")&&P.gold===2000'),true);
 // Réseau : les actions de la cité passent le filtre de l'hôte.
 const n=await import(require('node:url').pathToFileURL(path.join(__dirname,'..','src','canaan','shared','net','messages.js')).href);
 assert.equal(n.sanitizeAction({op:'city-buy',slot:'helm',rarity:'rare'}),null,'l’ancien achat de la cité passe par shop-buy');
 assert.deepEqual(n.sanitizeAction({op:'shop-buy',index:33}),{op:'shop-buy',index:33});
 assert.deepEqual(n.sanitizeAction({op:'city-gate'}),{op:'city-gate'});
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Monde au niveau des donjons : créatures détaillées, textures des biomes, entrées thématiques et ambiance',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 // Chaque créature des biomes reçoit une silhouette dédiée, plus variée que l'ancien jeu de sprites.
 const looks=JSON.parse(run("JSON.stringify(ZONES.flatMap(z=>z.mobs).map(t=>{const m={t,x:0,y:0,hp:1,mhp:1};drawCanaanActor(ctx,m);return [t,m.look]}))"));
 assert.ok(looks.every(([,l])=>l),JSON.stringify(looks));
 assert.ok(new Set(looks.map(([,l])=>l)).size>=19,JSON.stringify(looks));
 assert.deepEqual(Object.fromEntries(looks.filter(([t])=>['Slime','Loup','Sanglier','Ours','Scorpion','Minotaure','Bandit'].includes(t))),{Slime:'slime',Loup:'wolf',Sanglier:'boar',Ours:'bear',Scorpion:'scorpion',Minotaure:'minotaur',Bandit:'bandit'});
 // Une élite porte le nom de sa version d'élite.
 assert.equal(run("mobTitle({t:'Loup',elite:true})"),'Loup alpha');assert.equal(run("mobTitle({t:'Loup'})"),'Loup');
 // Boss mondiaux : apparence propre à chacun.
 run('monsters=[];worldBossTimers={};instanceState=null;spawnWorldBosses();monsters.forEach(m=>drawCanaanActor(ctx,m))');
 assert.equal(run("monsters.filter(m=>m.worldBoss).every(m=>m.look&&m.pal)"),true);
 assert.equal(run("monsters.find(m=>m.worldBossId==='chronos').look"),'horror');
 // Textures : une bande de quatre variantes pour chaque terrain de l'île.
 assert.equal(run('[0,1,2,3,4,5,10,11,15,16,17,18].every(t=>PIXEL_TERRAIN[t]&&PIXEL_TERRAIN[t].width===192)'),true);
 // Rendu d'une zone de l'île et des dix entrées sans erreur ; les arbres lumineux éclairent.
 run('resetCanaanLights();for(let y=0;y<400;y+=7)for(let x=0;x<400;x+=7)drawWorldTile(ctx,x,y,world[y][x],decor[y][x]);instances.forEach((d,i)=>drawDungeonEntrance(ctx,i,d.x*TS,d.y*TS))');
 // Ambiance : la Forêt enchantée est plus sombre que les Plaines.
 const amb=b=>JSON.parse(run('{const z=ZONES['+b+'];P.x=(z.x+0.5)*TS;P.y=(z.y+0.5)*TS;let a;for(let k=0;k<400;k++)a=worldAmbience();JSON.stringify(a)}'));
 const plains=amb(0),enchanted=amb(5);
 assert.ok(plains.dark<0.05&&enchanted.dark>0.5,JSON.stringify([plains,enchanted]));
 assert.equal(enchanted.particles,'sparks');
 run('drawCanaanLighting(ctx,worldAmbience());drawCanaanBossFrame(ctx)');
});

test('Animations des monstres, eau peu profonde, arbres et thème RPG des menus',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(g.CANAAN_READY,true);
 // Marche : le monstre se tourne vers sa direction ; attaque et coup reçu sont détectés depuis son état.
 run("globalThis.wolf={t:'Loup',x:500,y:500,hp:50,mhp:50,cd:0};drawCanaanActor(ctx,wolf);wolf.x-=3;drawCanaanActor(ctx,wolf)");
 assert.equal(run('wolf._face'),-1);assert.equal(run('wolf._walking'),true);
 run('wolf.cd=1.2;wolf.hp=40;drawCanaanActor(ctx,wolf)');
 assert.equal(run('wolf._atk===time&&wolf._hit===time'),true);
 // Le héros a une vitesse visible : son sprite s'oriente et marche.
 run("paused=false;P.dead=false;keys['d']=true;readInput();update();keys['d']=false");
 assert.ok(run('P.vx')>0);
 // Eau peu profonde : des ronds dans l'eau naissent sous les pas, jamais sur un pont.
 const spot=JSON.parse(run('{let s=null;for(let y=0;y<400&&!s;y++)for(let x=0;x<400;x++)if(world[y][x]===15&&!BRIDGE_TILES.has(y*MAPW+x)){s={x,y};break}JSON.stringify(s)}'));
 run('globalThis.walker={};drawWade(ctx,walker,'+(spot.x+0.5)+'*TS,'+(spot.y+0.5)+'*TS,40,true,1)');
 assert.equal(run('walker._rippleT===time'),true);
 run('globalThis.dry={};drawWade(ctx,dry,CANAAN_SPAWN.x,CANAAN_SPAWN.y,40,true,1);drawWaterRipples(ctx)');
 assert.equal(run('dry._rippleT'),undefined);
 // Arbres redessinés deux fois plus grands (pixels de 2) et thème RPG chargé en dernier.
 assert.equal(run("['tree','bigtree','pine','palm','twisted','autumn_red','glowtree'].every(k=>PIXEL_DECOR[k]&&PIXEL_DECOR[k].width===132)"),true);
 assert.equal(run("['rock','flower','bush','cactus'].every(k=>PIXEL_DECOR[k]&&PIXEL_DECOR[k].width===68)"),true);
 const styles=[...source.matchAll(/<style id="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(styles[styles.length-1],'canaan-rpg-theme');
 assert.match(source,/--rpg-serif:/);
 // Coffres cachés et coffre de boss : sprites dédiés, dessinés sans erreur.
 run('drawCanaanChest(ctx,100,100,false,1);drawCanaanChest(ctx,200,100,true,2);drawChests()');
});

test('Vie du monde : animaux de chaque biome qui se promènent et fuient, habitants qui parlent, marchand redessiné',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 run('started=true;paused=false;game.world.monsters=[];CANAAN_LIFE.update()');
 const zoneOf=`(a=>ZONES.indexOf(regionAt(a.hx/TS,a.hy/TS)))`;
 const kinds=JSON.parse(run('JSON.stringify(ZONES.map((z,i)=>[...new Set(CANAAN_LIFE.animals().filter(a=>a.kind!=="poule"&&!a.sp.coast&&!a.farm&&!a.pet&&!a.layer&&'+zoneOf+'(a)===i).map(a=>a.kind))].sort()))'));
 // Chaque biome a ses espèces, et seulement les siennes (les bêtes de la ferme du camp sont à part).
 assert.deepEqual(kinds,[['cerf','lapin','mouton','renard'],['cerf','ecureuil','faisan','lapin','renard'],['canard','grenouille','heron','tortue'],['cerf','ecureuil','faisan','herisson','renard'],['chameau','chevre','fennec','lezard'],['cerf','ecureuil','lapin']]);
 // Crabes : sur les plages tout autour de l'île, sur la terre ferme au bord de la mer, dans plusieurs biomes.
 assert.ok(run('CANAAN_LIFE.animals().filter(a=>a.kind==="crabe").length')>=30);
 assert.ok(run('CANAAN_LIFE.animals().filter(a=>a.kind==="crabe").every(a=>{const x=Math.floor(a.hx/TS),y=Math.floor(a.hy/TS);return canWalk(a.hx,a.hy)&&[[1,0],[-1,0],[0,1],[0,-1]].some(([u,v])=>game.world.overworld[y+v][x+u]===0)})'),'crabes au bord de la mer');
 assert.ok(run('CANAAN_LIFE.animals().filter(a=>a.kind==="tortue_mer").length')>=10,'tortues de mer sur les plages');
 assert.ok(run('new Set(CANAAN_LIFE.animals().filter(a=>a.kind==="crabe").map(a=>ZONES.indexOf(regionAt(a.hx/TS,a.hy/TS)))).size')>=4,'crabes tout autour de l’île');
 assert.ok(run('CANAAN_LIFE.animals().length')>350);assert.ok(run('CANAAN_LIFE.fliers().length')>150);
 assert.ok(run('CANAAN_LIFE.animals().filter(a=>a.opts.glow).every(a=>ZONES.indexOf(regionAt(a.hx/TS,a.hy/TS))===5)'),'cerfs et lapins lumineux de la Forêt enchantée');
 assert.ok(run('CANAAN_LIFE.animals().filter(a=>!a.layer).every(a=>canWalk(a.x,a.y))'),'tous sur un sol praticable');
 // Ils se promènent : près du héros, les bêtes bougent au fil du temps et restent près de chez elles.
 // (près d'un troupeau de moutons et de son voisinage)
 run('{const a=CANAAN_LIFE.animals().find(x=>x.kind==="mouton");P.x=a.hx+500;P.y=a.hy;camX=P.x-W/2;camY=P.y-H/2;globalThis.__deer=CANAAN_LIFE.animals().find(x=>x.kind==="cerf");globalThis.__start=CANAAN_LIFE.animals().map(x=>[x.x,x.y])}');
 for(let i=0;i<900;i++)run('time++;CANAAN_LIFE.update()');
 assert.ok(run('CANAAN_LIFE.animals().filter((x,i)=>Math.hypot(x.x-__start[i][0],x.y-__start[i][1])>4).length')>=2,'des animaux se sont déplacés');
 assert.ok(run('CANAAN_LIFE.animals().every(a=>Math.hypot(a.x-a.hx,a.y-a.hy)<(a.sp.roam+5)*TS)'),'chacun reste près de chez lui');
 // Un cerf détale quand le héros s'approche.
 run('__deer.wait=999;__deer.flee=0;P.x=__deer.x+60;P.y=__deer.y;camX=P.x-W/2;camY=P.y-H/2;globalThis.__d0=Math.hypot(P.x-__deer.x,P.y-__deer.y)');
 for(let i=0;i<40;i++)run('time++;CANAAN_LIFE.update()');
 assert.ok(run('Math.hypot(P.x-__deer.x,P.y-__deer.y)')>run('__d0')+20,'le cerf fuit');
 // Habitants : au camp et autour des refuges, ruines et tours ; une bulle quand on s'approche.
 assert.ok(run('CANAAN_LIFE.villagers().length')>=6+PIXEL_PLACES_COUNT(run));
 run('{const v=CANAAN_LIFE.villagers()[0];P.x=v.x+40;P.y=v.y;camX=P.x-W/2;camY=P.y-H/2;globalThis.__v=v}');
 run('time++;CANAAN_LIFE.update()');
 assert.equal(typeof run('__v.bubble&&__v.bubble.text'),'string');assert.ok(run('__v.lines.includes(__v.bubble.text)'));
 assert.ok(run('CANAAN_LIFE.villagers().every(v=>v.lines.length>=4&&v.name.length>1&&canWalk(v.x,v.y))'));
 // Marchand : nouveau dessin (chapeau, sac à dos), une image par village et par clignement.
 // Dessiné pour de vrai : un sprite par village et par clignement, gardé en cache d'une image à l'autre.
 run('{const imgs=[],c={drawImage:(i,...a)=>imgs.push([i,...a])};time=100;'+
  'for(const n of [{x:100,y:100,sprite:0},{x:100,y:100,sprite:0},{x:100,y:100,sprite:1}])drawCanaanMerchant(c,n);'+
  'time=160;drawCanaanMerchant(c,{x:100,y:100,sprite:0});'+
  'globalThis.__m={n:imgs.length,cache:imgs[0][0]===imgs[1][0],village:imgs[0][0]!==imgs[2][0],blink:imgs[3][0]!==imgs[0][0],at:imgs[0].slice(1,4)}}');
 assert.deepEqual(JSON.parse(run('JSON.stringify(__m)')),{n:4,cache:true,village:true,blink:true,at:[73,50,54]});
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Vie du camp : ferme, enclos, champs, verger, jardin, fontaine, ruisseau sous des ponts, sans monstres ni passage bloqué',()=>{
 const {run,errors}=require('./helpers/canaan-runtime.cjs')(source);
 assert.equal(errors.length,0,errors.join('\n'));
 // Tout le plan trouve sa place, autour des maisons, des lieux de quête et des coffres ; l'île reste entièrement accessible.
 const audit=JSON.parse(run('JSON.stringify(CANAAN_CAMP_LIFE.audit())'));
 assert.deepEqual(audit.missing,[]);
 for(const k of ['barn','silo','coop','pen','trough','hay','cart','field:wheat','field:veg','field:fruit','scarecrow','lantern','apple','crates','basket','logs','woodpile','chop','fountain','garden','bench','birdbath','arch','spring'])assert.ok(audit.kinds.includes(k),k);
 assert.ok(audit.stream>=40&&audit.pond>=10&&audit.flowers>=30,JSON.stringify(audit));
 assert.equal(run('JSON.stringify(CANAAN_WORLD_AUDIT().unreachable)'),'[]');
 const at=(dx,dy)=>`((CANAAN_CAMP.x+${dx}+.5)*TS),((CANAAN_CAMP.y+${dy}+.5)*TS)`;
 // Le ruisseau est de l'eau ; la route de l'ouest et l'allée du verger le franchissent sur des ponts.
 assert.equal(run(`canWalk(${at(-18,-11)})`),false,'ruisseau');
 assert.ok(run('[...BRIDGE_TILES].filter(k=>{const x=k%MAPW,y=(k-x)/MAPW;return Math.abs(y-CANAAN_CAMP.y+2.5)<1.5&&Math.abs(x-CANAAN_CAMP.x+15.5)<2}).length')>=4,'pont de la route');
 assert.ok(run('[...BRIDGE_TILES].filter(k=>{const x=k%MAPW,y=(k-x)/MAPW;return Math.abs(y-CANAAN_CAMP.y-5.5)<1&&Math.abs(x-CANAAN_CAMP.x+16.5)<2.5}).length')>=4,'pont du verger');
 assert.equal(run(`canWalk(${at(-16,-3)})`),true,'on traverse le pont');
 // Les bâtiments, la fontaine et les clôtures bloquent ; les champs, la cour et la porte du jardin se traversent.
 for(const [dx,dy,name] of [[4,7,'grange'],[7,9,'silo'],[-2,8,'poulailler'],[0,0,'fontaine au centre'],[-5,-5,'forge'],[-12,10,'clôture de l’enclos'],[-7,-17,'clôture du jardin'],[-24,2,'pommier'],[-10,17,'épouvantail']])assert.equal(run(`canWalk(${at(dx,dy)})`),false,name);
 for(const [dx,dy,name] of [[-6,16,'champ de légumes'],[-12,18,'champ de blé'],[5,17,'champ de fruits'],[0,10,'allée de la ferme'],[-6,-14,'porte du jardin'],[-3,-16,'allée du jardin'],[-2,-4,'herbe près de la forge'],[-4,-2,'allée de la forge']])assert.equal(run(`canWalk(${at(dx,dy)})`),true,name);
 // Plus de vieille place pavée : la forge est à sa place, reliée au centre par une allée ; la fontaine au centre.
 assert.equal(run(`CANAAN_CAMP_LIFE.groundAt(CANAAN_CAMP.x-5,CANAAN_CAMP.y-3)`),null);
 assert.equal(run(`(()=>{const f=CANAAN_CAMP_LIFE.items().find(i=>i.kind==='fountain');return f.x===CANAAN_CAMP.x-1&&f.y===CANAAN_CAMP.y-1})()`),true);
 assert.equal(run(`(()=>{const f=CANAAN_CAMP_LIFE.items().find(i=>i.kind==='forge');return f.x===CANAAN_CAMP.x-6&&f.y===CANAAN_CAMP.y-5})()`),true);
 // En donjon, la carte de l'instance réutilise les mêmes coordonnées : rien de la ferme n'y bloque.
 assert.equal(run(`(()=>{const s=game.world.instance;game.world.instance={index:0};const r=canaanCampLife.blocked(${at(4,7)});game.world.instance=s;return r})()`),false);
 // Les bêtes de la ferme restent chez elles : l'enclos garde moutons, vaches et cochons ; les poules autour du poulailler.
 run('started=true;paused=false;game.world.monsters=[];CANAAN_LIFE.update()');
 const farm=JSON.parse(run('JSON.stringify(CANAAN_LIFE.animals().filter(a=>a.farm).map(a=>a.kind).sort())'));
 assert.deepEqual(farm,['cochon','cochon','mouton','mouton','mouton','poule','poule','poule','vache','vache']);
 run(`P.x=(CANAAN_CAMP.x-8.5)*TS;P.y=(CANAAN_CAMP.y+11.5)*TS;camX=P.x-W/2;camY=P.y-H/2`);
 for(let i=0;i<1500;i++)run('time++;CANAAN_LIFE.update()');
 assert.ok(run('CANAAN_LIFE.animals().filter(a=>a.farm&&a.kind!=="poule").every(a=>{const x=a.x/TS-CANAAN_CAMP.x,y=a.y/TS-CANAAN_CAMP.y;return x>-12&&x<-4&&y>8&&y<13})'),'les bêtes restent dans l’enclos');
 assert.ok(run('CANAAN_LIFE.animals().filter(a=>a.farm).some((a,i)=>Math.hypot(a.x-a.hx,a.y-a.hy)>4)'),'elles se promènent');
 assert.ok(run('CANAAN_LIFE.animals().filter(a=>a.farm).every(a=>canWalk(a.x,a.y))'));
 // Aucun monstre n'apparaît dans la ferme, le verger ni le jardin.
 run('game.world.monsters=[];spawnMonsters(200)');
 assert.equal(run('game.world.monsters.filter(m=>canaanCampLife.farm(Math.floor(m.x/TS),Math.floor(m.y/TS))).length'),0);
 // Le dessin du sol, des objets et des ponts tourne sans erreur au camp.
 run('P.x=(CANAAN_CAMP.x+.5)*TS;P.y=(CANAAN_CAMP.y+3.5)*TS;camX=P.x-W/2;camY=P.y-H/2;canaanCampLife.drawGround(ctx);canaanCampLife.draw(ctx);drawPixelRoads(ctx)');
 // Une île régénérée retrouve exactement la même ferme et le même ruisseau.
 const before=run('JSON.stringify([CANAAN_CAMP_LIFE.items(),BRIDGE_TILES.size])');
 run('newRegionWorld()');
 assert.equal(run('JSON.stringify([CANAAN_CAMP_LIFE.items(),BRIDGE_TILES.size])'),before);
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_CAMP_LIFE.audit().missing)')),[]);
 assert.equal(errors.length,0,errors.join('\n'));
});

test('Les Tréfonds : monde souterrain sous l’île, quatre biomes, forteresse naine, entrées, créatures à ton niveau, donjons sans niveau requis, sauvegarde et réseau',()=>{
 const {g,run,errors}=require('./helpers/canaan-runtime.cjs')(source);assert.equal(errors.length,0,errors.join('\n'));
 // Carte : tout est accessible depuis la forteresse ; quatre biomes, six entrées, quatre donjons et quatre boss.
 assert.deepEqual(JSON.parse(run('JSON.stringify(CANAAN_UNDER.audit().unreachable)')),[]);
 assert.equal(run('CANAAN_UNDER.BIOMES.map(b=>b.name).join()'),'Galeries d’Argile,Cité Engloutie de Khaz-Ombral,Nécropole des Oubliés,Fangeval, le Marais Fongique');
 assert.equal(run('CANAAN_UNDER.ENTRANCES.length'),6);assert.equal(run('instances.filter(d=>d.under&&d.scaled&&d.level===1).length'),4);
 assert.equal(run('CANAAN_UNDER.BOSSES.length'),4);assert.equal(run('MOB_TYPES.filter(t=>t.under!==undefined).length'),16);
 // Entrées : à la surface, sur la terre ferme accessible depuis le camp, et ouvertes juste dessous.
 assert.equal(run('{const T=CANAAN_WORLD_TOOLS,r=T.reachableFrom(villages[0].x,villages[0].y);CANAAN_UNDER.ENTRANCES.every(e=>r[e.y*MAPW+e.x]===1&&!SOLID.includes(game.world.overworld[e.y][e.x])&&!SOLID.includes(game.world.underworld[e.y][e.x]))}'),true);
 // Bâtiments abandonnés, cimetières, nains, gisements, bancs, faune et coffres.
 assert.ok(run('CANAAN_UNDER.structures().length')>=25);assert.ok(run('CANAAN_UNDER.dwarves().length')>=10);
 assert.ok(run('CANAAN_UNDER.nodes().length')>100);assert.ok(run('CANAAN_UNDER.spots().length')>10);assert.ok(run('CANAAN_UNDER.fauna().ground.length')>50);
 assert.equal(run('game.world.underdecor.flat().filter(d=>d==="tomb"||d==="cross").length>20&&game.world.underdecor.flat().includes("deadtree")'),true);
 // Descente : tout le groupe passe dans les Tréfonds ; créatures du biome au niveau du héros, boss mondiaux à son niveau.
 run('started=true;paused=false;game.hero.level=33;recomputeStats();P.hp=P.mhp;const e=CANAAN_UNDER.ENTRANCES[0];P.x=(e.x+.5)*TS;P.y=(e.y+1.5)*TS;interact()');
 assert.equal(run('game.world.layer'),'under');assert.equal(run('game.world.tiles===game.world.underworld'),true);assert.equal(run('canWalk(P.x,P.y)'),true);
 const mobs=JSON.parse(run('JSON.stringify(game.world.monsters.filter(m=>!m.worldBoss).map(m=>[MOB_TYPES.find(t=>t.name===m.t)?.under,m.level]))'));
 assert.ok(mobs.length>5&&mobs.every(([u,l])=>u!==undefined&&l>=32&&l<=34),JSON.stringify(mobs));
 assert.equal(run('game.world.monsters.filter(m=>m.worldBoss&&m.level===33&&m.worldBossId.startsWith("u_")).length'),4);
 assert.equal(run('CANAAN_UNDER.BIOMES.some(b=>b.name===currentZoneName())'),true);
 // Rien de la surface ici : ni ses gisements, ni ses animaux, ni ses coffres.
 assert.equal(run('CANAAN_GATHER.nodes().filter(n=>!n.layer).every(n=>!canaanHere(n))&&CANAAN_LIFE.animals().filter(a=>a.layer==="under").every(a=>canaanHere(a))&&canaanSecretChests()===CANAAN_UNDER.chests()'),true);
 // Forteresse de Durgrim : zone sûre, marchand et banquière nains, forge et âtre pour les métiers, nains qui parlent.
 run('{const f=CANAAN_UNDER.spawnPoint();P.x=f.x;P.y=f.y}');assert.equal(run('isSafe(P.x/TS,P.y/TS)&&currentZoneName()==="Forteresse de Durgrim"'),true);
 run('{const n=game.world.npcs.find(n=>n.type==="shop"&&n.dwarf);P.x=n.x;P.y=n.y+40}');assert.equal(run('nearMerchant()'),true);
 run('{const n=game.world.npcs.find(n=>n.type==="bank"&&n.dwarf);P.x=n.x;P.y=n.y+40}');assert.equal(run('CANAAN_BANK.nearBanker()'),true);
 run('{const f=CANAAN_GATHER.forgeSpot();P.x=f.x;P.y=f.y}');assert.equal(run('CANAAN_GATHER.nearForge(game.hero)'),true);
 run('{const d=game.world.npcs.find(n=>n.type==="dwarf"&&n.dwarf.role==="roi");P.x=d.x;P.y=d.y+40;closePanels();interact();globalThis.__king=d}');assert.match(run('__king.dwarf.bubble.text'),/Durgrim/);
 // Gisement des Tréfonds : minerai rare, qui se vend plus cher.
 const node=run('CANAAN_GATHER.nodes().findIndex(n=>n.layer==="under"&&n.kind==="ore"&&CANAAN_GATHER.ORES[n.id].rare)');assert.ok(node>=0);
 run('{const n=CANAAN_GATHER.nodes()['+node+'];P.x=n.x;P.y=n.y+30;game.hero.inventory=[];CANAAN_GATHER.gather(game.hero,'+node+')}');
 assert.ok(run('Object.keys(game.hero.prof.ore).some(k=>CANAAN_GATHER.ORES[k.split(":")[0]].rare)'));
 assert.ok(run('CANAAN_BAG.unitPrice({kind:"ore",id:"geode",q:0,n:1})')>run('CANAAN_BAG.unitPrice({kind:"ore",id:"fer",q:0,n:1})'));
 // Donjon des Tréfonds : aucun niveau requis, ennemis au niveau du groupe, butin du niveau du héros (Peu commun ou Rare).
 run('game.hero.level=17;recomputeStats()');const i=run('instances.findIndex(d=>d.under)');
 run('enterInstance('+i+')');assert.equal(run('game.world.instance.scaledLevel'),17);assert.equal(run('canaanMobLevel(game.world.monsters.find(m=>m.boss))'),18);
 const loot=new Set();for(let k=0;k<40;k++){run('game.hero.inventory=[];dropTierGear('+i+')');const it=run('game.hero.inventory[0]');assert.equal(it.level,17);loot.add(it.rarity)}
 assert.deepEqual([...loot].sort(),['Peu commun','Rare']);
 run('leaveInstance()');assert.equal(run('game.world.layer+":"+(game.world.tiles===game.world.underworld)'),'under:true');
 // Sauvegarde : on reprend dans les Tréfonds.
 run('{const f=CANAAN_UNDER.spawnPoint();P.x=f.x;P.y=f.y;saveGame()}');
 assert.equal(JSON.parse(run('localStorage.getItem("canaan_slot_"+CANAAN_PERSISTENCE.slot)')).monde.couche,'under');
 run('CANAAN_UNDER.setLayer("surface");CANAAN_PERSISTENCE.load()');assert.equal(run('game.world.layer'),'under');assert.equal(run('canWalk(P.x,P.y)'),true);
 // Réseau : l'hôte annonce la couche ; un invité bascule sur les Tréfonds générés à l'identique.
 assert.equal(run('CANAAN_NET.snapshot?CANAAN_NET.snapshot().map.layer:"under"'),'under');
 // Remontée : par n'importe quelle entrée, retour sur l'île.
 run('{const e=CANAAN_UNDER.ENTRANCES[3];P.x=(e.x+.5)*TS;P.y=(e.y+1.5)*TS;closePanels();interact()}');
 assert.equal(run('game.world.layer'),'surface');assert.equal(run('game.world.tiles===game.world.overworld&&canWalk(P.x,P.y)'),true);
 assert.equal(errors.length,0,errors.join('\n'));
});
