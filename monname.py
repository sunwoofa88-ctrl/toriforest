# -*- coding: utf-8 -*-
"""몬스터 한글 이름 → AI 그림 프롬프트용 영어 설명.
   148개 낱말을 전부 손으로 옮겼다 — 자동 번역에 맡기면 '반딧불이'가 'firefly light' 같은
   엉뚱한 말이 되어 그림이 달라진다."""
CREATURE = {
 '알파카':'alpaca','나비':'butterfly','햄스터':'hamster','여우':'fox','도롱뇽':'salamander',
 '새':'small bird','고슴도치':'hedgehog','두더지':'mole','달팽이':'snail','버섯':'walking mushroom creature',
 '두꺼비':'toad','박쥐':'bat','토끼':'rabbit','도마뱀':'lizard','올빼미':'owl',
 '반딧불이':'firefly bug','수달':'otter','생쥐':'mouse','오소리':'badger','판다':'panda',
 '곰':'bear','바다표범':'seal','다람쥐':'squirrel','거북':'turtle','젤리':'jelly slime blob',
 '너구리':'raccoon','펭귄':'penguin','고양이':'cat','벌레':'bug','부엉이':'horned owl',
 '왕':'crowned king creature','대장':'chieftain creature','대왕':'giant king creature',
 '두목':'boss creature','여왕':'queen creature','장군':'armored general creature',
}
WORD = {
 '갸웃':'head-tilting','거미줄':'spiderweb-patterned','거북':'turtle','거울':'mirror-shiny',
 '결정':'crystal','고깔':'cone-hat','고드름':'icicle','구름':'cloud','균사':'mycelium-threaded',
 '그믐':'dark-moon','기둥':'pillar','깃털':'feathery','까칠':'prickly','꼬물':'wriggly',
 '눈보라':'blizzard','눈송이':'snowflake','늪물':'swamp-water','달무리':'moon-halo','달빛':'moonlight',
 '대롱':'dangling','도토리':'acorn','도톰':'chubby','돌조각':'stone-chip','뒤뚱':'waddling',
 '들꽃':'wildflower','마그마':'magma','말랑':'squishy','먹구름':'storm-cloud','메아리':'echo',
 '모래바람':'sandstorm','모래알':'sand-grain','몽글':'fluffy','무지개':'rainbow','물방울':'water-droplet',
 '물보라':'sea-spray','물살':'current','물이끼':'water-moss','물풀':'water-weed','바스락':'rustling',
 '반딧불':'firefly-glow','반짝':'sparkling','밤안개':'night-mist','밤이슬':'night-dew','방긋':'smiling',
 '번개':'lightning','벼락':'thunderbolt','별빛':'starlight','보들':'soft-furred','보물':'treasure',
 '보석':'gemstone','부스스':'ruffled','북풍':'north-wind','불씨':'ember','뾰족':'spiky',
 '사뿐':'light-stepping','살랑':'breezy','새싹':'sprout','새침':'prim','샐쭉':'pouting',
 '서리':'frost','서리꽃':'frost-flower','석영':'quartz','선인장':'cactus','설원':'snowfield',
 '소복':'snow-piled','소용돌이':'whirlpool','솔방울':'pinecone','수렁':'bog','수정':'crystal',
 '수정고드름':'crystal-icicle','숯불':'charcoal-ember','신기루':'mirage','신전':'temple','심연':'abyss',
 '아장':'toddling','안개':'misty','얼음성':'ice-castle','영광':'glorious','오아시스':'oasis',
 '올록':'bumpy','우주':'cosmic','유령':'friendly-ghost','유리':'glass','유성':'meteor',
 '윤슬':'sun-glitter','이끼':'mossy','이끼꽃':'moss-flower','이슬':'dewdrop','자수정':'amethyst',
 '잿불':'smoldering','잿빛':'ashen','전설':'legendary','제단':'altar','조각':'shard',
 '조약돌':'pebble','쫑긋':'perky-eared','천둥':'thunder','촛불':'candlelight','태양':'sun',
 '토실':'plump','통통':'round-and-plump','포근':'cozy','폭포':'waterfall','폭풍':'storm',
 '폴짝':'hopping','풀잎':'grass-blade','협곡':'canyon','호박':'pumpkin','화산':'volcano',
 '화염':'flame','황금':'golden','흑요석':'obsidian','흙먼지':'dust',
}
BOSSWORD = {'왕':'king','대장':'chieftain','대왕':'great king','두목':'boss',
            '여왕':'queen','장군':'general'}
