"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import Icon from "@/components/ui/Icon";
import { api, ApiError } from "@/lib/api";
import { toDateStr } from "@/lib/format";

/******************************************************************************
                                Types
******************************************************************************/

type Role = "user" | "assistant";

interface IMessage {
  id: string;
  role: Role;
  content: string;
}

type ChatAction = "plan_updated" | "meal_swapped" | "meal_logged";

interface IChatResponse {
  reply: string;
  actions: ChatAction[];
}

/******************************************************************************
                                Constants
******************************************************************************/

const SUGGESTIONS = [
  "Hôm nay còn thiếu bao nhiêu protein?",
  "Giải thích thực đơn hôm nay",
  "Đổi món bữa tối rẻ hơn",
  "Nguyên liệu mua ở đâu rẻ?",
] as const;

const WELCOME =
  "Mình là trợ lý StudentBites. Hỏi về protein, ngân sách, thực đơn, hoặc nhờ đổi món / ghi bữa đã ăn.";

/******************************************************************************
                                Component
******************************************************************************/

/**
 * Hộp chat nổi kiểu bảng hiệu — cố định góc phải, nằm trên tab bar mobile.
 */
export default function ChatBox() {
  const queryClient = useQueryClient();
  const panelId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([
    { id: "welcome", role: "assistant", content: WELCOME },
  ]);

  useEffect(() => {
    if (!open) return;
    const node = listRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, open, pending]);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 80);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  function invalidateForActions(actions: ChatAction[]) {
    if (actions.includes("plan_updated") || actions.includes("meal_swapped")) {
      void queryClient.invalidateQueries({ queryKey: ["plan"] });
    }
    if (actions.includes("meal_logged")) {
      void queryClient.invalidateQueries({ queryKey: ["logs-day"] });
      void queryClient.invalidateQueries({ queryKey: ["stats-daily"] });
      void queryClient.invalidateQueries({ queryKey: ["logs-month"] });
      void queryClient.invalidateQueries({ queryKey: ["stats-spending"] });
    }
  }

  async function sendText(text: string) {
    const content = text.trim();
    if (!content || pending) return;

    const userMsg: IMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setPending(true);

    try {
      const payload = nextMessages
        .filter((m) => m.id !== "welcome")
        .map(({ role, content: c }) => ({ role, content: c }));

      const res = await api.post<IChatResponse>("/chat", {
        messages: payload,
        date: toDateStr(),
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: res.reply,
        },
      ]);
      invalidateForActions(res.actions ?? []);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Không gửi được tin nhắn. Thử lại nhé.";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void sendText(input);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendText(input);
    }
  }

  return (
    <>
      {/* Nút mở — nhấc khỏi tab bar trên mobile */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={`disp press fixed z-[1100] flex size-14 items-center justify-center border-3 border-ink shadow-hard-deep transition-[transform,background-color,color] duration-150 ${
          open
            ? "bg-panel text-ink"
            : "bg-sign text-ink hover:-translate-y-0.5"
        } bottom-[5.75rem] right-4 lg:bottom-8 lg:right-8`}
        title={open ? "Đóng chat" : "Mở trợ lý"}
      >
        <Icon name={open ? "close" : "chat"} className="size-6" strokeWidth={2.2} />
        <span className="sr-only">{open ? "Đóng chat" : "Mở trợ lý AI"}</span>
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Trợ lý StudentBites"
          className="fixed z-[1090] flex flex-col border-3 border-ink bg-enamel-deep shadow-hard-deep anim-rise-sm bottom-[10.25rem] right-4 left-4 max-h-[min(70dvh,34rem)] sm:left-auto sm:w-[22.5rem] lg:bottom-28 lg:right-8"
        >
          {/* Header kiểu biển hiệu */}
          <div className="flex items-center gap-2.5 border-b-3 border-ink bg-sign px-3 py-2.5 text-ink">
            <Icon name="chat" className="size-5 shrink-0" strokeWidth={2.2} />
            <div className="min-w-0 flex-1">
              <p className="disp text-[0.95rem] tracking-widest">Trợ lý</p>
              <p className="truncate text-[0.65rem] font-semibold text-ink/65">
                Protein · ngân sách · thực đơn
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="press border-2 border-ink bg-enamel p-1.5 text-sign"
              title="Đóng"
            >
              <Icon name="close" className="size-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[92%] border-2 border-ink px-3 py-2 text-[0.8rem] leading-relaxed ${
                    m.role === "user"
                      ? "bg-sign text-ink shadow-hard-sm"
                      : "bg-panel text-ink shadow-hard-sm"
                  }`}
                >
                  <p className="label mb-1 opacity-45">
                    {m.role === "user" ? "Bạn" : "Trợ lý"}
                  </p>
                  <p className="whitespace-pre-wrap font-semibold">{m.content}</p>
                </div>
              </div>
            ))}

            {pending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 border-2 border-ink bg-panel px-3 py-2 text-ink shadow-hard-sm">
                  <Icon name="spinner" className="size-4 text-enamel" />
                  <span className="text-[0.75rem] font-semibold text-ink/60">
                    Đang nghĩ…
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Gợi ý nhanh */}
          {messages.length <= 2 && !pending && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar border-t border-panel/15 px-3 py-2">
              {SUGGESTIONS.map((s) => (
                <Chip
                  key={s}
                  disabled={pending}
                  onClick={() => void sendText(s)}
                  className="max-w-[14rem] truncate"
                >
                  {s}
                </Chip>
              ))}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mx-3 mb-2 border-2 border-ink bg-chili-deep px-2.5 py-2 text-[0.7rem] font-semibold leading-snug text-panel"
            >
              {error}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={onSubmit}
            className="flex items-end gap-2 border-t-3 border-ink bg-enamel px-2.5 py-2.5"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={pending}
              placeholder="Hỏi về ăn uống hôm nay…"
              className="max-h-24 min-h-[2.75rem] flex-1 resize-none border-2 border-ink bg-panel px-3 py-2.5 text-[0.85rem] font-semibold text-ink placeholder:font-normal placeholder:text-ink/35 focus:outline-none focus-visible:border-sign-deep disabled:opacity-60"
            />
            <Button
              type="submit"
              size="md"
              icon="send"
              loading={pending}
              disabled={!input.trim() || pending}
              className="shrink-0 !px-3"
              aria-label="Gửi"
            >
              <span className="sr-only">Gửi</span>
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
