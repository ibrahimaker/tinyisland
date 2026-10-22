import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, ImageBackground, PanResponder, Pressable, SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

type Screen = 'menu' | 'island' | 'settings';
type TileType = 'grass' | 'coastTop' | 'coastBottom' | 'coastLeft' | 'coastRight';
type EditorTool = TileType | 'erase';

const COLS = 8;
const ROWS = 5;
const CELL = 68;
const EDITOR_WIDTH = 176;
const BOARD_W = COLS * CELL;
const BOARD_H = ROWS * CELL;

const menuArt = require('../assets/menu-coastal-farm.png');
const oceanTile = require('../assets/ocean-tile.png');
const waveOverlay = require('../assets/wave-overlay.png');
const grassTile = require('../assets/island-tile-grass-square.png');
const coastTile = require('../assets/island-tile-coast-square.png');
const treeOak = require('../assets/tree-oak.png');
const treePine = require('../assets/tree-pine.png');
const coastalRocks = require('../assets/rocks-coastal.png');

const tileMeta: Record<TileType, { label: string; rotation: string }> = {
  grass: { label: 'ÇİMEN', rotation: '0deg' },
  coastTop: { label: 'ÜST KIYI', rotation: '180deg' },
  coastBottom: { label: 'ALT KIYI', rotation: '0deg' },
  coastLeft: { label: 'SOL KIYI', rotation: '90deg' },
  coastRight: { label: 'SAĞ KIYI', rotation: '-90deg' },
};

function starterIsland(): Record<number, TileType> {
  const next: Record<number, TileType> = {};
  for (let column = 1; column <= 6; column += 1) {
    next[column] = 'coastTop';
    next[(ROWS - 1) * COLS + column] = 'coastBottom';
  }
  for (let row = 1; row <= 3; row += 1) {
    next[row * COLS] = 'coastLeft';
    next[row * COLS + 7] = 'coastRight';
    for (let column = 1; column <= 6; column += 1) next[row * COLS + column] = 'grass';
  }
  return next;
}