def describe(name):
    toks = name.split()
    boss = None
    if toks and toks[-1] in BOSSWORD:
        boss = BOSSWORD[toks[-1]]; toks = toks[:-1]
    crea = None
    for i in range(len(toks)-1, -1, -1):
        if toks[i] in CREATURE: crea = CREATURE[toks[i]]; toks = toks[:i]; break
    if crea is None: crea = 'forest creature'
    mods = [m for m in (WORD.get(t,'') for t in toks) if m]
    out = (' '.join(mods) + ' ' + crea).strip()
    if boss:
        out = 'a MUCH LARGER, grander ' + out + ' as the ' + boss + \
              ' - wearing a crown and a small cape, more ornate and imposing than the others'
    return out
if __name__=='__main__':
    import json,sys
    d=json.load(open('/tmp/species.json'))
    miss=set()
    for x in d['list']:
        for t in x['n'].split():
            if t not in WORD and t not in CREATURE: miss.add(t)
    print('미번역 낱말:', ' '.join(sorted(miss)) if miss else '없음')
    for x in d['list'][:12]:
        print('%-12s %-12s → %s'%(x['k'],x['n'],describe(x['n'])))


# 종류마다 '한눈에 구별되는 특징' — 이게 없으면 AI 가 전부 같은 동글이로 그린다(실제로 그랬다)
FEATURE = {
 '알파카':'a long fluffy neck, woolly curls and a tiny fringe over the eyes',
 '나비':'two large patterned wings spread wide and thin antennae',
 '햄스터':'round stuffed cheek pouches, tiny round ears and a stubby tail',
 '여우':'a narrow pointed snout, big triangular ears and a huge bushy tail',
 '도롱뇽':'a long low body, feathery external gills at the neck and a flat paddle tail',
 '새':'a small beak, folded wings at the sides and thin twig legs',
 '고슴도치':'a back covered in short spines and a tiny pointed nose',
 '두더지':'huge pink shovel claws, a pink pointed snout and tiny squinting eyes',
 '달팽이':'a big spiral shell on its back and two long eyestalks',
 '버섯':'a wide domed mushroom cap for a head and a thick pale stalk body',
 '두꺼비':'a wide flat mouth, bumpy warty skin and squat splayed legs',
 '박쥐':'large membrane wings folded like a cloak and big round ears',
 '토끼':'two very long upright ears and a round cotton tail',
 '도마뱀':'a long curling tail, a spiny back frill and clawed toes',
 '올빼미':'a flat round face disc, tufted brows and a small hooked beak',
 '반딧불이':'a glowing round tail lantern and small transparent wings',
 '수달':'a sleek body, small round ears, whiskers and a thick flat tail',
 '생쥐':'huge round ears, a pointed nose and a long thin tail',
 '오소리':'a broad striped face mask and short sturdy digging legs',
 '판다':'round black eye patches, round black ears and a chunky body',
 '곰':'a big rounded body, small round ears and heavy paws',
 '바다표범':'a smooth torpedo body, flippers instead of legs and whiskers',
 '다람쥐':'a very large curled bushy tail and tufted ear tips',
 '거북':'a domed patterned shell and a short neck poking out',
 '젤리':'a translucent wobbly blob body with no limbs and a soft highlight',
 '너구리':'a black bandit eye mask and a thick ringed striped tail',
 '펭귄':'an upright body, small flipper wings and an orange beak and feet',
 '고양이':'pointed ears, whiskers, a slim curved tail and slit pupils',
 '벌레':'a segmented caterpillar body with many tiny legs and antennae',
 '부엉이':'two tall feather horns, a round face and a hooked beak',
 '왕':'', '대장':'', '대왕':'', '두목':'', '여왕':'', '장군':'',
}
def feature(name):
    for t in reversed(name.split()):
        if t in FEATURE and FEATURE[t]: return FEATURE[t]
    return 'a clearly distinctive silhouette of its own'
