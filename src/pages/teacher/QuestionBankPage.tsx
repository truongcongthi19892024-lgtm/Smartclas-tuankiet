import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Sparkles,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  FileText,
  Trash2,
  Edit2,
  Eye,
  Check,
  X,
  FileSpreadsheet,
  Layers,
  Tag,
  BookOpen,
  ChevronRight,
  ListOrdered,
  FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { db } from '../../services/db';
import { Question, QuestionType } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { ImportTab } from '../../components/questionBank/ImportTab';
import { AIGeneratorTab } from '../../components/questionBank/AIGeneratorTab';
import { ManualTab } from '../../components/questionBank/ManualTab';
import { QuestionDetailModal } from '../../components/questionBank/QuestionDetailModal';
import { EditQuestionModal } from '../../components/questionBank/EditQuestionModal';

export const QuestionBankPage: React.FC = () => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'pending' | 'draft' | 'review'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  // Input Methods mode: 'list' (Xem danh sách ngân hàng) or 'input_tabs' (3 Tab nạp/tạo câu hỏi)
  const [viewMode, setViewMode] = useState<'list' | 'input_tabs'>('list');
  const [activeInputTab, setActiveInputTab] = useState<'import' | 'ai' | 'manual'>('import');

  // Subjects dynamic list
  const [subjectsList, setSubjectsList] = useState<string[]>([
    'Toán học',
    'Vật lý',
    'Hóa học',
    'Sinh học',
    'Ngữ văn',
    'Lịch sử',
    'Địa lý',
    'Tiếng Anh',
    'Tin học',
    'GD Kinh tế & Pháp luật',
  ]);

  // Modal: Add Subject
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [pendingSubjectSetter, setPendingSubjectSetter] = useState<((s: string) => void) | null>(null);

  // Selection for batch actions
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Modals
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [batchDeleting, setBatchDeleting] = useState(false);

  useEffect(() => {
    const list = db.getQuestions();
    setQuestions(list);
  }, []);

  const handleRequestAddSubject = (setter: (s: string) => void) => {
    setPendingSubjectSetter(() => setter);
    setNewSubjectInput('');
    setIsAddSubjectModalOpen(true);
  };

  const handleConfirmAddSubject = () => {
    const trimmed = newSubjectInput.trim();
    if (!trimmed) {
      showToast('Vui lòng nhập tên môn học', 'warning');
      return;
    }
    if (!subjectsList.includes(trimmed)) {
      setSubjectsList(prev => [...prev, trimmed]);
    }
    if (pendingSubjectSetter) {
      pendingSubjectSetter(trimmed);
    }
    showToast(`Đã thêm môn học: ${trimmed}`, 'success');
    setIsAddSubjectModalOpen(false);
    setNewSubjectInput('');
    setPendingSubjectSetter(null);
  };

  // Handlers for 3 Input Tabs
  const handleImportSuccess = (newQuestions: Question[]) => {
    const saved = db.batchCreateQuestions(newQuestions);
    setQuestions(prev => [...saved, ...prev]);
    setViewMode('list');
  };

  const handleAIGeneratedSuccess = (newQuestions: Question[]) => {
    const saved = db.batchCreateQuestions(newQuestions);
    setQuestions(prev => [...saved, ...prev]);
    setViewMode('list');
  };

  const handleManualSave = (newQuestion: Question) => {
    const saved = db.createQuestion(newQuestion);
    setQuestions(prev => [saved, ...prev]);
    setViewMode('list');
  };

  const handleUpdateQuestion = (updated: Question) => {
    db.updateQuestion(updated.id, updated);
    setQuestions(prev => prev.map(q => (q.id === updated.id ? updated : q)));
    if (viewingQuestion && viewingQuestion.id === updated.id) {
      setViewingQuestion(updated);
    }
  };

  const handleApproveQuestion = (id: string) => {
    db.updateQuestion(id, { status: 'approved' });
    setQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, status: 'approved' as const } : q))
    );
    showToast('Đã phê duyệt câu hỏi thành công!', 'success');
  };

  const handleDeleteOne = (id: string) => {
    db.deleteQuestion(id);
    setQuestions(prev => prev.filter(q => q.id !== id));
    setSelectedQuestionIds(prev => prev.filter(qId => qId !== id));
    setDeletingQuestionId(null);
    showToast('Đã xóa câu hỏi khỏi ngân hàng', 'success');
  };

  // Batch actions
  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuestionIds(filteredQuestions.map(q => q.id));
    } else {
      setSelectedQuestionIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedQuestionIds(prev =>
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const handleBatchApprove = () => {
    if (selectedQuestionIds.length === 0) return;
    db.batchApproveQuestions(selectedQuestionIds);
    setQuestions(prev =>
      prev.map(q =>
        selectedQuestionIds.includes(q.id) ? { ...q, status: 'approved' as const } : q
      )
    );
    showToast(`Đã duyệt thành công ${selectedQuestionIds.length} câu hỏi!`, 'success');
    setSelectedQuestionIds([]);
  };

  const handleBatchDelete = () => {
    if (selectedQuestionIds.length === 0) return;
    db.batchDeleteQuestions(selectedQuestionIds);
    setQuestions(prev => prev.filter(q => !selectedQuestionIds.includes(q.id)));
    showToast(`Đã xóa ${selectedQuestionIds.length} câu hỏi khỏi ngân hàng`, 'success');
    setSelectedQuestionIds([]);
    setBatchDeleting(false);
  };

  const handleExportSelectedToExcel = () => {
    const listToExport = questions.filter(q =>
      selectedQuestionIds.length > 0 ? selectedQuestionIds.includes(q.id) : true
    );

    if (listToExport.length === 0) {
      showToast('Không có câu hỏi nào để xuất file', 'warning');
      return;
    }

    const data = listToExport.map((q, idx) => ({
      STT: idx + 1,
      'Mã câu hỏi': q.id,
      'Môn học': q.subject,
      Khối: q.grade,
      'Chủ đề': q.topic,
      'Dạng câu hỏi': q.type,
      'Mức độ': q.difficulty,
      'Nội dung câu hỏi': q.content,
      'Đáp án đúng': Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer,
      'Lời giải chi tiết': q.explanation,
      'Trạng thái': q.status || 'approved',
      'Nguồn gốc': q.source || 'Hệ thống Smart Class',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    XLSX.writeFile(wb, `Ngan_Hang_Cau_Hoi_SmartClass_${Date.now()}.xlsx`);
    showToast(`Đã xuất thành công file Excel (${listToExport.length} câu hỏi)!`, 'success');
  };

  // Filter questions
  const filteredQuestions = questions.filter(q => {
    const matchesSearch =
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.tags && q.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesGrade = gradeFilter === 'all' || String(q.grade) === gradeFilter;
    const matchesSubject = subjectFilter === 'all' || q.subject === subjectFilter;
    const matchesType = typeFilter === 'all' || q.type === typeFilter;
    const matchesDifficulty = difficultyFilter === 'all' || q.difficulty === difficultyFilter;

    const status = q.status || 'approved';
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'approved' && status === 'approved') ||
      (activeTab === 'pending' && status === 'pending_review') ||
      (activeTab === 'draft' && status === 'draft') ||
      (activeTab === 'review' && (status === 'needs_fix' || status === 'archived'));

    return (
      matchesSearch &&
      matchesGrade &&
      matchesSubject &&
      matchesType &&
      matchesDifficulty &&
      matchesTab
    );
  });

  const countApproved = questions.filter(q => (q.status || 'approved') === 'approved').length;
  const countPending = questions.filter(q => q.status === 'pending_review').length;
  const countDraft = questions.filter(q => q.status === 'draft').length;
  const countReview = questions.filter(q => q.status === 'needs_fix' || q.status === 'archived').length;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        breadcrumbItems={[
          { label: 'Dạy & Học' },
          { label: 'Ngân hàng câu hỏi' },
        ]}
        title="Ngân hàng Câu hỏi Thông minh"
        subtitle="Quản lý kho tri thức khảo thí số hóa chuẩn GDPT 2018 - Tích hợp AI Gemini & Bộ công cụ Import/Export đa định dạng"
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportSelectedToExcel}
              className="px-3.5 py-2 bg-[#03172c] hover:bg-[#07243e] border border-[#0e3d54] text-cyan-300 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-cyan-400" />
              <span>Xuất Excel ({selectedQuestionIds.length > 0 ? selectedQuestionIds.length : 'Tất cả'})</span>
            </button>
          </div>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#041527] border border-[#0e3d54] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng số câu hỏi</div>
            <div className="text-2xl font-black text-white mt-1 tabular-nums">{questions.length}</div>
            <div className="text-[10px] text-cyan-400 mt-0.5">Kho câu hỏi toàn trường</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#041527] border border-[#0e3d54] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đã phê duyệt</div>
            <div className="text-2xl font-black text-emerald-400 mt-1 tabular-nums">{countApproved}</div>
            <div className="text-[10px] text-emerald-500 mt-0.5">Sẵn sàng xuất đề thi</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#041527] border border-[#0e3d54] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chờ phê duyệt</div>
            <div className="text-2xl font-black text-amber-400 mt-1 tabular-nums">{countPending}</div>
            <div className="text-[10px] text-amber-500 mt-0.5">Tạo từ AI / Import</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#041527] border border-[#0e3d54] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bản nháp / Cần sửa</div>
            <div className="text-2xl font-black text-slate-300 mt-1 tabular-nums">{countDraft + countReview}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Đang soạn thảo</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-300">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3 PHƯƠNG THỨC ĐẦU VÀO - NAVIGATION BAR (Tương ứng với 3 TAB yêu cầu) */}
      <div className="bg-[#041527] p-3 rounded-2xl border border-[#0e3d54] shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black text-cyan-300 uppercase tracking-wide ml-1">
            Phương thức đầu vào:
          </span>

          <div className="flex items-center gap-1.5 p-1 bg-[#02101e] rounded-xl border border-[#0e3d54] flex-wrap">
            {/* TAB 1: NHẬP CÂU HỎI BẰNG CÁCH IMPORT */}
            <button
              type="button"
              onClick={() => {
                setViewMode('input_tabs');
                setActiveInputTab('import');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === 'input_tabs' && activeInputTab === 'import'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-[#062440]'
              }`}
            >
              <Upload className="w-4 h-4 text-emerald-300" />
              <span>TAB 1: Nhập câu hỏi bằng IMPORT (Word / Excel / CSV)</span>
            </button>

            {/* TAB 2: TẠO CÂU HỎI BẰNG AI THÔNG MINH */}
            <button
              type="button"
              onClick={() => {
                setViewMode('input_tabs');
                setActiveInputTab('ai');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === 'input_tabs' && activeInputTab === 'ai'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-[#062440]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span>TAB 2: Tạo bằng AI thông minh (Giáo án / Ảnh / Web / PDF / Word)</span>
            </button>

            {/* TAB 3: TẠO BẰNG THỦ CÔNG */}
            <button
              type="button"
              onClick={() => {
                setViewMode('input_tabs');
                setActiveInputTab('manual');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                viewMode === 'input_tabs' && activeInputTab === 'manual'
                  ? 'bg-[#0284c7] text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-[#062440]'
              }`}
            >
              <Plus className="w-4 h-4 text-cyan-300" />
              <span>TAB 3: Tạo bằng thủ công</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'list' ? 'input_tabs' : 'list')}
            className="px-3.5 py-2 bg-[#03172c] hover:bg-[#07243e] text-cyan-300 border border-[#0e3d54] text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap"
          >
            {viewMode === 'input_tabs' ? '➔ Xem Danh sách Ngân hàng' : '✚ Mở Khu vực Nạp câu hỏi'}
          </button>
        </div>
      </div>

      {/* NỘI DUNG HIỂN THỊ: CHẾ ĐỘ 3 TAB NẠP CÂU HỎI HOẶC DANH SÁCH */}
      {viewMode === 'input_tabs' ? (
        <div className="bg-[#041527] p-6 rounded-2xl border border-[#0e3d54] shadow-xl">
          {activeInputTab === 'import' && (
            <ImportTab
              existingQuestions={questions}
              onImportSuccess={handleImportSuccess}
              onCancel={() => setViewMode('list')}
              subjectsList={subjectsList}
            />
          )}

          {activeInputTab === 'ai' && (
            <AIGeneratorTab
              onGeneratedSuccess={handleAIGeneratedSuccess}
              onCancel={() => setViewMode('list')}
              subjectsList={subjectsList}
              onRequestAddSubject={handleRequestAddSubject}
            />
          )}

          {activeInputTab === 'manual' && (
            <ManualTab
              onSaveQuestion={handleManualSave}
              onCancel={() => setViewMode('list')}
              subjectsList={subjectsList}
              onRequestAddSubject={handleRequestAddSubject}
            />
          )}
        </div>
      ) : (
        /* CHẾ ĐỘ: DANH SÁCH NGÂN HÀNG CÂU HỎI VÀ BỘ LỌC */
        <div className="space-y-4">
          {/* Status Tabs and Search Filters */}
          <div className="bg-[#041527] p-4 rounded-2xl border border-[#0e3d54] space-y-3 shadow-sm">
            {/* Status Tabs */}
            <div className="flex items-center gap-2 border-b border-[#0e3d54] pb-3 overflow-x-auto custom-horizontal-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-[#0284c7] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#062440]'
                }`}
              >
                Tất cả ({questions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('approved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'approved'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#062440]'
                }`}
              >
                Đã duyệt ({countApproved})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'pending'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#062440]'
                }`}
              >
                Chờ duyệt ({countPending})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('draft')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'draft'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#062440]'
                }`}
              >
                Bản nháp ({countDraft})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('review')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'review'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#062440]'
                }`}
              >
                Cần sửa / Lưu trữ ({countReview})
              </button>
            </div>

            {/* Filter toolbar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm câu hỏi, chủ đề, tag..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-[#02101e] border border-[#0e3d54] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Grade filter */}
                <select
                  value={gradeFilter}
                  onChange={e => setGradeFilter(e.target.value)}
                  className="px-3 py-2 bg-[#02101e] border border-[#0e3d54] rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">Tất cả khối lớp</option>
                  {[6, 7, 8, 9, 10, 11, 12].map(g => (
                    <option key={g} value={String(g)}>Khối {g}</option>
                  ))}
                </select>

                {/* Subject filter */}
                <select
                  value={subjectFilter}
                  onChange={e => {
                    if (e.target.value === '__add_new__') {
                      handleRequestAddSubject(setSubjectFilter);
                    } else {
                      setSubjectFilter(e.target.value);
                    }
                  }}
                  className="px-3 py-2 bg-[#02101e] border border-[#0e3d54] rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">Tất cả môn học</option>
                  {subjectsList.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="__add_new__">+ Thêm môn học mới...</option>
                </select>

                {/* Question type filter */}
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-[#02101e] border border-[#0e3d54] rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">Tất cả 9 dạng câu hỏi</option>
                  <option value="single">Một đáp án (Pick One)</option>
                  <option value="multiple">Nhiều đáp án (Pick Many)</option>
                  <option value="true_false">Đúng / Sai từng ý</option>
                  <option value="fill">Điền vào chỗ trống</option>
                  <option value="matching">Ghép đôi hai cột</option>
                  <option value="ordering">Sắp xếp thứ tự</option>
                  <option value="short_essay">Trả lời ngắn</option>
                  <option value="essay">Tự luận kèm Rubric</option>
                  <option value="passage">Theo đoạn văn / Tình huống</option>
                </select>

                {/* Difficulty filter */}
                <select
                  value={difficultyFilter}
                  onChange={e => setDifficultyFilter(e.target.value)}
                  className="px-3 py-2 bg-[#02101e] border border-[#0e3d54] rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">Tất cả mức độ</option>
                  <option value="easy">Nhận biết</option>
                  <option value="medium">Thông hiểu</option>
                  <option value="hard">Vận dụng</option>
                  <option value="very_hard">Vận dụng cao</option>
                </select>
              </div>

              {/* Batch Actions Floating Toolbar */}
              {selectedQuestionIds.length > 0 && (
                <div className="flex items-center gap-2 shrink-0 bg-[#03172c] px-3.5 py-1.5 rounded-xl border border-cyan-500/50 shadow-md">
                  <span className="text-xs font-bold text-cyan-300">
                    Đã chọn {selectedQuestionIds.length} câu:
                  </span>
                  <button
                    type="button"
                    onClick={handleBatchApprove}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Duyệt nhanh
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      showToast(`Đã tạo Đề kiểm tra từ ${selectedQuestionIds.length} câu hỏi đã chọn!`, 'success');
                      setSelectedQuestionIds([]);
                    }}
                    className="px-2.5 py-1 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Tạo đề kiểm tra
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchDeleting(true)}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Questions Table */}
          <div className="bg-[#041527] rounded-2xl border border-[#0e3d54] overflow-hidden shadow-xl">
            <div className="overflow-x-auto custom-horizontal-scrollbar">
              <table className="w-full min-w-[1100px] text-left text-xs border-collapse">
                <thead className="bg-[#051c33] border-b border-[#0e3d54]">
                  <tr>
                    <th className="px-4 py-3.5 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedQuestionIds.length === filteredQuestions.length &&
                          filteredQuestions.length > 0
                        }
                        onChange={e => handleToggleSelectAll(e.target.checked)}
                        className="rounded border-slate-700 bg-[#02101e] text-cyan-500 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-3.5 w-14 text-center text-cyan-300 font-bold uppercase">STT</th>
                    <th className="px-5 py-3.5 min-w-[340px] text-cyan-300 font-bold uppercase">Nội dung câu hỏi</th>
                    <th className="px-4 py-3.5 min-w-[130px] text-cyan-300 font-bold uppercase">Môn / Khối</th>
                    <th className="px-4 py-3.5 min-w-[140px] text-cyan-300 font-bold uppercase">Dạng câu hỏi</th>
                    <th className="px-4 py-3.5 min-w-[110px] text-cyan-300 font-bold uppercase">Mức độ</th>
                    <th className="px-4 py-3.5 min-w-[120px] text-cyan-300 font-bold uppercase">Trạng thái</th>
                    <th className="sticky right-0 z-30 bg-[#051c33] border-l border-[#0e3d54] shadow-[-8px_0_12px_rgba(2,15,28,0.85)] px-4 py-3.5 text-center text-cyan-300 font-bold uppercase w-[145px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0e3d54]/60">
                  {filteredQuestions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-14 text-center text-slate-400">
                        <div className="max-w-sm mx-auto space-y-2">
                          <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
                          <div className="font-bold text-white text-sm">Không tìm thấy câu hỏi nào phù hợp</div>
                          <p className="text-xs text-slate-400">
                            Hãy thử xóa bộ lọc tìm kiếm hoặc sử dụng các tab bên trên để import hoặc tạo câu hỏi mới bằng AI.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredQuestions.map((q, idx) => {
                      const status = q.status || 'approved';
                      const isSelected = selectedQuestionIds.includes(q.id);

                      return (
                        <tr key={q.id} className="hover:bg-[#062440] transition-colors group">
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOne(q.id)}
                              className="rounded border-slate-700 bg-[#02101e] text-cyan-500 focus:ring-0 cursor-pointer"
                            />
                          </td>

                          <td className="px-3 py-3 text-center font-bold text-slate-400 tabular-nums">
                            {idx + 1}
                          </td>

                          <td className="px-5 py-3 text-white font-medium max-w-md">
                            <div className="line-clamp-2" title={q.content}>
                              {q.content}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                              <span className="text-cyan-300 font-semibold truncate max-w-[200px]">
                                Chủ đề: {q.topic}
                              </span>
                              {q.tags && q.tags.map((t, ti) => (
                                <span
                                  key={ti}
                                  className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]"
                                >
                                  {t}
                                </span>
                              ))}
                              {q.aiSuggested && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">
                                  AI Tạo
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-bold text-cyan-300">{q.subject}</div>
                            <div className="text-[11px] text-slate-400">Khối {q.grade}</div>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-semibold text-[11px]">
                              {q.type === 'single'
                                ? 'Một đáp án'
                                : q.type === 'multiple'
                                ? 'Nhiều đáp án'
                                : q.type === 'true_false'
                                ? 'Đúng/Sai'
                                : q.type === 'fill'
                                ? 'Điền khuyết'
                                : q.type === 'short_essay'
                                ? 'Trả lời ngắn'
                                : q.type === 'matching'
                                ? 'Ghép đôi'
                                : q.type === 'ordering'
                                ? 'Sắp xếp'
                                : q.type === 'essay'
                                ? 'Tự luận'
                                : 'Theo ngữ cảnh'}
                            </span>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                q.difficulty === 'easy'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : q.difficulty === 'medium'
                                  ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                  : 'bg-purple-950 text-purple-300 border border-purple-800'
                              }`}
                            >
                              {q.difficulty === 'easy'
                                ? 'Nhận biết'
                                : q.difficulty === 'medium'
                                ? 'Thông hiểu'
                                : q.difficulty === 'hard'
                                ? 'Vận dụng'
                                : 'Vận dụng cao'}
                            </span>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            {status === 'approved' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Đã duyệt
                              </span>
                            ) : status === 'pending_review' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                Chờ duyệt
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                                Bản nháp
                              </span>
                            )}
                          </td>

                          {/* Actions column */}
                          <td className="sticky right-0 z-20 bg-[#041527] group-hover:bg-[#062440] border-l border-[#0e3d54] shadow-[-8px_0_12px_rgba(2,15,28,0.85)] px-3 py-3 text-center whitespace-nowrap w-[145px]">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setViewingQuestion(q)}
                                className="w-8 h-8 rounded-lg bg-[#031c33] hover:bg-[#073259] text-cyan-300 border border-[#0e3d54] flex items-center justify-center transition-all cursor-pointer shadow-xs"
                                title="Xem chi tiết & đáp án"
                              >
                                <Eye className="w-4 h-4 text-cyan-400" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingQuestion(q)}
                                className="w-8 h-8 rounded-lg bg-[#031c33] hover:bg-[#073259] text-sky-400 border border-[#0e3d54] flex items-center justify-center transition-all cursor-pointer shadow-xs"
                                title="Chỉnh sửa câu hỏi"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {status !== 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveQuestion(q.id)}
                                  className="w-8 h-8 rounded-lg bg-[#031c33] hover:bg-emerald-950 text-emerald-400 border border-[#0e3d54] flex items-center justify-center transition-all cursor-pointer shadow-xs"
                                  title="Phê duyệt nhanh"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setDeletingQuestionId(q.id)}
                                className="w-8 h-8 rounded-lg bg-[#031c33] hover:bg-rose-950 text-rose-400 border border-[#0e3d54] flex items-center justify-center transition-all cursor-pointer shadow-xs"
                                title="Xóa câu hỏi"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW QUESTION DETAIL */}
      <QuestionDetailModal
        question={viewingQuestion}
        onClose={() => setViewingQuestion(null)}
        onApprove={handleApproveQuestion}
        onEdit={q => {
          setViewingQuestion(null);
          setEditingQuestion(q);
        }}
      />

      {/* MODAL: EDIT QUESTION */}
      <EditQuestionModal
        question={editingQuestion}
        onClose={() => setEditingQuestion(null)}
        onSave={handleUpdateQuestion}
        subjectsList={subjectsList}
      />

      {/* MODAL: DELETE CONFIRMATION */}
      {deletingQuestionId && (
        <Modal
          isOpen={!!deletingQuestionId}
          onClose={() => setDeletingQuestionId(null)}
          title="Xác nhận xóa câu hỏi"
          maxWidth="sm"
        >
          <div className="p-6 space-y-4 text-xs">
            <p className="text-slate-300">
              Bạn có chắc chắn muốn xóa câu hỏi này khỏi Ngân hàng? Thao tác này sẽ loại bỏ câu hỏi khỏi các đề thi mới trong tương lai.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingQuestionId(null)}
                className="px-4 py-2 bg-[#02101e] text-slate-300 rounded-xl font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleDeleteOne(deletingQuestionId)}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-500 cursor-pointer shadow-md"
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: BATCH DELETE CONFIRMATION */}
      {batchDeleting && (
        <Modal
          isOpen={batchDeleting}
          onClose={() => setBatchDeleting(false)}
          title="Xác nhận xóa hàng loạt câu hỏi"
          maxWidth="sm"
        >
          <div className="p-6 space-y-4 text-xs">
            <p className="text-slate-300">
              Bạn có chắc chắn muốn xóa <strong>{selectedQuestionIds.length}</strong> câu hỏi đã chọn khỏi Ngân hàng?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBatchDeleting(false)}
                className="px-4 py-2 bg-[#02101e] text-slate-300 rounded-xl font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleBatchDelete}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-500 cursor-pointer shadow-md"
              >
                Xác nhận Xóa toàn bộ
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: ADD SUBJECT */}
      <Modal
        isOpen={isAddSubjectModalOpen}
        onClose={() => setIsAddSubjectModalOpen(false)}
        title="Thêm môn học mới"
        subtitle="Nhập tên môn học để bổ sung vào danh mục hệ thống"
        maxWidth="sm"
      >
        <div className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Tên môn học mới:</label>
            <input
              type="text"
              placeholder="Ví dụ: Giáo dục Quốc phòng, Triết học..."
              value={newSubjectInput}
              onChange={e => setNewSubjectInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleConfirmAddSubject();
              }}
              autoFocus
              className="w-full bg-[#02101e] border border-[#0e3d54] rounded-xl p-2.5 text-white focus:border-cyan-400 focus:outline-none text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddSubjectModalOpen(false)}
              className="px-4 py-2 bg-[#03172c] hover:bg-[#07243e] text-slate-300 border border-[#0e3d54] rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleConfirmAddSubject}
              className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-bold shadow-md cursor-pointer"
            >
              Thêm môn học
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