export default function HomeScreen() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [zoom, setZoom] = useState(0.98);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [editing, setEditing] = useState(false);
  const [tool, setTool] = useState<EditorTool>('grass');
  const [tiles, setTiles] = useState<Record<number, TileType>>(starterIsland);
  const viewport = useWindowDimensions();
  const cameraStart = useRef({ x: 0, y: 0 });
  const waveDrift = useRef(new Animated.Value(0)).current;
  const wavePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drift = Animated.loop(Animated.sequence([
      Animated.timing(waveDrift, { duration: 4400, easing: Easing.inOut(Easing.sin), toValue: 1, useNativeDriver: true }),
      Animated.timing(waveDrift, { duration: 4400, easing: Easing.inOut(Easing.sin), toValue: 0, useNativeDriver: true }),
    ]));
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(wavePulse, { duration: 2800, toValue: 1, useNativeDriver: true }),
      Animated.timing(wavePulse, { duration: 2800, toValue: 0, useNativeDriver: true }),
    ]));
    drift.start(); pulse.start();
    return () => { drift.stop(); pulse.stop(); };
  }, [waveDrift, wavePulse]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => !editing && Math.abs(gesture.dx) + Math.abs(gesture.dy) > 4,
    onPanResponderGrant: () => { cameraStart.current = camera; },
    onPanResponderMove: (_, gesture) => setCamera({
      x: Math.max(-220, Math.min(220, cameraStart.current.x + gesture.dx)),
      y: Math.max(-130, Math.min(130, cameraStart.current.y + gesture.dy)),
    }),
  }), [camera, editing]);

  const placeTile = (index: number, chosen: EditorTool = tool) => setTiles((current) => {
    const next = { ...current };
    if (chosen === 'erase') delete next[index]; else next[index] = chosen;
    return next;
  });

  const dropTile = (chosen: TileType, pageX: number, pageY: number) => {
    const originX = (viewport.width - EDITOR_WIDTH - BOARD_W) / 2;
    const originY = (viewport.height - BOARD_H) / 2;
    const column = Math.floor((pageX - originX) / CELL);
    const row = Math.floor((pageY - originY) / CELL);
    if (column >= 0 && column < COLS && row >= 0 && row < ROWS) placeTile(row * COLS + column, chosen);
  };

  const tileCount = Object.keys(tiles).length;

  if (screen === 'island') {
    return <SafeAreaView style={styles.app}>
      <ImageBackground source={oceanTile} resizeMode="cover" style={styles.islandScene} {...panResponder.panHandlers}>
        <Animated.View pointerEvents="none" style={[styles.waveLayer, styles.waveA, {
          opacity: wavePulse.interpolate({ inputRange: [0, 1], outputRange: [0.14, 0.30] }),
          transform: [{ translateX: waveDrift.interpolate({ inputRange: [0, 1], outputRange: [-42, 32] }) }],
        }]}><Image source={waveOverlay} resizeMode="stretch" style={styles.waveImage} /></Animated.View>
        <Animated.View pointerEvents="none" style={[styles.waveLayer, styles.waveB, {
          opacity: wavePulse.interpolate({ inputRange: [0, 1], outputRange: [0.27, 0.11] }),
          transform: [{ translateX: waveDrift.interpolate({ inputRange: [0, 1], outputRange: [35, -34] }) }, { scaleX: -1 }],
        }]}><Image source={waveOverlay} resizeMode="stretch" style={styles.waveImage} /></Animated.View>

        <View pointerEvents={editing ? 'auto' : 'none'} style={[styles.worldLayer, editing && { right: EDITOR_WIDTH }, !editing && { transform: [{ translateX: camera.x }, { translateY: camera.y }, { scale: zoom }] }]}>
          <View style={styles.tileBoard}>
            {Array.from({ length: ROWS * COLS }, (_, index) => {
              const type = tiles[index];
              return <Pressable key={index} onPress={() => editing && placeTile(index)} style={[styles.tileCell, editing && styles.tileCellEditing]}>
                {type ? <IslandTile type={type} /> : editing ? <View style={styles.emptyCell}><Text style={styles.emptyCellText}>+</Text></View> : null}
              </Pressable>;
            })}
            {!editing && <>
              <Image source={treeOak} resizeMode="contain" style={[styles.worldAsset, styles.treeOakA]} />
              <Image source={treeOak} resizeMode="contain" style={[styles.worldAsset, styles.treeOakB]} />
              <Image source={treePine} resizeMode="contain" style={[styles.worldAsset, styles.treePineA]} />
              <Image source={coastalRocks} resizeMode="contain" style={[styles.worldAsset, styles.rockA]} />
            </>}
          </View>
        </View>

        {!editing ? <GameHud setScreen={setScreen} zoom={zoom} setZoom={setZoom} onEdit={() => { setEditing(true); setCamera({ x: 0, y: 0 }); }} /> :
          <EditorPanel tool={tool} setTool={setTool} tileCount={tileCount} onDrop={dropTile} onReset={() => setTiles(starterIsland())} onDone={() => setEditing(false)} />}
      </ImageBackground>
      <StatusBar style="light" />
    </SafeAreaView>;
  }

  return <SafeAreaView style={styles.app}>
    <ImageBackground source={menuArt} resizeMode="cover" style={styles.menuScene}>
      <View style={styles.menuShade} />
      <View style={styles.logoLockup}><Text style={styles.logoTiny}>TINY</Text><Text style={styles.logoIsland}>ISLAND</Text><Text style={styles.logoTagline}>Küçük bir ada, büyük hayaller.</Text></View>
      <View style={styles.menuPanel}>{screen === 'settings' ? <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>AYARLAR</Text><Text style={styles.settingsCopy}>Ses, bildirimler ve dil seçenekleri yakında burada olacak.</Text>
        <MenuButton title="GERİ DÖN" color="blue" onPress={() => setScreen('menu')} />
      </View> : <><MenuButton title="OYUNA BAŞLA" color="green" onPress={() => setScreen('island')} /><MenuButton title="AYARLAR" color="gold" onPress={() => setScreen('settings')} /><MenuButton title="ÇIKIŞ" color="red" onPress={() => setScreen('menu')} /></>}</View>
    </ImageBackground>
    <StatusBar style="light" />
  </SafeAreaView>;
}

