import React, { useState } from 'react';
import {
  Save,
  Plus,
  Trash2,
  HelpCircle,
  CheckCircle2,
  ListOrdered,
  ArrowLeftRight,
  BookOpen
} from 'lucide-react';
import { Question, QuestionType } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface ManualTabProps {
  onSaveQuestion: (question: Question) => void;
  onCancel: () => void;
  subjectsList: string[];
  onRequestAddSubject: (setter: (s: string) => void) => void;
}

export const ManualTab: React.FC<ManualTabProps> = ({
  onSaveQuestion,
  onCancel,
  subjectsList,
  onRequestAddSubject,
}) => {
  const { showToast } = useToast();

  const [subject, setSubject] = useState('Toán học');
  const [grade, setGrade] = useState(10);
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<QuestionType>('single');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'very_hard'>('medium');
  const [points, setPoints] = useState(1);
  const [tagsInput, setTagsInput] = useState('');

  // Content & Passage
  const [content, setContent] = useState('');
  const [passage, setPassage] = useState('');
  const [explanation, setExplanation] = useState('');

  // Single / Multiple choice options
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [singleCorrect, setSingleCorrect] = useState('A');
  const [multipleCorrect, setMultipleCorrect] = useState<string[]>(['A']);

  // True / False statements
  const [tfStatements, setTfStatements] = useState<{ text: string; answer: 'TRUE' | 'FALSE' }[]>([
    { text: 'Phát biểu 1: Điều kiện cần để hàm số đạt cực trị tại x₀ là f\'(x₀) = 0.', answer: 'TRUE' },
    { text: 'Phát biểu 2: Nếu f\'(x₀) = 0 thì chắc chắn hàm số đạt cực trị tại x₀.', answer: 'FALSE' },
    { text: 'Phát biểu 3: Giá trị cực đại của hàm số luôn lớn hơn mọi giá trị cực tiểu.', answer: 'FALSE' },
    { text: 'Phát biểu 4: Đạo hàm đổi dấu qua x₀ thì hàm số đạt cực trị tại x₀.', answer: 'TRUE' },
  ]);

  // Fill in the blank
  const [fillAnswer, setFillAnswer] = useState('');

  // Short answer
  const [shortAnswer, setShortAnswer] = useState('');

  // Matching pairs
  const [matchingPairs, setMatchingPairs] = useState<{ left: string; right: string }[]>([
    { left: '1. Parabol y = ax² (a > 0)', right: 'A. Bề lõm quay lên trên' },
    { left: '2. Parabol y = ax² (a < 0)', right: 'B. Bề lõm quay xuống dưới' },
    { left: '3. Trục đối xứng parabol', right: 'C. Đường thẳng x = -b/(2a)' },
  ]);

  // Ordering items
  const [orderingItems, setOrderingItems] = useState<string[]>([
    'Bước 1: Tìm tập xác định của hàm số',
    'Bước 2: Tính đạo hàm f\'(x) và giải phương trình f\'(x) = 0',
    'Bước 3: Lập bảng biến thiên',
    'Bước 4: Kết luận cực trị của hàm số',
  ]);

  // Essay / Rubric
  const [rubric, setRubric] = useState('Tiêu chí chấm: Nêu đúng định nghĩa (0.25đ), Biến đổi chính xác (0.5đ), Kết luận (0.25đ).');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      showToast('Vui lòng nhập nội dung câu hỏi', 'warning');
      return;
    }

    let finalOptions: { id: string; text: string }[] | undefined = undefined;
    let finalCorrectAnswer: any = 'A';

    if (type === 'single') {
      finalOptions = [
        { id: 'A', text: optA.trim() || 'Phương án A' },
        { id: 'B', text: optB.trim() || 'Phương án B' },
        { id: 'C', text: optC.trim() || 'Phương án C' },
        { id: 'D', text: optD.trim() || 'Phương án D' },
      ];
      finalCorrectAnswer = singleCorrect;
    } else if (type === 'multiple') {
      finalOptions = [
        { id: 'A', text: optA.trim() || 'Phương án A' },
        { id: 'B', text: optB.trim() || 'Phương án B' },
        { id: 'C', text: optC.trim() || 'Phương án C' },
        { id: 'D', text: optD.trim() || 'Phương án D' },
      ];
      finalCorrectAnswer = multipleCorrect.join(', ');
    } else if (type === 'true_false') {
      finalOptions = tfStatements.map((item, idx) => ({
        id: String(idx + 1),
        text: item.text,
      }));
      finalCorrectAnswer = tfStatements.map(item => item.answer);
    } else if (type === 'fill') {
      if (!fillAnswer.trim()) {
        showToast('Vui lòng nhập từ hoặc cụm từ cần điền', 'warning');
        return;
      }
      finalCorrectAnswer = fillAnswer.trim();
    } else if (type === 'short_essay') {
      finalCorrectAnswer = shortAnswer.trim() || 'Đáp án mẫu';
    } else if (type === 'matching') {
      finalCorrectAnswer = matchingPairs.map((p, i) => `${p.left} ➔ ${p.right}`).join('; ');
    } else if (type === 'ordering') {
      finalCorrectAnswer = orderingItems.join(' ➔ ');
    } else if (type === 'essay') {
      finalCorrectAnswer = rubric.trim() || 'Thang điểm chi tiết';
    } else if (type === 'passage') {
      finalOptions = [
        { id: 'A', text: optA.trim() || 'Phương án A' },
        { id: 'B', text: optB.trim() || 'Phương án B' },
        { id: 'C', text: optC.trim() || 'Phương án C' },
        { id: 'D', text: optD.trim() || 'Phương án D' },
      ];
      finalCorrectAnswer = singleCorrect;
    }

    const tags = tagsInput
      ? tagsInput.split(',').map(s => s.trim()).filter(Boolean)
      : [subject, `Khối ${grade}`];

    const newQuestion: Question = {
      id: `manual_${Date.now()}`,
      subject,
      grade,
      topic: topic.trim() || 'Chủ đề chung',
      type,
      content: content.trim(),
      passage: type === 'passage' ? passage.trim() : undefined,
      matchingPairs: type === 'matching' ? matchingPairs : undefined,
      orderingItems: type === 'ordering' ? orderingItems : undefined,
      options: finalOptions,
      correctAnswer: finalCorrectAnswer,
      explanation: explanation.trim() || 'Không có giải thích chi tiết.',
      difficulty,
      points,
      rubric: type === 'essay' ? rubric.trim() : undefined,
      tags,
      status: 'approved',
      source: 'Soạn thảo thủ công',
      createdAt: new Date().toISOString(),
    };

    onSaveQuestion(newQuestion);
    showToast('Đã tạo và lưu câu hỏi thành công vào Ngân hàng!', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Header */}
      <div className="bg-[#03172c] border border-[#0e3d54] p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-base font-bold text-white">TAB 3: Tạo câu hỏi bằng thủ công</h3>
          </div>
          <p className="text-xs text-slate-400">
            Soạn thảo chi tiết hỗ trợ đủ 9 dạng câu hỏi: Trắc nghiệm, Đúng/Sai, Điền khuyết, Ghép đôi, Tự luận...
          </p>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-[#041527] border border-[#0e3d54] p-6 rounded-2xl space-y-5 shadow-xl">
        {/* Meta row 1: Subject, Grade, Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Môn học:</label>
            <select
              value={subject}
              onChange={e => {
                if (e.target.value === '__add_new__') {
                  onRequestAddSubject(setSubject);
                } else {
                  setSubject(e.target.value);
                }
              }}
              className="w-full bg-[#02101e] border border-[#0e3d54] rounded-xl p-2.5 text-xs text-white focus:border-cyan-400"
            >
              {subjectsList.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
              <option value="__add_new__">+ Thêm môn học mới...</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Khối lớp:</label>
            <select
              value={grade}
              onChange={e => setGrade(Number(e.target.value))}
              className="w-full bg-[#02101e] border border-[#0e3d54] rounded-xl p-2.5 text-xs text-white focus:border-cyan-400"
            >
              {[6, 7, 8, 9, 10, 11, 12].map(g => (
                <option key={g} value={g}>Khối {g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Dạng câu hỏi (9 dạng):</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as QuestionType)}
              className="w-full bg-[#02101e] border border-[#0e3d54] rounded-xl p-2.5 text-xs text-white focus:border-cyan-400"
            >
              <option value="single">1. Một đáp án đúng (Pick One)</option>
              <option value="multiple">2. Nhiều đáp án đúng (Pick Many)</option>
              <option value="true_false">3. Đúng / Sai theo từng ý</option>
              <option value="fill">4. Điền vào chỗ trống</option>
              <option value="matching">5. Ghép đôi hai cột</option>
              <option value="ordering">6. Sắp xếp thứ tự</option>
              <option value="short_essay">7. Trả lời ngắn</option>
              <option value="essay">8. Tự luận kèm Rubric</option>
              <option value="passage">9. Theo ngữ cảnh / Đoạn văn chung</option>
            </select>
          </div>
        </div>

        {/* Meta row 2: Topic, Difficulty, Points, Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Chủ đề bài học:</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Ví dụ: Hàm số bậc hai, Định luật Newton..."
              className="w-full bg-[#02101e] border border-[#0e3d54] rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mức độ nhận thức:</label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as any)}
              className="w-full bg-[#02101e] border border-[#0e3d54] rounded-xl p-2 text-xs text-white focus:border-cyan-400"
            >
              <option value="easy">Nhận biết</option>
              <option value="medium">Thông hiểu</option>
              <option value="hard">Vận dụng</option>
              <option value="very_hard">Vận dụng cao</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Điểm số mặc định:</label>
            <input
              type="number"
              min={0.25}
              step={0.25}
              value={points}
              onChange={e => setPoints(Number(e.target.value))}
              className="w-full bg-[#02101e] border border-[#0e3d54] rounded-xl p-2 text-xs text-white focus:border-cyan-400"
            />
          </div>
        </div>

        {/* If Type is Passage / Context */}
        {type === 'passage' && (
          <div className="space-y-1.5 p-3.5 bg-[#03172c] border border-cyan-500/40 rounded-xl">
            <label className="block text-xs font-bold text-cyan-300">
              Đoạn văn / Ngữ cảnh bài toán chung (Passage / Stimulus):
            </label>
            <textarea
              rows={3}
              value={passage}
              onChange={e => setPassage(e.target.value)}
              placeholder="Dán đoạn văn bản, trích dẫn bài thơ, tài liệu hoặc ngữ cảnh bài toán chung..."
              className="w-full bg-[#02101e] border border-[#0e3d54] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400"
            />
          </div>
        )}

        {/* Content of Question */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Nội dung câu hỏi (Hỗ trợ ký hiệu Toán LaTeX dạng $...$):
          </label>
          <textarea
            rows={3}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Nhập nội dung câu hỏi..."
            className="w-full bg-[#02101e] border border-[#0e3d54] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-400"
            required
          />
        </div>

        {/* Dynamic Options Area depending on question type */}
        <div className="space-y-3 pt-1">
          {/* 1. Single Choice (A/B/C/D) */}
          {(type === 'single' || type === 'passage') && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Các phương án lựa chọn và ĐÁP ÁN ĐÚNG:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'A', val: optA, setVal: setOptA },
                  { id: 'B', val: optB, setVal: setOptB },
                  { id: 'C', val: optC, setVal: setOptC },
                  { id: 'D', val: optD, setVal: setOptD },
                ].map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                      singleCorrect === item.id
                        ? 'bg-emerald-950/40 border-emerald-500'
                        : 'bg-[#02101e] border-[#0e3d54]'
                    }`}
                  >
                    <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                      <input
                        type="radio"
                        name="single_correct_choice"
                        value={item.id}
                        checked={singleCorrect === item.id}
                        onChange={() => setSingleCorrect(item.id)}
                        className="w-4 h-4 text-emerald-500 bg-slate-900 border-slate-700 cursor-pointer"
                      />
                      <span className="font-bold text-xs text-cyan-400 w-5">{item.id}.</span>
                    </label>
                    <input
                      type="text"
                      value={item.val}
                      onChange={e => item.setVal(e.target.value)}
                      placeholder={`Nội dung phương án ${item.id}`}
                      className="flex-1 bg-transparent border-0 text-xs text-white focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Multiple Choice */}
          {type === 'multiple' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Các phương án lựa chọn (Chọn các phương án ĐÚNG):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'A', val: optA, setVal: setOptA },
                  { id: 'B', val: optB, setVal: setOptB },
                  { id: 'C', val: optC, setVal: setOptC },
                  { id: 'D', val: optD, setVal: setOptD },
                ].map(item => {
                  const isChecked = multipleCorrect.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                        isChecked ? 'bg-emerald-950/40 border-emerald-500' : 'bg-[#02101e] border-[#0e3d54]'
                      }`}
                    >
                      <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setMultipleCorrect(prev => [...prev, item.id]);
                            } else {
                              setMultipleCorrect(prev => prev.filter(x => x !== item.id));
                            }
                          }}
                          className="w-4 h-4 text-emerald-500 rounded bg-slate-900 border-slate-700 cursor-pointer"
                        />
                        <span className="font-bold text-xs text-cyan-400 w-5">{item.id}.</span>
                      </label>
                      <input
                        type="text"
                        value={item.val}
                        onChange={e => item.setVal(e.target.value)}
                        placeholder={`Nội dung phương án ${item.id}`}
                        className="flex-1 bg-transparent border-0 text-xs text-white focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. True / False statements */}
          {type === 'true_false' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Các phát biểu và ĐÁP ÁN ĐÚNG / SAI:
              </label>
              <div className="space-y-2">
                {tfStatements.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#02101e] border border-[#0e3d54] p-2.5 rounded-xl">
                    <span className="w-6 text-center font-bold text-cyan-400 shrink-0">{idx + 1}.</span>
                    <input
                      type="text"
                      value={item.text}
                      onChange={e => {
                        const next = [...tfStatements];
                        next[idx].text = e.target.value;
                        setTfStatements(next);
                      }}
                      className="flex-1 bg-transparent border-0 text-xs text-white focus:outline-none"
                      placeholder={`Nội dung phát biểu ${idx + 1}`}
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...tfStatements];
                          next[idx].answer = 'TRUE';
                          setTfStatements(next);
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                          item.answer === 'TRUE' ? 'bg-emerald-600 text-white' : 'bg-[#041527] text-slate-400 border border-[#0e3d54]'
                        }`}
                      >
                        Đúng (TRUE)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...tfStatements];
                          next[idx].answer = 'FALSE';
                          setTfStatements(next);
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                          item.answer === 'FALSE' ? 'bg-rose-600 text-white' : 'bg-[#041527] text-slate-400 border border-[#0e3d54]'
                        }`}
                      >
                        Sai (FALSE)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Fill in the blank */}
          {type === 'fill' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Đáp án chuẩn xác cần điền vào chỗ trống:
              </label>
              <input
                type="text"
                value={fillAnswer}
                onChange={e => setFillAnswer(e.target.value)}
                placeholder="Nhập từ hoặc cụm từ khóa chuẩn..."
                className="w-full bg-[#02101e] border border-[#0e3d54] rounded-xl p-2.5 text-xs text-white focus:border-cyan-400"
              />
            </div>
          )}

          {/* 5. Matching pairs */}
          {type === 'matching' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Các cặp ghép nối (Cột Trái ➔ Cột Phải):</label>
                <button
                  type="button"
                  onClick={() => setMatchingPairs(prev => [...prev, { left: '', right: '' }])}
                  className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm cặp ghép
                </button>
              </div>
              <div className="space-y-2">
                {matchingPairs.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={p.left}
                      onChange={e => {
                        const next = [...matchingPairs];
                        next[idx].left = e.target.value;
                        setMatchingPairs(next);
                      }}
                      placeholder={`Mục ${idx + 1} (Vế trái)`}
                      className="flex-1 bg-[#02101e] border border-[#0e3d54] rounded-xl p-2 text-xs text-white"
                    />
                    <ArrowLeftRight className="w-4 h-4 text-cyan-400 shrink-0" />
                    <input
                      type="text"
                      value={p.right}
                      onChange={e => {
                        const next = [...matchingPairs];
                        next[idx].right = e.target.value;
                        setMatchingPairs(next);
                      }}
                      placeholder={`Mục ghép nối tương ứng`}
                      className="flex-1 bg-[#02101e] border border-[#0e3d54] rounded-xl p-2 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setMatchingPairs(prev => prev.filter((_, i) => i !== idx))}
                      className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Ordering */}
          {type === 'ordering' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Thứ tự đúng cần sắp xếp:</label>
                <button
                  type="button"
                  onClick={() => setOrderingItems(prev => [...prev, ''])}
                  className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm bước
                </button>
              </div>
              <div className="space-y-2">
                {orderingItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#02101e] border border-[#0e3d54] p-2 rounded-xl">
                    <span className="w-6 text-center font-bold text-cyan-400 text-xs">#{idx + 1}</span>
                    <input
                      type="text"
                      value={item}
                      onChange={e => {
                        const next = [...orderingItems];
                        next[idx] = e.target.value;
                        setOrderingItems(next);
                      }}
                      placeholder={`Bước ${idx + 1}...`}
                      className="flex-1 bg-transparent border-0 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setOrderingItems(prev => prev.filter((_, i) => i !== idx))}
                      className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Short essay */}
          {type === 'short_essay' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Đáp án mẫu hoặc hướng dẫn chấm ngắn gọn:
              </label>
              <textarea
                rows={2}
                value={shortAnswer}
                onChange={e => setShortAnswer(e.target.value)}
                placeholder="Nhập câu trả lời mẫu ngắn gọn..."
                className="w-full bg-[#02101e] border border-[#0e3d54] rounded-xl p-2.5 text-xs text-white focus:border-cyan-400"
              />
            </div>
          )}

          {/* 8. Essay with Rubric */}
          {type === 'essay' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Rubric và Thang điểm chấm chi tiết:
              </label>
              <textarea
                rows={3}
                value={rubric}
                onChange={e => setRubric(e.target.value)}
                placeholder="Nhập tiêu chí và phân bổ thang điểm..."
                className="w-full bg-[#02101e] border border-[#0e3d54] rounded-xl p-2.5 text-xs text-white focus:border-cyan-400"
              />
            </div>
          )}
        </div>

        {/* Detailed Explanation */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Lời giải chi tiết / Hướng dẫn giải:
          </label>
          <textarea
            rows={2}
            value={explanation}
            onChange={e => setExplanation(e.target.value)}
            placeholder="Nhập lời giải chi tiết từng bước..."
            className="w-full bg-[#02101e] border border-[#0e3d54] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400"
          />
        </div>

        {/* Tags input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Thẻ phân loại (Tags):</label>
          <input
            type="text"
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            placeholder="Cách nhau bởi dấu phẩy (Ví dụ: Đại số, Khối 10, Parabol)..."
            className="w-full bg-[#02101e] border border-[#0e3d54] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400"
          />
        </div>

        {/* Submit button */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#0e3d54]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-[#02101e] hover:bg-[#07243e] border border-[#0e3d54] text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Hủy thao tác
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu câu hỏi vào Ngân hàng</span>
          </button>
        </div>
      </form>
    </div>
  );
};
