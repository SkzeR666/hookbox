import { useMemo } from "react";

/**
 * Tiny JSON syntax highlighter — no dependency, no AST, just token classes.
 * Falls back to plain text when the payload isn't JSON.
 */

const TOKEN_RE =
  /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])/g;

const KEY_CLS = "text-[#8fd4b6]";
const STRING_CLS = "text-[#7dd3a5]";
const NUMBER_CLS = "text-[#e0b48c]";
const LITERAL_CLS = "text-[#c792ea]";
const PUNCT_CLS = "text-[#5a6a60]";

interface Token {
  text: string;
  cls: string | null;
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;

  while ((m = TOKEN_RE.exec(text)) !== null) {
    if (m.index > last) {
      tokens.push({ text: text.slice(last, m.index), cls: null });
    }

    if (m[1] !== undefined) {
      tokens.push({ text: m[1], cls: m[2] ? KEY_CLS : STRING_CLS });
      if (m[2]) tokens.push({ text: m[2], cls: PUNCT_CLS });
    } else if (m[3] !== undefined) {
      tokens.push({ text: m[3], cls: LITERAL_CLS });
    } else if (m[4] !== undefined) {
      tokens.push({ text: m[4], cls: NUMBER_CLS });
    } else if (m[5] !== undefined) {
      tokens.push({ text: m[5], cls: PUNCT_CLS });
    }

    last = m.index + m[0].length;
  }

  if (last < text.length) {
    tokens.push({ text: text.slice(last), cls: null });
  }
  return tokens;
}

function looksLikeJson(text: string): boolean {
  const t = text.trimStart();
  if (!t.startsWith("{") && !t.startsWith("[")) return false;
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

export function JsonView({ text }: { text: string }) {
  const isJson = useMemo(() => looksLikeJson(text), [text]);
  const tokens = useMemo(() => (isJson ? tokenize(text) : []), [text, isJson]);

  if (!isJson) return <>{text}</>;

  return (
    <>
      {tokens.map((t, i) =>
        t.cls ? (
          <span key={i} className={t.cls}>
            {t.text}
          </span>
        ) : (
          <span key={i}>{t.text}</span>
        ),
      )}
    </>
  );
}