function GameHud({ setScreen, zoom, setZoom, onEdit }: { setScreen: (screen: Screen) => void; zoom: number; setZoom: (value: number) => void; onEdit: () => void }) {
  return <>
    <View pointerEvents="none" style={styles.topHud}><View style={styles.levelChip}><Text style={styles.levelText}>Lv. 1</Text></View><View style={styles.resources}><Resource label="ALTIN" value="1.250" tone="gold" /><Resource label="ELMAS" value="50" tone="blue" /></View></View>
    <View pointerEvents="none" style={styles.questCard}><View style={styles.questAvatar}><Text style={styles.questAvatarText}>M</Text></View><View><Text style={styles.questEyebrow}>GÜNLÜK GÖREV</Text><Text style={styles.questTitle}>Köyün için yer aç</Text><View style={styles.progressTrack}><View style={styles.progressFill} /></View></View></View>
    <View style={styles.leftRail}><HudButton label="HARİTA" /><HudButton label="GÖREV" /><HudButton label="ÇANTA" /></View>
    <View style={styles.cameraControls}><Pressable style={styles.zoomButton} onPress={() => setZoom(Math.min(1.35, zoom + 0.08))}><Text style={styles.zoomText}>+</Text></Pressable><Pressable style={styles.zoomButton} onPress={() => setZoom(Math.max(0.78, zoom - 0.08))}><Text style={styles.zoomText}>−</Text></Pressable></View>
    <Pressable style={styles.editButton} onPress={onEdit}><Text style={styles.editButtonText}>ADAYI DÜZENLE</Text></Pressable>
    <Pressable style={styles.backButton} onPress={() => setScreen('menu')}><Text style={styles.backText}>MENÜ</Text></Pressable>
    <View pointerEvents="none" style={styles.cameraHint}><Text style={styles.cameraHintText}>Sürükle: kamerayı hareket ettir</Text></View>
  </>;
}

function EditorPanel({ tool, setTool, tileCount, onDrop, onReset, onDone }: { tool: EditorTool; setTool: (tool: EditorTool) => void; tileCount: number; onDrop: (type: TileType, x: number, y: number) => void; onReset: () => void; onDone: () => void }) {
  return <View style={styles.editorPanel}>
    <Text style={styles.editorEyebrow}>ADMIN PANELİ</Text><Text style={styles.editorTitle}>ADA PARÇALARI</Text>
    <Text style={styles.editorHelp}>Parçayı sürükleyip kareye bırak veya seçip kareye dokun.</Text>
    <View style={styles.palette}>{(Object.keys(tileMeta) as TileType[]).map((type) => <DraggablePaletteTile key={type} type={type} selected={tool === type} onSelect={setTool} onDrop={onDrop} />)}</View>
    <Pressable style={[styles.eraser, tool === 'erase' && styles.paletteSelected]} onPress={() => setTool('erase')}><Text style={styles.eraserText}>SİLGİ</Text></Pressable>
    <View style={styles.editorStats}><Text style={styles.editorStatsValue}>{tileCount}</Text><Text style={styles.editorStatsLabel}>YERLEŞTİRİLEN PARÇA</Text></View>
    <View style={styles.editorActions}><Pressable style={styles.resetButton} onPress={onReset}><Text style={styles.resetText}>ÖRNEK ADA</Text></Pressable><Pressable style={styles.doneButton} onPress={onDone}><Text style={styles.doneText}>BİTİR</Text></Pressable></View>
  </View>;
}

function IslandTile({ type }: { type: TileType }) {
  const inwardOffset = type === 'coastTop' ? styles.coastTop : type === 'coastBottom' ? styles.coastBottom : type === 'coastLeft' ? styles.coastLeft : type === 'coastRight' ? styles.coastRight : null;
  return <Image source={type === 'grass' ? grassTile : coastTile} resizeMode="cover" style={[styles.tileImage, inwardOffset, type !== 'grass' && { transform: [{ rotate: tileMeta[type].rotation }] }]} />;
}

