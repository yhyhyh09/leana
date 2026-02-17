import React, { useState, useEffect, useCallback } from 'react';
import { Ghost, Scroll, Shield, Brain, Heart, Package, Save, RotateCcw, Play } from 'lucide-react';

/**
 * [ 게임 설정 및 데이터 ]
 */
const GAME_TITLE = "악역 영애는 살아남고 싶어";
const VERSION = "2.0.0";

const INITIAL_STATE = {
  chapter: 'PROLOGUE',
  sceneIndex: 0,
  stats: {
    charm: 10,
    intel: 10,
    courage: 10,
    fame: 0
  },
  inventory: [],
  flags: {},
  affinity: {
    kael: 0,
    leon: 0
  },
  isGameOver: false,
};

// 캐릭터 데이터
const CHARACTERS = {
  LEANA: { name: "레아나", color: "#e882b4" },
  KAEL: { name: "카엘 공작", color: "#4a6fa5" },
  LEON: { name: "레온 경", color: "#c9956a" },
  SYSTEM: { name: "시스템", color: "#888" }
};

// 스토리 데이터 (예시 시나리오)
const SCENES = {
  PROLOGUE: [
    {
      speaker: "SYSTEM",
      text: "눈을 뜨니 화려한 천장이 보입니다. 이곳은 내가 어제 읽다 잠든 소설 속...",
      bg: "https://images.unsplash.com/photo-1513512147375-53474811be3e?auto=format&fit=crop&w=800",
    },
    {
      speaker: "SYSTEM",
      text: "곧 처형당할 운명인 악역 영애 '레아나'의 몸에 빙의했습니다.",
      choices: [
        { text: "거울을 본다 (매력+5)", acts: { stats: { charm: 5 }, next: true } },
        { text: "상황을 분석한다 (지성+5)", acts: { stats: { intel: 5 }, next: true } }
      ]
    },
    {
      speaker: "KAEL",
      text: "레아나, 아직도 정신이 안 드는 건가?",
      bg: "https://images.unsplash.com/photo-1599408162185-6706dd4469ef?auto=format&fit=crop&w=800",
      nextScene: 'CHAPTER_1'
    }
  ],
  CHAPTER_1: [
    {
      speaker: "SYSTEM",
      text: "차가운 목소리의 주인공은 소설의 남주인공이자 저의 정략결혼 상대, 카엘 공작입니다.",
      choices: [
        { 
          text: "공작의 손을 잡는다", 
          acts: { affinity: { kael: 10 }, next: true } 
        },
        { 
          text: "차갑게 외면한다", 
          acts: { stats: { courage: 10 }, next: true } 
        },
        {
          text: "그의 품에서 열쇠를 훔친다 (지성 15 이상)",
          condition: (s) => s.stats.intel >= 15,
          acts: { item: "공작가의 비밀 열쇠", next: true }
        }
      ]
    },
    {
      speaker: "KAEL",
      text: "...흥, 평소와는 좀 다르군. 나중에 다시 오지.",
      nextScene: 'BALLROOM'
    }
  ],
  BALLROOM: [
    {
      speaker: "SYSTEM",
      text: "화려한 무도회장입니다. 누군가 당신에게 독이 든 잔을 건네려 합니다.",
      // 아이템 보유 여부에 따른 분기 예시
      conditionChoice: (state) => state.inventory.includes("공작가의 비밀 열쇠"),
      choices: [
        { text: "잔을 마신다", acts: { isGameOver: true, text: "독살당했습니다." } },
        { 
          text: "비밀 열쇠로 문을 열고 도망친다", 
          condition: (s) => s.inventory.includes("공작가의 비밀 열쇠"),
          acts: { flags: { escaped: true }, stats: { fame: 20 }, next: true } 
        }
      ]
    }
  ]
};

/**
 * [ 메인 컴포넌트 ]
 */
