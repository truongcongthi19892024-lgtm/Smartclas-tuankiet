import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  FileCode,
  Download,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  Eye,
  Check,
  X,
  RefreshCw,
  Layers,
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Question, QuestionType } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface ImportTabProps {
  existingQuestions: Question[];
  onImportSuccess: (questions: Question[]) => void;
  onCancel: () => void;
  subjectsList: string[];
}

interface ParsedQuestionItem {
  id: string;
  subject: string;
  grade: number;
  topic: string;
  type: QuestionType | string;
  content: string;
  options: { id: string; text: string }[];
  correctAnswer: string | string[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard';
  tags: string[];
  status: 'approved' | 'pending_review' | 'draft';
  isDuplicate?: boolean;
  duplicateWithId?: string;
  similarityNote?: string;
  isValid: boolean;
  validationError?: string;
  selected: boolean;
}

export const ImportTab: React.FC<ImportTabProps> = ({
  existingQuestions,
  onImportSuccess,
  onCancel,
  subjectsList,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestionItem[]>([]);
  const [activeStep, setActiveStep] = useState<'upload' | 'preview'>('upload');
  const [editingItem, setEditingItem] = useState<ParsedQuestionItem | null>(null);

  // Normalize Unicode and string helper for duplicate detection
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Download Sample Excel Template
  const handleDownloadExcelTemplate = () => {
    try {
      const templateData = [
        {
          'Môn học': 'Toán học',
          'Khối': 10,
          'Chủ đề': 'Hàm số bậc hai',
          'Dạng câu hỏi': 'single',
          'Nội dung câu hỏi': 'Tọa độ đỉnh của parabol y = x² - 2x + 3 là:',
          'Lựa chọn A': 'I(1; 2)',
          'Lựa chọn B': 'I(-1; 6)',
          'Lựa chọn C': 'I(2; 3)',
          'Lựa chọn D': 'I(1; -2)',
          'Đáp án đúng': 'A',
          'Lời giải chi tiết': 'Hoành độ x = -b/2a = 1, tung độ y = 1 - 2 + 3 = 2. Vậy đỉnh I(1; 2).',
          'Mức độ': 'easy',
          'Thẻ tag': 'Đại số, Khối 10, Parabol',
        },
        {
          'Môn học': 'Toán học',
          'Khối': 10,
          'Chủ đề': 'Hàm số bậc hai',
          'Dạng câu hỏi': 'multiple',
          'Nội dung câu hỏi': 'Chọn các mệnh đề ĐÚNG về đồ thị hàm số y = ax² + bx + c (a ≠ 0):',
          'Lựa chọn A': 'Đồ thị là một đường cong parabol đối xứng qua trục x = -b/(2a).',
          'Lựa chọn B': 'Khi a > 0 bề lõm parabol quay lên trên.',
          'Lựa chọn C': 'Khi a < 0 đồ thị luôn cắt trục hoành tại hai điểm phân biệt.',
          'Lựa chọn D': 'Tung độ đỉnh là y = -Δ/(4a).',
          'Đáp án đúng': 'A, B, D',
          'Lời giải chi tiết': 'Mệnh đề A, B, D là các tính chất cơ bản. C sai vì khi Δ < 0 parabol không cắt Ox.',
          'Mức độ': 'medium',
          'Thẻ tag': 'Tính chất, Khối 10',
        },
        {
          'Môn học': 'Vật lý',
          'Khối': 10,
          'Chủ đề': 'Động học chất điểm',
          'Dạng câu hỏi': 'true_false',
          'Nội dung câu hỏi': 'Xét tính Đúng / Sai của các khẳng định sau về chuyển động thẳng đều:',
          'Lựa chọn A': '1. Vận tốc tức thời không đổi theo thời gian.',
          'Lựa chọn B': '2. Gia tốc của vật luôn khác 0.',
          'Lựa chọn C': '3. Quãng đường đi được tỉ lệ thuận với thời gian chuyển động.',
          'Lựa chọn D': '4. Đồ thị vận tốc theo thời gian là đường parabol.',
          'Đáp án đúng': 'TRUE, FALSE, TRUE, FALSE',
          'Lời giải chi tiết': 'Ý 1 đúng; ý 2 sai vì a = 0; ý 3 đúng s = vt; ý 4 sai vì v-t là đường thẳng nằm ngang.',
          'Mức độ': 'medium',
          'Thẻ tag': 'Vật lý 10, Chuyển động thẳng đều',
        },
        {
          'Môn học': 'Tiếng Anh',
          'Khối': 10,
          'Chủ đề': 'Tenses',
          'Dạng câu hỏi': 'fill',
          'Nội dung câu hỏi': 'Điền dạng đúng của từ: By the time we arrived, they ......... (leave).',
          'Lựa chọn A': '',
          'Lựa chọn B': '',
          'Lựa chọn C': '',
          'Lựa chọn D': '',
          'Đáp án đúng': 'had left',
          'Lời giải chi tiết': 'Sử dụng thì quá khứ hoàn thành (Past Perfect) cho hành động xảy ra trước một thời điểm trong quá khứ.',
          'Mức độ': 'hard',
          'Thẻ tag': 'Grammar, Past Perfect',
        },
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Questions');

      // Auto width
      ws['!cols'] = [
        { wch: 12 },
        { wch: 8 },
        { wch: 20 },
        { wch: 14 },
        { wch: 45 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 40 },
        { wch: 12 },
        { wch: 25 },
      ];

      XLSX.writeFile(wb, 'Mau_Import_Ngan_Hang_Cau_Hoi_SmartClass.xlsx');
      showToast('Đã tải xuống template Excel chuẩn (Questions_Template.xlsx)', 'success');
    } catch (e) {
      console.error(e);
      showToast('Không thể tạo file template Excel', 'error');
    }
  };

  // Download Sample Word Template (.txt / .docx convention)
  const handleDownloadWordTemplate = () => {
    const textContent = `QUY ƯỚC SOẠN THẢO FILE WORD / TEXT ĐỂ IMPORT CÂU HỎI VÀO SMART CLASS
=======================================================================
Cấu trúc mỗi câu hỏi bắt đầu bằng [Câu <số>] hoặc Câu <số>.:

[Câu 1]
Môn: Toán học
Khối: 10
Chủ đề: Hàm số bậc hai
Dạng: single
Mức độ: easy
Nội dung: Cho hàm số y = 2x² - 4x + 1. Tọa độ đỉnh của parabol là:
A. I(1; -1)
B. I(-1; 7)
C. I(2; 1)
D. I(1; 1)
Đáp án: A
Lời giải: Hoành độ đỉnh x = -(-4)/(2*2) = 1. Tung độ y = 2(1) - 4(1) + 1 = -1. Vậy I(1; -1).
Tag: Hàm số, Khối 10

---

[Câu 2]
Môn: Vật lý
Khối: 10
Chủ đề: Động học
Dạng: single
Mức độ: medium
Nội dung: Công thức tính quãng đường trong chuyển động thẳng biến đổi đều là:
A. s = v₀t + 0.5at²
B. s = v₀t - at
C. s = vt
D. s = 2at²
Đáp án: A
Lời giải: Công thức chuẩn theo SGK: s = v₀t + 0.5at².
Tag: Chuyển động thẳng, Vật lý 10
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mau_Quy_Uoc_Word_Cau_Hoi_SmartClass.txt';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file mẫu Word quy ước (Word_Template.txt)', 'success');
  };

  // Download Sample CSV
  const handleDownloadCSVTemplate = () => {
    const csvContent = `Môn học,Khối,Chủ đề,Dạng câu hỏi,Nội dung câu hỏi,Lựa chọn A,Lựa chọn B,Lựa chọn C,Lựa chọn D,Đáp án đúng,Lời giải chi tiết,Mức độ,Thẻ tag
Toán học,10,Mệnh đề,single,Mệnh đề nào sau đây phủ định của mệnh đề "∀x ∈ ℝ: x² > 0"?,∃x ∈ ℝ: x² ≤ 0,∀x ∈ ℝ: x² < 0,∃x ∈ ℝ: x² > 0,∀x ∈ ℝ: x² ≤ 0,A,Phủ định của ∀ là ∃ và phủ định của > là ≤,medium,Mệnh đề`;
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mau_Import_CSV_SmartClass.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống template CSV UTF-8', 'success');
  };

  // Parse text / word format
  const parseWordTextFormat = (rawText: string): ParsedQuestionItem[] => {
    const questions: ParsedQuestionItem[] = [];
    const blocks = rawText.split(/(?:\[Câu\s*\d+\]|Câu\s*\d+[:.])/i).filter(b => b.trim());

    blocks.forEach((block, index) => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) return;

      let subject = 'Toán học';
      let grade = 10;
      let topic = 'Chủ đề chung';
      let type: QuestionType = 'single';
      let difficulty: 'easy' | 'medium' | 'hard' | 'very_hard' = 'medium';
      let content = '';
      const options: { id: string; text: string }[] = [];
      let correctAnswer = 'A';
      let explanation = '';
      const tags: string[] = [];

      let contentLines: string[] = [];
      let readingContent = false;
      let readingExplanation = false;

      for (const line of lines) {
        if (/^Môn[:\s]/i.test(line)) {
          subject = line.replace(/^Môn[:\s]*/i, '').trim() || subject;
          readingContent = false;
        } else if (/^Khối[:\s]/i.test(line)) {
          const num = parseInt(line.replace(/^Khối[:\s]*/i, ''), 10);
          if (!isNaN(num)) grade = num;
          readingContent = false;
        } else if (/^Chủ đề[:\s]/i.test(line)) {
          topic = line.replace(/^Chủ đề[:\s]*/i, '').trim() || topic;
          readingContent = false;
        } else if (/^Dạng[:\s]/i.test(line)) {
          const val = line.replace(/^Dạng[:\s]*/i, '').trim().toLowerCase();
          if (['single', 'multiple', 'true_false', 'fill', 'short_essay', 'matching', 'essay'].includes(val)) {
            type = val as any;
          }
          readingContent = false;
        } else if (/^Mức độ[:\s]/i.test(line)) {
          const val = line.replace(/^Mức độ[:\s]*/i, '').trim().toLowerCase();
          if (['easy', 'medium', 'hard', 'very_hard'].includes(val)) {
            difficulty = val as any;
          }
          readingContent = false;
        } else if (/^Nội dung[:\s]/i.test(line)) {
          contentLines.push(line.replace(/^Nội dung[:\s]*/i, '').trim());
          readingContent = true;
          readingExplanation = false;
        } else if (/^[A-D][.:\)]\s/i.test(line)) {
          readingContent = false;
          readingExplanation = false;
          const optId = line.charAt(0).toUpperCase();
          const optText = line.substring(2).trim();
          options.push({ id: optId, text: optText });
        } else if (/^Đáp án[:\s]/i.test(line)) {
          readingContent = false;
          readingExplanation = false;
          correctAnswer = line.replace(/^Đáp án[:\s]*/i, '').trim();
        } else if (/^Lời giải[:\s]/i.test(line)) {
          readingContent = false;
          readingExplanation = true;
          explanation = line.replace(/^Lời giải[:\s]*/i, '').trim();
        } else if (/^Tag[:\s]/i.test(line)) {
          readingContent = false;
          readingExplanation = false;
          const rawTags = line.replace(/^Tag[:\s]*/i, '').split(',');
          tags.push(...rawTags.map(t => t.trim()).filter(Boolean));
        } else {
          if (readingContent) contentLines.push(line);
          else if (readingExplanation) explanation += ' ' + line;
        }
      }

      content = contentLines.join(' ').trim();
      if (!content && lines.length > 0) {
        content = lines[0];
      }

      const isValid = Boolean(content && (type !== 'single' || options.length >= 2));
      const validationError = !content
        ? 'Thiếu nội dung câu hỏi'
        : type === 'single' && options.length < 2
        ? 'Dạng một đáp án cần ít nhất 2 lựa chọn (A, B...)'
        : undefined;

      // Duplicate check
      const normalizedContent = normalizeText(content);
      const duplicateFound = existingQuestions.find(
        eq => normalizeText(eq.content) === normalizedContent || (eq.content.length > 20 && normalizeText(eq.content).includes(normalizedContent))
      );

      questions.push({
        id: `import_${Date.now()}_${index}`,
        subject,
        grade,
        topic,
        type,
        content,
        options,
        correctAnswer,
        explanation: explanation || 'Lời giải chi tiết từ file import.',
        difficulty,
        tags: tags.length > 0 ? tags : [subject, `Khối ${grade}`],
        status: 'approved',
        isDuplicate: Boolean(duplicateFound),
        duplicateWithId: duplicateFound?.id,
        similarityNote: duplicateFound ? `Trùng với câu trong ngân hàng: "${duplicateFound.content.slice(0, 40)}..."` : undefined,
        isValid,
        validationError,
        selected: isValid && !duplicateFound,
      });
    });

    return questions;
  };

  // Parse Excel / CSV workbook
  const parseExcelOrCSV = (workbook: XLSX.WorkBook): ParsedQuestionItem[] => {
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

    const questions: ParsedQuestionItem[] = [];

    rows.forEach((row, idx) => {
      // Find key flexibly
      const getKey = (possibleNames: string[]) => {
        for (const name of possibleNames) {
          for (const key of Object.keys(row)) {
            if (key.trim().toLowerCase() === name.toLowerCase()) {
              return row[key];
            }
          }
        }
        return '';
      };

      const content = String(getKey(['Nội dung câu hỏi', 'Nội dung', 'Content', 'Question', 'Cau hoi']) || '').trim();
      const subject = String(getKey(['Môn học', 'Môn', 'Subject']) || 'Toán học').trim();
      const grade = parseInt(String(getKey(['Khối', 'Khối lớp', 'Grade']) || '10'), 10) || 10;
      const topic = String(getKey(['Chủ đề', 'Topic', 'Chương']) || 'Chủ đề bài học').trim();
      const typeRaw = String(getKey(['Dạng câu hỏi', 'Dạng', 'Type']) || 'single').trim().toLowerCase();
      const type: QuestionType = ['single', 'multiple', 'true_false', 'fill', 'short_essay', 'matching', 'essay'].includes(typeRaw)
        ? (typeRaw as QuestionType)
        : 'single';

      const optA = String(getKey(['Lựa chọn A', 'A', 'Option A']) || '').trim();
      const optB = String(getKey(['Lựa chọn B', 'B', 'Option B']) || '').trim();
      const optC = String(getKey(['Lựa chọn C', 'C', 'Option C']) || '').trim();
      const optD = String(getKey(['Lựa chọn D', 'D', 'Option D']) || '').trim();

      const options: { id: string; text: string }[] = [];
      if (optA) options.push({ id: 'A', text: optA });
      if (optB) options.push({ id: 'B', text: optB });
      if (optC) options.push({ id: 'C', text: optC });
      if (optD) options.push({ id: 'D', text: optD });

      const correctAnswer = String(getKey(['Đáp án đúng', 'Đáp án', 'Answer', 'Correct Answer']) || 'A').trim();
      const explanation = String(getKey(['Lời giải chi tiết', 'Lời giải', 'Explanation', 'Giai thich']) || 'Lời giải chi tiết từ file import.').trim();
      const diffRaw = String(getKey(['Mức độ', 'Difficulty', 'Muc do']) || 'medium').trim().toLowerCase();
      const difficulty: 'easy' | 'medium' | 'hard' | 'very_hard' = ['easy', 'medium', 'hard', 'very_hard'].includes(diffRaw)
        ? (diffRaw as any)
        : 'medium';

      const tagRaw = String(getKey(['Thẻ tag', 'Tags', 'Tag', 'Chu de']) || '').trim();
      const tags = tagRaw ? tagRaw.split(',').map(s => s.trim()).filter(Boolean) : [subject, `Khối ${grade}`];

      const isValid = Boolean(content && (type !== 'single' || options.length >= 2));
      const validationError = !content
        ? 'Thiếu nội dung câu hỏi'
        : type === 'single' && options.length < 2
        ? 'Dạng một đáp án cần tối thiểu 2 lựa chọn (A, B)'
        : undefined;

      // Duplicate check
      const normalizedContent = normalizeText(content);
      const duplicateFound = existingQuestions.find(
        eq => normalizeText(eq.content) === normalizedContent
      );

      questions.push({
        id: `import_row_${Date.now()}_${idx}`,
        subject,
        grade,
        topic,
        type,
        content,
        options,
        correctAnswer,
        explanation,
        difficulty,
        tags,
        status: 'approved',
        isDuplicate: Boolean(duplicateFound),
        duplicateWithId: duplicateFound?.id,
        similarityNote: duplicateFound ? `Trùng với câu đã có sẵn: "${duplicateFound.content.slice(0, 45)}..."` : undefined,
        isValid,
        validationError,
        selected: isValid && !duplicateFound,
      });
    });

    return questions;
  };

  // Handle File Input Selection
  const handleProcessFile = async (file: File) => {
    setSelectedFile(file);
    setParsing(true);

    try {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const results = parseExcelOrCSV(workbook);

        if (results.length === 0) {
          showToast('File không chứa dữ liệu câu hỏi hoặc sai định dạng cột', 'warning');
        } else {
          setParsedQuestions(results);
          setActiveStep('preview');
          showToast(`Đã đọc thành công ${results.length} câu hỏi từ file!`, 'success');
        }
      } else if (fileName.endsWith('.txt') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        // Read text content
        const text = await file.text();
        const results = parseWordTextFormat(text);

        if (results.length === 0) {
          showToast('Không nhận diện được câu hỏi theo quy ước [Câu 1], [Câu 2]... Vui lòng xem file mẫu!', 'warning');
        } else {
          setParsedQuestions(results);
          setActiveStep('preview');
          showToast(`Đã nhận diện thành công ${results.length} câu hỏi từ tài liệu!`, 'success');
        }
      } else if (fileName.endsWith('.json')) {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        const list = Array.isArray(jsonData) ? jsonData : jsonData.questions || [];
        const results: ParsedQuestionItem[] = list.map((item: any, idx: number) => {
          const isValid = Boolean(item.content);
          return {
            id: `json_${Date.now()}_${idx}`,
            subject: item.subject || 'Toán học',
            grade: Number(item.grade) || 10,
            topic: item.topic || 'Chủ đề chung',
            type: item.type || 'single',
            content: item.content || '',
            options: item.options || [],
            correctAnswer: item.correctAnswer || 'A',
            explanation: item.explanation || '',
            difficulty: item.difficulty || 'medium',
            tags: item.tags || [],
            status: 'approved',
            isValid,
            selected: isValid,
          };
        });
        setParsedQuestions(results);
        setActiveStep('preview');
        showToast(`Đã đọc ${results.length} câu hỏi từ file JSON!`, 'success');
      } else {
        showToast('Định dạng file không được hỗ trợ. Vui lòng chọn .xlsx, .csv, .docx hoặc .txt', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Lỗi khi đọc file: ${err.message || 'File hỏng hoặc không đúng định dạng'}`, 'error');
    } finally {
      setParsing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setParsedQuestions(prev =>
      prev.map(q => (q.isValid ? { ...q, selected: checked } : q))
    );
  };

  const handleToggleSelectOne = (id: string) => {
    setParsedQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, selected: !q.selected } : q))
    );
  };

  const handleDeleteParsedItem = (id: string) => {
    setParsedQuestions(prev => prev.filter(q => q.id !== id));
    showToast('Đã bỏ bớt 1 câu hỏi khỏi danh sách import', 'info');
  };

  const handleSaveEditInline = (updated: ParsedQuestionItem) => {
    setParsedQuestions(prev =>
      prev.map(q => (q.id === updated.id ? { ...updated, isValid: true, validationError: undefined } : q))
    );
    setEditingItem(null);
    showToast('Đã cập nhật câu hỏi thành công', 'success');
  };

  const handleConfirmImport = () => {
    const selectedToImport = parsedQuestions.filter(q => q.selected && q.isValid);
    if (selectedToImport.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 câu hỏi hợp lệ để nạp vào ngân hàng', 'warning');
      return;
    }

    const finalQuestions: Question[] = selectedToImport.map(item => ({
      id: `q_import_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      subject: item.subject,
      grade: item.grade,
      topic: item.topic,
      type: item.type,
      content: item.content,
      options: item.options.length > 0 ? item.options : undefined,
      correctAnswer: item.correctAnswer,
      explanation: item.explanation,
      difficulty: item.difficulty,
      tags: item.tags,
      status: 'approved',
      source: `Import từ file: ${selectedFile?.name || 'File tải lên'}`,
      createdAt: new Date().toISOString(),
    }));

    onImportSuccess(finalQuestions);
    showToast(`Đã import thành công ${finalQuestions.length} câu hỏi vào Ngân hàng!`, 'success');
  };

  const validCount = parsedQuestions.filter(q => q.isValid).length;
  const invalidCount = parsedQuestions.filter(q => !q.isValid).length;
  const duplicateCount = parsedQuestions.filter(q => q.isDuplicate).length;
  const selectedCount = parsedQuestions.filter(q => q.selected && q.isValid).length;

  return (
    <div className="space-y-6">
      {/* Step 1: Upload Zone and Template Downloads */}
      {activeStep === 'upload' && (
        <div className="space-y-6 max-w-4xl mx-auto py-2">
          {/* Header Description */}
          <div className="bg-[#03172c] border border-[#0e3d54] p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-base font-bold text-white">TAB 1: Nhập câu hỏi bằng cách IMPORT (Word / Excel / CSV)</h3>
              </div>
              <p className="text-xs text-slate-400">
                Tải mẫu định dạng chuẩn, tải file câu hỏi lên hệ thống. Tự động kiểm tra Unicode, validate cấu trúc đáp án và phát hiện câu trùng lặp.
              </p>
            </div>

            {/* Template Buttons */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadExcelTemplate}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Tải Template Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadWordTemplate}
                className="px-3.5 py-2 bg-[#041527] hover:bg-[#072540] border border-[#0e3d54] text-cyan-300 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Mẫu Word (.docx/.txt)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCSVTemplate}
                className="px-3 py-2 bg-[#041527] hover:bg-[#072540] border border-[#0e3d54] text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileCode className="w-4 h-4 text-slate-400" />
                <span>Mẫu CSV</span>
              </button>
            </div>
          </div>

          {/* Upload Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-cyan-400 bg-cyan-950/20'
                : 'border-[#0e3d54] hover:border-cyan-500/70 bg-[#02101e]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.docx,.doc,.txt,.json"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFile(e.target.files[0]);
                }
              }}
            />

            <div className="max-w-md mx-auto space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#041527] border border-[#0e3d54] flex items-center justify-center mx-auto shadow-inner text-cyan-400">
                {parsing ? (
                  <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                ) : (
                  <Upload className="w-8 h-8 text-cyan-400" />
                )}
              </div>

              <div>
                <h4 className="text-white font-bold text-sm">
                  {parsing ? 'Đang đọc và phân tích file...' : 'Kéo thả file vào đây hoặc nhấp để chọn file'}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Hỗ trợ định dạng: <strong>.xlsx, .xls, .csv, .docx, .txt, .json</strong> (tối đa 25MB)
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#03172c] border border-[#0e3d54] text-[11px] text-cyan-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tự động nhận diện môn, khối, dạng câu hỏi, đáp án đúng và lời giải</span>
              </div>
            </div>
          </div>

          {/* Instruction Guide Card */}
          <div className="bg-[#03172c] border border-[#0e3d54] p-4 rounded-xl text-xs space-y-2 text-slate-300">
            <h5 className="font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>Gợi ý chuẩn bị file để import đạt tỷ lệ chính xác 100%:</span>
            </h5>
            <ul className="list-disc list-inside space-y-1 text-slate-400 ml-1">
              <li><strong>Excel / CSV:</strong> Đặt tên cột theo mẫu: Môn học, Khối, Chủ đề, Dạng câu hỏi, Nội dung câu hỏi, Lựa chọn A/B/C/D, Đáp án đúng, Lời giải chi tiết.</li>
              <li><strong>Word / Text:</strong> Mỗi câu hỏi bắt đầu bằng <code>[Câu 1]</code> hoặc <code>Câu 1:</code>, các đáp án <code>A. B. C. D.</code>, đáp án đúng <code>Đáp án: A</code>.</li>
              <li>Hệ thống hỗ trợ công thức Toán LaTeX (đặt trong dấu <code>$...$</code> hoặc <code>$$...$$</code>) bảo toàn nguyên vẹn.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step 2: Preview, Validate, Duplicate Filter & Confirm */}
      {activeStep === 'preview' && (
        <div className="space-y-4">
          {/* Top Status & Action Bar */}
          <div className="bg-[#03172c] border border-[#0e3d54] p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">File đang nạp:</span>
                <span className="text-sm font-bold text-cyan-300">📄 {selectedFile?.name}</span>
                <span className="text-xs text-slate-500">({((selectedFile?.size || 0) / 1024).toFixed(1)} KB)</span>
              </div>

              {/* KPI Badges */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-[#02101e] border border-[#0e3d54] text-slate-300">
                  Tổng nhận diện: <strong className="text-white">{parsedQuestions.length}</strong> câu
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-emerald-300">
                  Hợp lệ: <strong>{validCount}</strong>
                </span>
                {invalidCount > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-950/50 border border-rose-800/60 text-rose-300">
                    Lỗi định dạng: <strong>{invalidCount}</strong>
                  </span>
                )}
                {duplicateCount > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-950/50 border border-amber-800/60 text-amber-300">
                    Phát hiện trùng: <strong>{duplicateCount}</strong>
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-lg bg-cyan-950/50 border border-cyan-800/60 text-cyan-300 font-bold">
                  Sẽ nạp: {selectedCount} câu
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveStep('upload');
                  setParsedQuestions([]);
                  setSelectedFile(null);
                }}
                className="px-3.5 py-2 bg-[#02101e] hover:bg-[#07243e] border border-[#0e3d54] text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Chọn file khác
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={selectedCount === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                <span>Xác nhận nạp {selectedCount} câu vào Ngân hàng</span>
              </button>
            </div>
          </div>

          {/* Interactive Questions Table */}
          <div className="bg-[#041527] rounded-2xl border border-[#0e3d54] overflow-hidden shadow-xl">
            <div className="overflow-x-auto custom-horizontal-scrollbar">
              <table className="w-full min-w-[950px] text-left text-xs border-collapse">
                <thead className="bg-[#051c33] border-b border-[#0e3d54]">
                  <tr>
                    <th className="px-4 py-3.5 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectedCount === validCount && validCount > 0}
                        onChange={e => handleToggleSelectAll(e.target.checked)}
                        className="rounded border-slate-700 bg-[#02101e] text-cyan-500 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-3.5 w-14 text-center text-cyan-300 font-bold uppercase">STT</th>
                    <th className="px-4 py-3.5 min-w-[280px] text-cyan-300 font-bold uppercase">Nội dung câu hỏi & Lựa chọn</th>
                    <th className="px-3 py-3.5 min-w-[130px] text-cyan-300 font-bold uppercase">Môn / Khối</th>
                    <th className="px-3 py-3.5 min-w-[120px] text-cyan-300 font-bold uppercase">Dạng / Mức độ</th>
                    <th className="px-3 py-3.5 min-w-[110px] text-cyan-300 font-bold uppercase">Đáp án đúng</th>
                    <th className="px-3 py-3.5 min-w-[130px] text-cyan-300 font-bold uppercase">Kiểm tra</th>
                    <th className="px-3 py-3.5 w-20 text-center text-cyan-300 font-bold uppercase">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0e3d54]/60">
                  {parsedQuestions.map((q, idx) => (
                    <tr
                      key={q.id}
                      className={`hover:bg-[#062440] transition-colors ${
                        !q.isValid ? 'bg-rose-950/10' : q.isDuplicate ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={q.selected}
                          disabled={!q.isValid}
                          onChange={() => handleToggleSelectOne(q.id)}
                          className="rounded border-slate-700 bg-[#02101e] text-cyan-500 focus:ring-0 cursor-pointer disabled:opacity-40"
                        />
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-slate-400 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white line-clamp-2" title={q.content}>
                          {q.content}
                        </div>

                        {/* Options preview */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-2 gap-1 mt-1.5">
                            {q.options.map(opt => (
                              <div
                                key={opt.id}
                                className={`text-[11px] px-2 py-0.5 rounded border truncate ${
                                  opt.id === q.correctAnswer
                                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                                    : 'bg-[#02101e] border-[#0e3d54] text-slate-300'
                                }`}
                              >
                                <strong>{opt.id}.</strong> {opt.text}
                              </div>
                            ))}
                          </div>
                        )}

                        {q.explanation && (
                          <div className="text-[11px] text-slate-400 mt-1 truncate">
                            <span className="text-cyan-400 font-semibold">Lời giải:</span> {q.explanation}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="font-bold text-cyan-300">{q.subject}</div>
                        <div className="text-[11px] text-slate-400">Khối {q.grade}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{q.topic}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-semibold text-[11px] inline-block mb-1">
                          {q.type === 'single' ? 'Một đáp án' : q.type === 'multiple' ? 'Nhiều đáp án' : q.type === 'true_false' ? 'Đúng/Sai' : q.type === 'fill' ? 'Điền khuyết' : q.type}
                        </div>
                        <div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              q.difficulty === 'easy'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : q.difficulty === 'medium'
                                ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                : 'bg-purple-950 text-purple-300 border border-purple-800'
                            }`}
                          >
                            {q.difficulty === 'easy' ? 'Nhận biết' : q.difficulty === 'medium' ? 'Thông hiểu' : 'Vận dụng'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold rounded-lg text-xs">
                          {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {q.isValid ? (
                          q.isDuplicate ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 bg-amber-950/70 border border-amber-800 px-2 py-0.5 rounded" title={q.similarityNote}>
                              <AlertCircle className="w-3 h-3 text-amber-400" />
                              <span>Trùng lặp</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Hợp lệ</span>
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-300 bg-rose-950/70 border border-rose-800 px-2 py-0.5 rounded" title={q.validationError}>
                            <X className="w-3 h-3 text-rose-400" />
                            <span>{q.validationError}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteParsedItem(q.id)}
                          className="w-7 h-7 rounded-lg bg-[#031c33] hover:bg-rose-950 text-rose-400 border border-[#0e3d54] flex items-center justify-center transition-colors cursor-pointer mx-auto"
                          title="Xóa câu này khỏi danh sách import"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
