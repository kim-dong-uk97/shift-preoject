export type AiModel = { id: string; name: string; vendor: string; desc: string };

// TODO(TBD): 실제 연결할 모델·버전은 AI 연동 방식 확정 후 교체 (지금은 화면용 목록, 응답은 모두 데모)
export const models: AiModel[] = [
  { id: "auto", name: "자동", vendor: "추천", desc: "질문에 맞는 모델을 알아서 골라요" },
  { id: "gpt", name: "GPT", vendor: "OpenAI", desc: "OpenAI의 대화 모델" },
  { id: "claude", name: "Claude", vendor: "Anthropic", desc: "Anthropic의 대화 모델" },
  { id: "gemini", name: "Gemini", vendor: "Google", desc: "Google의 대화 모델" },
];

export const defaultModel = models[0];

const MODEL_KEY = "aurora.model";

export function loadModel(): AiModel {
  try {
    return models.find((m) => m.id === localStorage.getItem(MODEL_KEY)) ?? defaultModel;
  } catch {
    return defaultModel;
  }
}

export function saveModel(m: AiModel) {
  try {
    localStorage.setItem(MODEL_KEY, m.id);
  } catch {
    // 저장 불가 시 이번 방문 동안만 유지
  }
}