export default function LeanaGame() {
  const [gameState, setGameState] = useState(null); // null이면 타이틀 화면
  const [showInventory, setShowInventory] = useState(false);
  const [toast, setToast] = useState("");

  // 세이브 기능
  const saveGame = useCallback((state) => {
    localStorage.setItem('LEANA_SAVE', JSON.stringify(state));
  }, []);

  // 로드 기능
  const loadGame = () => {
    const saved = localStorage.getItem('LEANA_SAVE');
    if (saved) {
      setGameState(JSON.parse(saved));
    } else {
      alert("저장된 데이터가 없습니다.");
    }
  };

  // 새 게임 시작
  const startNewGame = () => {
    setGameState(INITIAL_STATE);
  };

  // 토스트 알림
  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  // 선택지 클릭 처리
  const handleChoice = (choice) => {
    let nextState = { ...gameState };

    // 1. 스탯 변화
    if (choice.acts.stats) {
      Object.entries(choice.acts.stats).forEach(([k, v]) => {
        nextState.stats[k] += v;
      });
    }
    // 2. 호감도 변화
    if (choice.acts.affinity) {
      Object.entries(choice.acts.affinity).forEach(([k, v]) => {
        nextState.affinity[k] += v;
      });
    }
    // 3. 아이템 획득
    if (choice.acts.item) {
      if (!nextState.inventory.includes(choice.acts.item)) {
        nextState.inventory.push(choice.acts.item);
        notify(`아이템 획득: [${choice.acts.item}]`);
      }
    }
    // 4. 게임 오버 체크
    if (choice.acts.isGameOver) {
      nextState.isGameOver = true;
    }

    // 5. 장면 전환
    const currentSceneData = SCENES[nextState.chapter][nextState.sceneIndex];
    if (currentSceneData.nextScene) {
      nextState.chapter = currentSceneData.nextScene;
      nextState.sceneIndex = 0;
    } else {
      nextState.sceneIndex += 1;
    }

    setGameState(nextState);
    saveGame(nextState); // 자동 저장
  };

  // 다음 대사로 넘어가기 (선택지가 없을 때)
  const handleNext = () => {
    const scene = SCENES[gameState.chapter][gameState.sceneIndex];
    if (scene.choices) return; // 선택지가 있으면 클릭으로 못 넘어감

    let nextState = { ...gameState };
    if (scene.nextScene) {
      nextState.chapter = scene.nextScene;
      nextState.sceneIndex = 0;
    } else {
      nextState.sceneIndex += 1;
    }
    
    setGameState(nextState);
    saveGame(nextState);
  };

  // 타이틀 화면
  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a2e] text-white p-4">
        <h1 className="text-4xl font-serif mb-8 text-[#d4af37] text-center">{GAME_TITLE}</h1>
        <div className="space-y-4 w-64">
          <button onClick={startNewGame} className="w-full py-3 bg-[#c9956a] hover:bg-[#b07d52] transition rounded flex items-center justify-center gap-2">
            <Play size={18} /> 새 게임 시작
          </button>
          <button onClick={loadGame} className="w-full py-3 bg-[#4a6fa5] hover:bg-[#3a5a8a] transition rounded flex items-center justify-center gap-2">
            <RotateCcw size={18} /> 이어서 시작
          </button>
        </div>
        <p className="mt-8 text-xs text-gray-500">ver {VERSION} | Powered by Lena Engine</p>
      </div>
    );
  }

  const currentScene = SCENES[gameState.chapter][gameState.sceneIndex];

  // 게임 오버 화면
  if (gameState.isGameOver || !currentScene) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <h2 className="text-3xl font-serif mb-4 text-red-500">GAME OVER</h2>
        <p className="mb-8">{gameState.isGameOver ? "당신의 이야기는 여기서 끝났습니다." : "엔딩에 도달했습니다."}</p>
        <button onClick={() => setGameState(null)} className="px-6 py-2 border border-white hover:bg-white hover:text-black transition">
          타이틀로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="relative max-w-2xl mx-auto h-screen bg-gray-900 overflow-hidden font-sans flex flex-col">
      {/* 상단 스탯 바 */}
      <div className="absolute top-0 w-full bg-black/60 backdrop-blur-md p-3 flex justify-around text-[10px] text-white z-20 border-b border-white/10">
        <div className="flex items-center gap-1"><Heart size={12} className="text-pink-400" /> {gameState.stats.charm}</div>
        <div className="flex items-center gap-1"><Brain size={12} className="text-blue-400" /> {gameState.stats.intel}</div>
        <div className="flex items-center gap-1"><Shield size={12} className="text-orange-400" /> {gameState.stats.courage}</div>
        <button onClick={() => setShowInventory(!showInventory)} className="flex items-center gap-1 text-[#d4af37]">
          <Package size={14} /> 인벤토리
        </button>
      </div>

      {/* 배경 이미지 */}
      <div className="flex-1 relative">
        <img 
          src={currentScene.bg || "https://images.unsplash.com/photo-1519074063912-ad25b5ce4910?auto=format&fit=crop&w=800"} 
          alt="background" 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      {/* 대화창 영역 */}
      <div className="h-2/5 p-4 bg-[#1a1a2e] border-t-2 border-[#d4af37] relative z-10" onClick={!currentScene.choices ? handleNext : undefined}>
        {/* 이름표 */}
        <div className="absolute -top-6 left-6 px-4 py-1 bg-[#d4af37] text-black font-bold text-sm skew-x-12">
          <span className="-skew-x-12 block">{CHARACTERS[currentScene.speaker]?.name || "???"}</span>
        </div>

        {/* 대사 내용 */}
        <div className="mt-4 text-gray-200 leading-relaxed text-sm h-20 overflow-y-auto">
          {currentScene.text}
        </div>

        {/* 선택지 */}
        {currentScene.choices && (
          <div className="mt-4 space-y-2">
            {currentScene.choices.map((choice, idx) => {
              // 조건 확인
              const isLocked = choice.condition && !choice.condition(gameState);
              if (isLocked) return null; // 조건 안 맞으면 아예 안 보이게 하거나, 비활성화 처리 가능

              return (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); handleChoice(choice); }}
                  className="w-full p-2 bg-white/5 border border-white/20 hover:bg-[#d4af37]/20 hover:border-[#d4af37] transition text-left text-xs rounded"
                >
                  <span className="text-[#d4af37] mr-2">✦</span> {choice.text}
                </button>
              );
            })}
          </div>
        )}
        
        {!currentScene.choices && (
          <div className="absolute bottom-4 right-4 text-[10px] text-gray-500 animate-bounce">
            클릭하여 계속...
          </div>
        )}
      </div>

      {/* 인벤토리 팝업 */}
      {showInventory && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-[#2a2a40] border-2 border-[#d4af37] w-full max-w-xs rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[#d4af37] font-serif flex items-center gap-2"><Package size={18}/> 인벤토리</h3>
              <button onClick={() => setShowInventory(false)} className="text-white text-xl">&times;</button>
            </div>
            <div className="grid grid-cols-2 gap-2 h-40 overflow-y-auto">
              {gameState.inventory.length > 0 ? gameState.inventory.map((item, i) => (
                <div key={i} className="bg-white/10 p-2 text-[10px] text-white border border-white/10 rounded flex items-center gap-2">
                  <Scroll size={12} /> {item}
                </div>
              )) : (
                <div className="col-span-2 text-center text-gray-500 text-xs py-10">아이템이 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 알림 토스트 */}
      {toast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-[#d4af37] text-black px-4 py-2 rounded-full text-xs font-bold z-[60] shadow-lg animate-fade-in-up">
          {toast}
        </div>
      )}
    </div>
  );
}
