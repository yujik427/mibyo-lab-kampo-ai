"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "assistant" | "error";
type Mode = "start" | "free" | "diagnosis";
type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  ts: number;
};

type DiagnosisOption = {
  value: string;
  label: string;
};

type DiagnosisQuestion = {
  id: string;
  question: string;
  options: DiagnosisOption[];
};

const LS_USER_ID = "kampo_user_id";
const LS_CONV_ID_FREE = "kampo_conversation_id_free";
const LS_CONV_ID_DIAG = "kampo_conversation_id_diag";
const LS_MESSAGES_FREE = "kampo_messages_free_v1";
const LS_MESSAGES_DIAG = "kampo_messages_diag_v1";
const LS_MODE = "kampo_mode_v1";
const LS_DIAG_ANSWERS = "kampo_diag_answers_v1";
const LS_DIAG_INDEX = "kampo_diag_index_v1";

// 体質診断質問（20問）
const DIAGNOSIS_QUESTIONS: DiagnosisQuestion[] = [
  {
    id: "q1",
    question: "普段の体調はどうですか？",
    options: [
      { value: "good", label: "元気で調子が良い" },
      { value: "normal", label: "普通" },
      { value: "tired", label: "疲れやすい" },
      { value: "weak", label: "体が弱い" },
    ],
  },
  {
    id: "q2",
    question: "冷え性の症状はありますか？",
    options: [
      { value: "severe", label: "かなり冷える" },
      { value: "moderate", label: "少し冷える" },
      { value: "mild", label: "たまに冷える" },
      { value: "none", label: "冷えは感じない" },
    ],
  },
  {
    id: "q3",
    question: "のぼせやほてりの症状はありますか？",
    options: [
      { value: "often", label: "よくある" },
      { value: "sometimes", label: "たまにある" },
      { value: "rare", label: "ほとんどない" },
      { value: "none", label: "全くない" },
    ],
  },
  {
    id: "q4",
    question: "汗のかき方はどうですか？",
    options: [
      { value: "much", label: "よく汗をかく" },
      { value: "normal", label: "普通" },
      { value: "little", label: "あまり汗をかかない" },
      { value: "none", label: "ほとんど汗をかかない" },
    ],
  },
  {
    id: "q5",
    question: "食欲はどうですか？",
    options: [
      { value: "good", label: "食欲旺盛" },
      { value: "normal", label: "普通" },
      { value: "poor", label: "食欲がない" },
      { value: "irregular", label: "食欲が不安定" },
    ],
  },
  {
    id: "q6",
    question: "便通はどうですか？",
    options: [
      { value: "regular", label: "毎日規則正しい" },
      { value: "constipation", label: "便秘気味" },
      { value: "diarrhea", label: "下痢気味" },
      { value: "irregular", label: "不規則" },
    ],
  },
  {
    id: "q7",
    question: "睡眠の質はどうですか？",
    options: [
      { value: "good", label: "よく眠れる" },
      { value: "normal", label: "普通" },
      { value: "poor", label: "眠りが浅い" },
      { value: "insomnia", label: "不眠気味" },
    ],
  },
  {
    id: "q8",
    question: "ストレスを感じることは多いですか？",
    options: [
      { value: "much", label: "よく感じる" },
      { value: "sometimes", label: "たまに感じる" },
      { value: "rare", label: "あまり感じない" },
      { value: "none", label: "ほとんど感じない" },
    ],
  },
  {
    id: "q9",
    question: "肩こりや首こりの症状はありますか？",
    options: [
      { value: "severe", label: "ひどい" },
      { value: "moderate", label: "ある" },
      { value: "mild", label: "たまにある" },
      { value: "none", label: "ない" },
    ],
  },
  {
    id: "q10",
    question: "頭痛の症状はありますか？",
    options: [
      { value: "often", label: "よくある" },
      { value: "sometimes", label: "たまにある" },
      { value: "rare", label: "ほとんどない" },
      { value: "none", label: "全くない" },
    ],
  },
  {
    id: "q11",
    question: "めまいや立ちくらみはありますか？",
    options: [
      { value: "often", label: "よくある" },
      { value: "sometimes", label: "たまにある" },
      { value: "rare", label: "ほとんどない" },
      { value: "none", label: "全くない" },
    ],
  },
  {
    id: "q12",
    question: "むくみの症状はありますか？",
    options: [
      { value: "often", label: "よくある" },
      { value: "sometimes", label: "たまにある" },
      { value: "rare", label: "ほとんどない" },
      { value: "none", label: "全くない" },
    ],
  },
  {
    id: "q13",
    question: "肌の状態はどうですか？",
    options: [
      { value: "good", label: "きれい" },
      { value: "dry", label: "乾燥気味" },
      { value: "oily", label: "脂っぽい" },
      { value: "rough", label: "荒れている" },
    ],
  },
  {
    id: "q14",
    question: "生理の状態はどうですか？（女性の場合）",
    options: [
      { value: "regular", label: "規則正しい" },
      { value: "irregular", label: "不規則" },
      { value: "painful", label: "痛みがある" },
      { value: "heavy", label: "量が多い" },
      { value: "na", label: "該当しない" },
    ],
  },
  {
    id: "q15",
    question: "口の渇きは感じますか？",
    options: [
      { value: "often", label: "よく感じる" },
      { value: "sometimes", label: "たまに感じる" },
      { value: "rare", label: "ほとんど感じない" },
      { value: "none", label: "全く感じない" },
    ],
  },
  {
    id: "q16",
    question: "のどの渇きは感じますか？",
    options: [
      { value: "often", label: "よく感じる" },
      { value: "sometimes", label: "たまに感じる" },
      { value: "rare", label: "ほとんど感じない" },
      { value: "none", label: "全く感じない" },
    ],
  },
  {
    id: "q17",
    question: "イライラしやすいですか？",
    options: [
      { value: "often", label: "よくイライラする" },
      { value: "sometimes", label: "たまにイライラする" },
      { value: "rare", label: "あまりイライラしない" },
      { value: "none", label: "ほとんどイライラしない" },
    ],
  },
  {
    id: "q18",
    question: "疲れやすさはどうですか？",
    options: [
      { value: "severe", label: "とても疲れやすい" },
      { value: "moderate", label: "疲れやすい" },
      { value: "mild", label: "少し疲れやすい" },
      { value: "none", label: "疲れにくい" },
    ],
  },
  {
    id: "q19",
    question: "運動はしますか？",
    options: [
      { value: "often", label: "よくする" },
      { value: "sometimes", label: "たまにする" },
      { value: "rare", label: "ほとんどしない" },
      { value: "none", label: "全くしない" },
    ],
  },
  {
    id: "q20",
    question: "食事のバランスはどうですか？",
    options: [
      { value: "good", label: "バランスが良い" },
      { value: "normal", label: "普通" },
      { value: "poor", label: "偏りがある" },
      { value: "irregular", label: "不規則" },
    ],
  },
];

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const [userId, setUserId] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [mode, setMode] = useState<Mode>("start");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [diagnosisAnswers, setDiagnosisAnswers] = useState<Record<string, string>>({});
  const [diagnosisIndex, setDiagnosisIndex] = useState(0);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // localStorage から各種データを読み込む（初回マウント時）
  useEffect(() => {
    if (typeof window === "undefined") return;

    // userId の取得または生成
    let storedUserId = localStorage.getItem(LS_USER_ID);
    if (!storedUserId) {
      storedUserId = makeId();
      localStorage.setItem(LS_USER_ID, storedUserId);
    }
    setUserId(storedUserId);

    // mode の取得
    const storedMode = localStorage.getItem(LS_MODE);
    if (storedMode === "free" || storedMode === "diagnosis") {
      setMode(storedMode);
    } else {
      setMode("start");
    }

    // diagnosisAnswers の取得
    try {
      const storedAnswers = localStorage.getItem(LS_DIAG_ANSWERS);
      if (storedAnswers) {
        const parsed = JSON.parse(storedAnswers);
        if (parsed && typeof parsed === "object") {
          setDiagnosisAnswers(parsed);
        }
      }
    } catch (err) {
      console.error("Failed to parse diagnosisAnswers from localStorage:", err);
    }

    // diagnosisIndex の取得
    try {
      const storedIndex = localStorage.getItem(LS_DIAG_INDEX);
      if (storedIndex) {
        const index = parseInt(storedIndex, 10);
        if (!isNaN(index) && index >= 0 && index < DIAGNOSIS_QUESTIONS.length) {
          setDiagnosisIndex(index);
        }
      }
    } catch (err) {
      console.error("Failed to parse diagnosisIndex from localStorage:", err);
    }
  }, []);

  // mode が変更されたときに、そのmode用のmessagesとconversation_idを読み込む
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mode === "start") {
      setMessages([]);
      setConversationId("");
      return;
    }

    // conversationId の取得（modeごと）
    const convKey = mode === "free" ? LS_CONV_ID_FREE : LS_CONV_ID_DIAG;
    const storedConversationId = localStorage.getItem(convKey) || "";
    setConversationId(storedConversationId);

    // messages の復元（modeごと）
    const messagesKey = mode === "free" ? LS_MESSAGES_FREE : LS_MESSAGES_DIAG;
    try {
      const storedMessages = localStorage.getItem(messagesKey);
      if (storedMessages) {
        const parsed = JSON.parse(storedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        } else if (mode === "free") {
          // freeモードでメッセージがない場合はデフォルトメッセージ
          setMessages([
            {
              id: makeId(),
              role: "assistant",
              content: "こんにちは。体調で気になることを教えてください。",
              ts: Date.now(),
            },
          ]);
        } else {
          setMessages([]);
        }
      } else if (mode === "free") {
        // freeモードでメッセージがない場合はデフォルトメッセージ
        setMessages([
          {
            id: makeId(),
            role: "assistant",
            content: "こんにちは。体調で気になることを教えてください。",
            ts: Date.now(),
          },
        ]);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to parse messages from localStorage:", err);
      if (mode === "free") {
        setMessages([
          {
            id: makeId(),
            role: "assistant",
            content: "こんにちは。体調で気になることを教えてください。",
            ts: Date.now(),
          },
        ]);
      } else {
        setMessages([]);
      }
    }
  }, [mode]);

  // mode が更新されるたびに localStorage に保存
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_MODE, mode);
  }, [mode]);

  // messages が更新されるたびに localStorage に保存（modeごと）
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mode === "start") return;
    if (messages.length === 0) return;

    try {
      const messagesKey = mode === "free" ? LS_MESSAGES_FREE : LS_MESSAGES_DIAG;
      localStorage.setItem(messagesKey, JSON.stringify(messages));
    } catch (err) {
      console.error("Failed to save messages to localStorage:", err);
    }
  }, [messages, mode]);

  // diagnosisAnswers が更新されるたびに localStorage に保存
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LS_DIAG_ANSWERS, JSON.stringify(diagnosisAnswers));
    } catch (err) {
      console.error("Failed to save diagnosisAnswers to localStorage:", err);
    }
  }, [diagnosisAnswers]);

  // diagnosisIndex が更新されるたびに localStorage に保存
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_DIAG_INDEX, diagnosisIndex.toString());
  }, [diagnosisIndex]);

  // 自動スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const canSend = useMemo(() => inputText.trim().length > 0 && !loading, [inputText, loading]);

  // モード選択
  const handleModeSelect = (selectedMode: "free" | "diagnosis") => {
    setMode(selectedMode);
    // mode変更時にuseEffectで自動的にmessagesとconversation_idが読み込まれる
  };

  // リセット機能（拡張）
  const handleReset = () => {
    if (typeof window === "undefined") return;
    if (!confirm("会話履歴をリセットしますか？")) return;

    // 両方のmessagesとconversation_idを削除
    localStorage.removeItem(LS_MESSAGES_FREE);
    localStorage.removeItem(LS_MESSAGES_DIAG);
    localStorage.removeItem(LS_CONV_ID_FREE);
    localStorage.removeItem(LS_CONV_ID_DIAG);
    localStorage.removeItem(LS_MODE);
    localStorage.removeItem(LS_DIAG_ANSWERS);
    localStorage.removeItem(LS_DIAG_INDEX);

    setConversationId("");
    setMode("start");
    setMessages([]);
    setDiagnosisAnswers({});
    setDiagnosisIndex(0);
  };

  // 診断質問への回答
  const handleDiagnosisAnswer = (questionId: string, answerValue: string, answerLabel: string) => {
    // 回答を保存
    const newAnswers = { ...diagnosisAnswers, [questionId]: answerLabel };
    setDiagnosisAnswers(newAnswers);

    // ユーザーメッセージとして追加
    setMessages((prev) => [
      ...prev,
      {
        id: makeId(),
        role: "user",
        content: answerLabel,
        ts: Date.now(),
      },
    ]);

    // 次の質問へ
    if (diagnosisIndex < DIAGNOSIS_QUESTIONS.length - 1) {
      setDiagnosisIndex(diagnosisIndex + 1);
    } else {
      // 最後の質問が終わったら完了
      setDiagnosisIndex(DIAGNOSIS_QUESTIONS.length);
    }
  };

  // 診断結果を生成
  const handleGenerateResult = async () => {
    if (loading) return;

    setLoading(true);

    // 回答をまとめたqueryを生成
    const answerList = Object.entries(diagnosisAnswers)
      .map(([qId, answer]) => {
        const question = DIAGNOSIS_QUESTIONS.find((q) => q.id === qId);
        return `- ${question?.question ?? qId}: ${answer}`;
      })
      .join("\n");

    const query = `---
あなたは漢方の薬剤師AIです。以下は20問の体質診断回答です。
回答一覧（questionId: answerLabel）：
${answerList}
この回答にもとづき、次のフォーマットで出力してください：
1) 体質の整理（エネルギー不足/血の巡り/水分バランス、冷え/のぼせ等）
2) 体質に合う漢方の方向性＋代表処方名を1〜3候補（断定しない）
3) 生活改善提案（すぐできることを3つ）
注意：医療行為の断定はしない。受診の目安も必要なら一言添える。
---`;

    const currentUser = userId || "user";
    const currentConv = conversationId || "";

    try {
      const response = await fetch("/api/chat/diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          conversation_id: currentConv,
          user: currentUser,
        }),
      });

      const data = await response.json().catch(() => ({} as any));

      if (!response.ok) {
        throw new Error(data?.error || `HTTP error! status: ${response.status}`);
      }

      const answer: string =
        data?.answer ??
        data?.data?.answer ??
        "（回答が取得できませんでした）";

      const newConv: string = data?.conversation_id ?? data?.data?.conversation_id ?? "";

      if (newConv) {
        setConversationId(newConv);
        localStorage.setItem(LS_CONV_ID_DIAG, newConv);
      }

      // AI発言を履歴に追加
      setMessages((prev) => [...prev, { id: makeId(), role: "assistant", content: answer, ts: Date.now() }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "error",
          content: `通信で問題が起きました。もう一度送ってみてください。\n（${err?.message ?? "unknown error"}）`,
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || loading) return;
    if (mode !== "free") return; // freeモードでのみ実行

    setInputText("");
    setLoading(true);

    // ユーザー発言を履歴に追加
    setMessages((prev) => [...prev, { id: makeId(), role: "user", content: text, ts: Date.now() }]);

    const currentUser = userId || "user";
    const currentConv = conversationId || "";

    try {
      const response = await fetch("/api/chat/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: text,
          conversation_id: currentConv,
          user: currentUser,
        }),
      });

      const data = await response.json().catch(() => ({} as any));

      if (!response.ok) {
        throw new Error(data?.error || `HTTP error! status: ${response.status}`);
      }

      const answer: string =
        data?.answer ??
        data?.data?.answer ??
        "（回答が取得できませんでした）";

      const newConv: string = data?.conversation_id ?? data?.data?.conversation_id ?? "";

      if (newConv) {
        setConversationId(newConv);
        localStorage.setItem(LS_CONV_ID_FREE, newConv);
      }

      // AI発言を履歴に追加
      setMessages((prev) => [...prev, { id: makeId(), role: "assistant", content: answer, ts: Date.now() }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "error",
          content: `通信で問題が起きました。もう一度送ってみてください。\n（${err?.message ?? "unknown error"}）`,
          ts: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 相談開始画面
  if (mode === "start") {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <header style={styles.header}>
            <div>
              <div style={styles.title}>体質相談チャット</div>
              <div style={styles.sub}>相談方法を選択してください</div>
            </div>
          </header>

          <main style={styles.startMain}>
            <button
              type="button"
              onClick={() => handleModeSelect("free")}
              style={styles.modeButton}
            >
              <div style={styles.modeButtonTitle}>フリー相談をはじめる</div>
              <div style={styles.modeButtonDesc}>自由に体調や症状について相談できます</div>
            </button>

            <button
              type="button"
              onClick={() => handleModeSelect("diagnosis")}
              style={styles.modeButton}
            >
              <div style={styles.modeButtonTitle}>体質診断（20問）をはじめる</div>
              <div style={styles.modeButtonDesc}>20問の質問に答えて体質を診断します</div>
            </button>
          </main>
        </div>
      </div>
    );
  }

  // 体質診断モード
  if (mode === "diagnosis") {
    const currentQuestion = DIAGNOSIS_QUESTIONS[diagnosisIndex];
    const isCompleted = diagnosisIndex >= DIAGNOSIS_QUESTIONS.length;
    const progress = diagnosisIndex + 1;

    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <header style={styles.header}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={styles.title}>体質診断（20問）</div>
                <div style={styles.sub}>
                  {isCompleted ? "診断完了" : `${progress} / ${DIAGNOSIS_QUESTIONS.length}`}
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                style={styles.resetBtn}
                title="会話履歴をリセット"
              >
                リセット
              </button>
            </div>
          </header>

          <main style={styles.chat}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    ...styles.bubble,
                    ...(m.role === "user" ? styles.user : {}),
                    ...(m.role === "assistant" ? styles.assistant : {}),
                    ...(m.role === "error" ? styles.error : {}),
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {!isCompleted && currentQuestion && (
              <div style={styles.diagnosisQuestion}>
                <div style={styles.diagnosisQuestionText}>{currentQuestion.question}</div>
                <div style={styles.diagnosisOptions}>
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleDiagnosisAnswer(currentQuestion.id, option.value, option.label)}
                      style={styles.diagnosisOptionBtn}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isCompleted && (
              <div style={styles.diagnosisComplete}>
                <div style={styles.diagnosisCompleteText}>
                  20問の診断が完了しました。結果を確認してください。
                </div>
                <button
                  type="button"
                  onClick={handleGenerateResult}
                  style={styles.resultBtn}
                  disabled={loading}
                >
                  {loading ? "生成中…" : "結果を見る"}
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </main>
        </div>
      </div>
    );
  }

  // フリー相談モード（mode === "free" の場合のみ）
  if (mode === "free") {
    return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={styles.title}>体質相談チャット</div>
              <div style={styles.sub}>
                {conversationId ? "会話を継続中" : "新しい会話"}
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              style={styles.resetBtn}
              title="会話履歴をリセット"
            >
              リセット
            </button>
          </div>
        </header>

        <main style={styles.chat}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  ...styles.bubble,
                  ...(m.role === "user" ? styles.user : {}),
                  ...(m.role === "assistant" ? styles.assistant : {}),
                  ...(m.role === "error" ? styles.error : {}),
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </main>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="漢方薬剤師に相談する…"
            style={styles.input}
            disabled={loading}
          />
          <button type="submit" style={styles.btn} disabled={!canSend}>
            {loading ? "送信中…" : "送信"}
          </button>
        </form>
      </div>
    </div>
    );
  }

  // ここには来ないはず（modeは "start" | "free" | "diagnosis" のみ）
  return null;
}
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f7f4ef",
    display: "flex",
    justifyContent: "center",
    padding: 16,
  },
  container: {
    width: "100%",
    maxWidth: 720,
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "14px 16px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
  },
  title: { fontSize: 16, fontWeight: 800 },
  sub: { fontSize: 12, color: "#666", marginTop: 2 },
  resetBtn: {
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid rgba(0,0,0,0.14)",
    background: "#fff",
    color: "#666",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    transition: "all 0.2s",
  },

  chat: {
    flex: 1,
    padding: 16,
    overflowY: "auto",
    background: "#f7f4ef",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  bubble: {
    maxWidth: "78%",
    padding: "10px 12px",
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)",
    whiteSpace: "pre-wrap",
    lineHeight: 1.6,
    fontSize: 14,
  },
  user: {
    background: "#E3F2FD",
    borderColor: "rgba(33,150,243,0.25)",
    borderBottomRightRadius: 6,
  },
  assistant: {
    background: "#f0f0f0",
    borderBottomLeftRadius: 6,
  },
  error: {
    background: "#fff1f2",
    borderColor: "rgba(244,63,94,0.25)",
  },

  form: {
    padding: 12,
    borderTop: "1px solid rgba(0,0,0,0.06)",
    display: "flex",
    gap: 10,
    background: "#fff",
  },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.14)",
    outline: "none",
    fontSize: 14,
  },
  btn: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "none",
    background: "#6B7B58",
    color: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 800,
  },
  startMain: {
    padding: "40px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    alignItems: "stretch",
  },
  modeButton: {
    padding: "24px",
    borderRadius: 12,
    border: "2px solid rgba(0,0,0,0.1)",
    background: "#fff",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s",
  },
  modeButtonTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#333",
    marginBottom: 8,
  },
  modeButtonDesc: {
    fontSize: 14,
    color: "#666",
    lineHeight: 1.6,
  },
  diagnosisQuestion: {
    padding: "20px",
    background: "#fff",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.1)",
    marginTop: 10,
  },
  diagnosisQuestionText: {
    fontSize: 16,
    fontWeight: 600,
    color: "#333",
    marginBottom: 16,
  },
  diagnosisOptions: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  diagnosisOptionBtn: {
    padding: "12px 16px",
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.14)",
    background: "#fff",
    color: "#333",
    cursor: "pointer",
    fontSize: 14,
    textAlign: "left",
    transition: "all 0.2s",
  },
  diagnosisComplete: {
    padding: "20px",
    background: "#fff",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.1)",
    marginTop: 10,
    textAlign: "center",
  },
  diagnosisCompleteText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
  },
  resultBtn: {
    padding: "12px 24px",
    borderRadius: 8,
    border: "none",
    background: "#6B7B58",
    color: "#fff",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 800,
  },
};

