import React from 'react';
import { Modal } from '../common/Modal';
import { Question } from '../../types';
import {
  CheckCircle2,
  Clock,
  Layers,
  BookOpen,
  Tag,
  ArrowLeftRight,
  ListOrdered,
  FileText
} from 'lucide-react';

interface QuestionDetailModalProps {
  question: Question | null;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onEdit?: (question: Question) => void;
}

export const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({
  question,
  onClose,
  onApprove,
  onEdit,
}) => {
  if (!question) return null;

  const status = question.status || 'approved';

  return (
    <Modal
      isOpen={!!question}
      onClose={onClose}
      title="Chi tiết Câu hỏi & Đáp án"
      subtitle={`${question.subject} - Khối ${question.grade} · ${question.topic}`}
      maxWidth="lg"
    >
      <div className="p-6 space-y-4 text-xs text-slate-200">
        {/* Meta badges bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#03172c] border border-[#0e3d54] rounded-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 bg-cyan-950 border border-cyan-800 text-cyan-300 rounded-lg font-bold">
              {question.subject} - Khối {question.grade}
            </span>
            <span className="px-2.5 py-1 bg-blue-950 border border-blue-800 text-blue-300 rounded-lg font-semibold">
              {question.type === 'single'
                ? 'Một đáp án (A/B/C/D)'
                : question.type === 'multiple'
                ? 'Nhiều đáp án'
                : question.type === 'true_false'
                ? 'Đúng / Sai từng ý'
                : question.type === 'fill'
                ? 'Điền khuyết'
                : question.type === 'short_essay'
                ? 'Trả lời ngắn'
                : question.type === 'matching'
                ? 'Ghép đôi'
                : question.type === 'ordering'
                ? 'Sắp xếp'
                : question.type === 'essay'
                ? 'Tự luận'
                : 'Theo ngữ cảnh'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold ${
                question.difficulty === 'easy'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : question.difficulty === 'medium'
                  ? 'bg-sky-950 text-sky-300 border border-sky-800'
                  : 'bg-purple-950 text-purple-300 border border-purple-800'
              }`}
            >
              {question.difficulty === 'easy'
                ? 'Nhận biết'
                : question.difficulty === 'medium'
                ? 'Thông hiểu'
                : question.difficulty === 'hard'
                ? 'Vận dụng'
                : 'Vận dụng cao'}
            </span>
          </div>

          <div>
            {status === 'approved' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Đã duyệt
              </span>
            ) : status === 'pending_review' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Chờ duyệt
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                Bản nháp
              </span>
            )}
          </div>
        </div>

        {/* Passage if applicable */}
        {question.passage && (
          <div className="space-y-1">
            <span className="font-bold text-cyan-400">Đoạn văn / Ngữ cảnh bài toán chung:</span>
            <div className="p-3 bg-[#02101e] border border-[#0e3d54] rounded-xl text-slate-300 whitespace-pre-wrap leading-relaxed">
              {question.passage}
            </div>
          </div>
        )}

        {/* Question stem */}
        <div className="space-y-1">
          <span className="font-bold text-slate-400">Nội dung câu hỏi:</span>
          <div className="p-4 bg-[#02101e] border border-[#0e3d54] rounded-xl text-white font-medium text-sm leading-relaxed">
            {question.content}
          </div>
        </div>

        {/* Options */}
        {question.options && question.options.length > 0 && (
          <div className="space-y-2">
            <span className="font-bold text-slate-400">Các phương án lựa chọn:</span>
            <div className="grid grid-cols-1 gap-2">
              {question.options.map(opt => {
                const isCorrect =
                  opt.id === question.correctAnswer ||
                  (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(opt.id)) ||
                  (typeof question.correctAnswer === 'string' &&
                    question.correctAnswer.split(',').map(s => s.trim()).includes(opt.id));

                return (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                      isCorrect
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                        : 'bg-[#02101e] border-[#0e3d54] text-slate-300'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#041527] border border-[#0e3d54] text-cyan-400'
                      }`}
                    >
                      {opt.id}
                    </span>
                    <span className="flex-1 font-medium">{opt.text}</span>
                    {isCorrect && (
                      <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-bold text-[11px] shrink-0">
                        Đáp án đúng
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Matching pairs if applicable */}
        {question.matchingPairs && question.matchingPairs.length > 0 && (
          <div className="space-y-2">
            <span className="font-bold text-slate-400">Cặp ghép nối:</span>
            <div className="space-y-1.5">
              {question.matchingPairs.map((p, idx) => (
                <div key={idx} className="p-2.5 bg-[#02101e] border border-[#0e3d54] rounded-lg flex items-center justify-between text-xs">
                  <span className="text-white font-medium">{p.left}</span>
                  <span className="text-cyan-400 font-bold">➔</span>
                  <span className="text-emerald-300 font-semibold">{p.right}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Correct Answer */}
        <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/60 rounded-xl space-y-1">
          <span className="font-bold text-emerald-400">Đáp án chính xác:</span>
          <div className="text-white font-bold text-sm">
            {Array.isArray(question.correctAnswer)
              ? question.correctAnswer.join(', ')
              : question.correctAnswer}
          </div>
        </div>

        {/* Explanation */}
        {question.explanation && (
          <div className="p-3.5 bg-sky-950/30 border border-sky-800/60 rounded-xl space-y-1">
            <span className="font-bold text-sky-400">Lời giải chi tiết & Căn cứ sư phạm:</span>
            <div className="text-slate-300 font-normal leading-relaxed">
              {question.explanation}
            </div>
          </div>
        )}

        {/* Tags */}
        {question.tags && question.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-semibold">Thẻ:</span>
            {question.tags.map((t, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-md bg-[#02101e] border border-[#0e3d54] text-cyan-300 text-[11px]">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Action footer in modal */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#0e3d54]">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(question)}
              className="px-4 py-2 bg-[#03172c] hover:bg-[#07243e] text-cyan-300 border border-[#0e3d54] rounded-xl font-bold cursor-pointer transition-colors"
            >
              Chỉnh sửa câu hỏi
            </button>
          )}

          {status !== 'approved' && onApprove && (
            <button
              type="button"
              onClick={() => onApprove(question.id)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer shadow-md transition-colors"
            >
              Phê duyệt câu hỏi
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#02101e] hover:bg-[#062440] text-slate-300 border border-[#0e3d54] rounded-xl font-semibold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
};
