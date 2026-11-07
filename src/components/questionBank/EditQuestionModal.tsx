import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Question, QuestionType } from '../../types';
import { Save } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface EditQuestionModalProps {
  question: Question | null;
  onClose: () => void;
  onSave: (updated: Question) => void;
  subjectsList: string[];
}

export const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  question,
  onClose,
  onSave,
  subjectsList,
}) => {
  const { showToast } = useToast();

  const [subject, setSubject] = useState('Toán học');
  const [grade, setGrade] = useState(10);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'very_hard'>('medium');
  const [content, setContent] = useState('');
  const [explanation, setExplanation] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');

  useEffect(() => {
    if (question) {
      setSubject(question.subject || 'Toán học');
      setGrade(question.grade || 10);
      setTopic(question.topic || '');
      setDifficulty(question.difficulty || 'medium');
      setContent(question.content || '');
      setExplanation(question.explanation || '');
      setCorrectAnswer(
        Array.isArray(question.correctAnswer)
          ? question.correctAnswer.join(', ')
          : String(question.correctAnswer || 'A')
      );

      const opts = question.options || [];
      setOptA(opts.find(o => o.id === 'A')?.text || '');
      setOptB(opts.find(o => o.id === 'B')?.text || '');
      setOptC(opts.find(o => o.id === 'C')?.text || '');
      setOptD(opts.find(o => o.id === 'D')?.text || '');
    }
  }, [question]);

  if (!question) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      showToast('Vui lòng nhập nội dung câu hỏi', 'warning');
      return;
    }

    const updatedOptions =
      question.type === 'single' || question.type === 'multiple'
        ? [
            { id: 'A', text: optA.trim() || 'Phương án A' },
            { id: 'B', text: optB.trim() || 'Phương án B' },
            { id: 'C', text: optC.trim() || 'Phương án C' },
            { id: 'D', text: optD.trim() || 'Phương án D' },
          ]
        : question.options;

    const updated: Question = {
      ...question,
      subject,
      grade,
      topic: topic.trim() || question.topic,
      difficulty,
      content: content.trim(),
      explanation: explanation.trim(),
      correctAnswer: correctAnswer.trim(),
      options: updatedOptions,
      updated_at: new Date().toISOString(),
    };

    onSave(updated);
    showToast('Đã cập nhật câu hỏi thành công!', 'success');
    onClose();
  };

  return (
    <Modal
      isOpen={!!question}
      onClose={onClose}
      title="Chỉnh sửa Câu hỏi"
      subtitle={`Mã: ${question.id}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-200">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Môn học:</label>
            <select
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full bg-[#02101e] border border-[#0e3d54] rounded-lg p-2 text-white focus:border-cyan-400"
            >
              {subjectsList.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Khối lớp:</label>
            <select
              value={grade}
              onChange={e => setGrade(Number(e.target.value))}
              className="w-full bg-[#02101e] border border-[#0e3d54] rounded-lg p-2 text-white focus:border-cyan-400"
            >
              {[6, 7, 8, 9, 10, 11, 12].map(g => (
                <option key={g} value={g}>Khối {g}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Chủ đề bài học:</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full bg-[#02101e] border border-[#0e3d54] rounded-lg p-2 text-white focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Mức độ nhận thức:</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as any)}
              className="w-full bg-[#02101e] border border-[#0e3d54] rounded-lg p-2 text-white focus:border-cyan-400"
            >
              <option value="easy">Nhận biết</option>
              <option value="medium">Thông hiểu</option>
              <option value="hard">Vận dụng</option>
              <option value="very_hard">Vận dụng cao</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Nội dung câu hỏi:</label>
          <textarea
            rows={3}
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full bg-[#02101e] border border-[#0e3d54] rounded-lg p-2.5 text-white focus:border-cyan-400 text-xs"
            required
          />
        </div>

        {(question.type === 'single' || question.type === 'multiple') && (
          <div className="space-y-2">
            <label className="block text-slate-400 font-semibold">Các lựa chọn A, B, C, D:</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="A. ..." value={optA} onChange={e => setOptA(e.target.value)} className="bg-[#02101e] border border-[#0e3d54] rounded-lg p-2 text-white" />
              <input type="text" placeholder="B. ..." value={optB} onChange={e => setOptB(e.target.value)} className="bg-[#02101e] border border-[#0e3d54] rounded-lg p-2 text-white" />
              <input type="text" placeholder="C. ..." value={optC} onChange={e => setOptC(e.target.value)} className="bg-[#02101e] border border-[#0e3d54] rounded-lg p-2 text-white" />
              <input type="text" placeholder="D. ..." value={optD} onChange={e => setOptD(e.target.value)} className="bg-[#02101e] border border-[#0e3d54] rounded-lg p-2 text-white" />
            </div>
          </div>
        )}

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Đáp án đúng:</label>
          <input
            type="text"
            value={correctAnswer}
            onChange={e => setCorrectAnswer(e.target.value)}
            className="w-full bg-[#02101e] border border-[#0e3d54] rounded-lg p-2 text-white focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Lời giải chi tiết:</label>
          <textarea
            rows={2}
            value={explanation}
            onChange={e => setExplanation(e.target.value)}
            className="w-full bg-[#02101e] border border-[#0e3d54] rounded-lg p-2 text-white focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#0e3d54]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#02101e] hover:bg-[#062440] text-slate-300 border border-[#0e3d54] rounded-xl font-semibold cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer shadow-md flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