function DraggablePaletteTile({ type, selected, onSelect, onDrop }: { type: TileType; selected: boolean; onSelect: (type: TileType) => void; onDrop: (type: TileType, x: number, y: number) => void }) {
  const position = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > 3,
    onPanResponderGrant: (event) => {
      setDragging(true);
      onSelect(type);
    },
    onPanResponderMove: (event, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
    },
    onPanResponderRelease: (_, gesture) => {
      const releaseX = gesture.x0 + gesture.dx;
      const releaseY = gesture.y0 + gesture.dy;
      if (Math.abs(gesture.dx) + Math.abs(gesture.dy) < 5) onSelect(type); else onDrop(type, releaseX, releaseY);
      setDragging(false); Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    },
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
    onPanResponderTerminate: () => { setDragging(false); Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start(); },
  }), [onDrop, onSelect, position, type]);
  return <Animated.View {...responder.panHandlers} style={[styles.paletteTile, selected && styles.paletteSelected, dragging && styles.paletteDragging, { transform: position.getTranslateTransform() }]}><View style={styles.palettePreview}><IslandTile type={type} /></View><Text style={styles.paletteLabel}>{tileMeta[type].label}</Text></Animated.View>;
}

function MenuButton({ title, color, onPress }: { title: string; color: 'green' | 'gold' | 'red' | 'blue'; onPress: () => void }) {
  const background = color === 'green' ? styles.greenButton : color === 'gold' ? styles.goldButton : color === 'red' ? styles.redButton : styles.blueButton;
  return <Pressable style={[styles.menuButton, background]} onPress={onPress}><Text style={styles.menuButtonText}>{title}</Text></Pressable>;
}
function Resource({ label, value, tone }: { label: string; value: string; tone: 'gold' | 'blue' }) { return <View style={styles.resource}><View style={[styles.resourceMark, tone === 'gold' ? styles.goldMark : styles.blueMark]} /><View><Text style={styles.resourceLabel}>{label}</Text><Text style={styles.resourceValue}>{value}</Text></View></View>; }
function HudButton({ label }: { label: string }) { return <Pressable style={styles.hudButton}><Text style={styles.hudButtonText}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({
  app: { backgroundColor: '#071d2e', flex: 1 }, islandScene: { backgroundColor: '#159bd0', flex: 1, overflow: 'hidden' },
  waveLayer: { height: '47%', position: 'absolute', width: '116%' }, waveImage: { height: '100%', width: '100%' }, waveA: { left: '-8%', top: '2%' }, waveB: { bottom: '-3%', left: '-8%' },
  worldLayer: { alignItems: 'center', bottom: 0, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 0 },
  tileBoard: { flexDirection: 'row', flexWrap: 'wrap', height: BOARD_H, position: 'relative', width: BOARD_W }, tileCell: { height: CELL, overflow: 'visible', width: CELL }, tileCellEditing: { borderColor: 'rgba(226,255,246,0.2)', borderWidth: 1 }, tileImage: { height: '160%', left: '-30%', position: 'absolute', top: '-30%', width: '160%' }, coastTop: { top: '-12%' }, coastBottom: { top: '-48%' }, coastLeft: { left: '-12%' }, coastRight: { left: '-48%' },
  emptyCell: { alignItems: 'center', backgroundColor: 'rgba(8,83,112,0.16)', borderColor: 'rgba(218,255,245,0.42)', borderRadius: 9, borderStyle: 'dashed', borderWidth: 1, bottom: 4, justifyContent: 'center', left: 4, position: 'absolute', right: 4, top: 4 }, emptyCellText: { color: 'rgba(229,255,248,0.72)', fontSize: 20, fontWeight: '600' },
  worldAsset: { position: 'absolute' }, treeOakA: { height: 116, left: 156, top: 84, width: 112 }, treeOakB: { height: 92, right: 128, top: 126, width: 90 }, treePineA: { bottom: 72, height: 104, right: 226, width: 84 }, rockA: { bottom: 58, height: 64, left: 112, width: 94 },
  editorPanel: { backgroundColor: 'rgba(19,58,56,0.96)', borderLeftColor: '#8fceb5', borderLeftWidth: 2, bottom: 0, paddingHorizontal: 8, paddingVertical: 8, position: 'absolute', right: 0, top: 0, width: EDITOR_WIDTH }, editorEyebrow: { color: '#8fd7c0', fontSize: 7, fontWeight: '900', letterSpacing: 1.2 }, editorTitle: { color: '#fff4cf', fontSize: 14, fontWeight: '900', marginTop: 1 }, editorHelp: { color: '#c7e7dd', fontSize: 8, lineHeight: 11, marginBottom: 5, marginTop: 4 },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 }, paletteTile: { alignItems: 'center', backgroundColor: '#eef8df', borderColor: '#639979', borderRadius: 9, borderWidth: 2, height: 54, justifyContent: 'center', padding: 3, width: 70 }, paletteSelected: { borderColor: '#ffd75b', borderWidth: 3 }, paletteDragging: { elevation: 20, opacity: 0.9, zIndex: 100 }, palettePreview: { height: 31, overflow: 'hidden', position: 'relative', width: 52 }, paletteLabel: { color: '#245c46', fontSize: 6, fontWeight: '900', marginTop: 1 },
  eraser: { alignItems: 'center', backgroundColor: '#714d46', borderColor: '#d5aaa0', borderRadius: 8, borderWidth: 2, marginTop: 5, paddingVertical: 5 }, eraserText: { color: '#fff4ee', fontSize: 8, fontWeight: '900' }, editorStats: { alignItems: 'center', backgroundColor: 'rgba(4,29,31,0.42)', borderRadius: 9, flexDirection: 'row', gap: 6, marginTop: 5, padding: 5 }, editorStatsValue: { color: '#ffdd64', fontSize: 15, fontWeight: '900' }, editorStatsLabel: { color: '#d7eee6', flex: 1, fontSize: 6, fontWeight: '900' },
  editorActions: { bottom: 8, gap: 5, left: 8, position: 'absolute', right: 8 }, resetButton: { alignItems: 'center', borderColor: '#83b3a2', borderRadius: 9, borderWidth: 1, paddingVertical: 6 }, resetText: { color: '#d9eee7', fontSize: 8, fontWeight: '900' }, doneButton: { alignItems: 'center', backgroundColor: '#57b43d', borderColor: '#c9f693', borderRadius: 10, borderWidth: 2, paddingVertical: 7 }, doneText: { color: 'white', fontSize: 10, fontWeight: '900' },
  editButton: { backgroundColor: '#3d8e67', borderColor: '#d5f2ae', borderRadius: 16, borderWidth: 2, bottom: 22, paddingHorizontal: 15, paddingVertical: 10, position: 'absolute', right: 122 }, editButtonText: { color: '#fffceb', fontSize: 10, fontWeight: '900' }, backButton: { backgroundColor: '#6b4321', borderColor: '#f4ce8c', borderRadius: 18, borderWidth: 2, bottom: 22, left: 24, paddingHorizontal: 18, paddingVertical: 10, position: 'absolute' }, backText: { color: '#fff9e9', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  cameraControls: { bottom: 22, flexDirection: 'row', gap: 8, position: 'absolute', right: 24 }, cameraHint: { alignSelf: 'center', backgroundColor: 'rgba(9,39,48,0.72)', borderRadius: 12, bottom: 20, paddingHorizontal: 14, paddingVertical: 7, position: 'absolute' }, cameraHintText: { color: '#e8fff5', fontSize: 11, fontWeight: '700' }, zoomButton: { alignItems: 'center', backgroundColor: '#fdf0ca', borderColor: '#946430', borderRadius: 17, borderWidth: 2, height: 38, justifyContent: 'center', width: 38 }, zoomText: { color: '#6e4927', fontSize: 24, fontWeight: '900', lineHeight: 26 },
  leftRail: { gap: 8, left: 20, position: 'absolute', top: 104 }, hudButton: { alignItems: 'center', backgroundColor: '#ebfaf5', borderColor: '#7fbfb8', borderRadius: 14, borderWidth: 2, height: 54, justifyContent: 'center', width: 62 }, hudButtonText: { color: '#245a58', fontSize: 9, fontWeight: '900' }, topHud: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', left: 20, position: 'absolute', right: 20, top: 18 }, levelChip: { backgroundColor: '#295f36', borderColor: '#b5ef83', borderRadius: 18, borderWidth: 2, paddingHorizontal: 14, paddingVertical: 8 }, levelText: { color: 'white', fontSize: 14, fontWeight: '900' },
  resources: { flexDirection: 'row', gap: 8 }, resource: { alignItems: 'center', backgroundColor: 'rgba(12,48,64,0.86)', borderColor: 'rgba(255,255,255,0.32)', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 7, minWidth: 101, paddingHorizontal: 10, paddingVertical: 6 }, resourceLabel: { color: '#c8e7ee', fontSize: 8, fontWeight: '800' }, resourceMark: { borderColor: '#fff8d5', borderRadius: 10, borderWidth: 2, height: 20, width: 20 }, resourceValue: { color: '#fffdf6', fontSize: 17, fontWeight: '900' }, goldMark: { backgroundColor: '#ffcf3f' }, blueMark: { backgroundColor: '#4bc7ff' },
  questCard: { alignItems: 'center', backgroundColor: 'rgba(255,252,235,0.94)', borderColor: '#e6bc76', borderRadius: 18, borderWidth: 2, flexDirection: 'row', gap: 10, left: 92, paddingHorizontal: 12, paddingVertical: 9, position: 'absolute', top: 24 }, questAvatar: { alignItems: 'center', backgroundColor: '#f7bd64', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 }, questAvatarText: { color: '#824823', fontSize: 22, fontWeight: '900' }, questEyebrow: { color: '#a57b3d', fontSize: 9, fontWeight: '900' }, questTitle: { color: '#4c3b27', fontSize: 14, fontWeight: '800' }, progressTrack: { backgroundColor: '#c9d1b6', borderRadius: 4, height: 7, marginTop: 7, overflow: 'hidden', width: 145 }, progressFill: { backgroundColor: '#f7c94c', height: 7, width: '38%' },
  menuScene: { flex: 1, overflow: 'hidden' }, menuShade: { backgroundColor: 'rgba(5,44,61,0.12)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }, logoLockup: { left: 36, position: 'absolute', top: 28 }, logoTiny: { color: '#ffcf42', fontSize: 36, fontWeight: '900', lineHeight: 35, textShadowColor: '#9d3c0f', textShadowOffset: { height: 4, width: 0 }, textShadowRadius: 2 }, logoIsland: { color: '#fff6df', fontSize: 47, fontWeight: '900', lineHeight: 48, textShadowColor: '#5a2c12', textShadowOffset: { height: 4, width: 0 }, textShadowRadius: 2 }, logoTagline: { color: '#fff8df', fontSize: 13, fontWeight: '800', marginTop: 10 },
  menuPanel: { gap: 13, position: 'absolute', right: 34, top: '38%' }, menuButton: { alignItems: 'center', borderColor: '#fff3c8', borderRadius: 25, borderWidth: 3, justifyContent: 'center', minHeight: 58, width: 238 }, menuButtonText: { color: '#fffdf3', fontSize: 18, fontWeight: '900' }, greenButton: { backgroundColor: '#4baf29' }, goldButton: { backgroundColor: '#ee9d1c' }, redButton: { backgroundColor: '#cc4d3f' }, blueButton: { backgroundColor: '#2587d8' }, settingsCard: { alignItems: 'center', backgroundColor: 'rgba(31,77,88,0.95)', borderColor: '#fff2c4', borderRadius: 22, borderWidth: 2, padding: 20, width: 250 }, settingsCopy: { color: '#e5f6f1', fontSize: 13, lineHeight: 18, marginBottom: 16, textAlign: 'center' }, settingsTitle: { color: '#ffe06c', fontSize: 20, fontWeight: '900', marginBottom: 9 },
});
