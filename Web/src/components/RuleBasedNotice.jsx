import { Info } from 'lucide-react';

/**
 * Says plainly how a "smart" feature actually reaches its answer.
 *
 * None of these features call a language model. They match keywords, apply
 * fixed rules and quote a knowledge base a teacher approved. Labelling that as
 * AI would oversell it to parents and to schools deciding whether to buy — and
 * the real behaviour is the stronger claim anyway, because a curated answer
 * cannot hallucinate.
 */
export default function RuleBasedNotice({ what = 'Tính năng này', how, style }) {
  return (
    <div
      role="note"
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.18)',
        borderRadius: 12,
        padding: '10px 14px',
        fontSize: '0.78rem',
        color: 'var(--text-secondary)',
        ...style
      }}
    >
      <Info size={15} style={{ flexShrink: 0, marginTop: 2, color: '#6366f1' }} />
      <span>
        <strong>{what}</strong> {how || 'chạy theo bộ quy tắc cố định và kho nội dung do giáo viên biên soạn, không dùng mô hình ngôn ngữ.'}
      </span>
    </div>
  );
}
