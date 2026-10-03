import React, { useState, useMemo } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';

// ─── Mock Data ───────────────────────────────────────────────────────────────
let nextId = 13;

const INITIAL_QUESTION_BANK = [
  {
    questionId: 1,
    skillName: 'React',
    questionText: 'Explain how React Fiber reconciliation works and why it was introduced.',
    category: 'Frontend',
    difficulty: 'HARD',
    isActive: true,
    sampleAnswer:
      'React Fiber is a reimplementation of the reconciliation algorithm that enables incremental rendering. It splits work into units and can pause, abort, or reuse work, which allows the browser to remain responsive. It was introduced to support features like Suspense and concurrent rendering.',
  },
  {
    questionId: 2,
    skillName: 'Java Spring Boot',
    questionText:
      'What is the difference between @Component, @Service, and @Repository annotations in Spring?',
    category: 'Backend',
    difficulty: 'MEDIUM',
    isActive: true,
    sampleAnswer:
      'All three are specializations of @Component and used for auto-detection. @Service marks business logic, @Repository marks persistence layer (adds exception translation), and @Component is a generic stereotype.',
  },
  {
    questionId: 3,
    skillName: 'System Design',
    questionText:
      'Design a URL shortening service that can handle 1 billion URLs and 100K reads/second.',
    category: 'System Design',
    difficulty: 'HARD',
    isActive: true,
    sampleAnswer:
      'Key aspects: use Base62 encoding, distributed ID generation (Snowflake), cache hot URLs in Redis, consistent hashing for sharding, CDN for global reads, and async analytics pipeline.',
  },
  {
    questionId: 4,
    skillName: 'SQL / PostgreSQL',
    questionText: 'What is the difference between INNER JOIN and LEFT JOIN? Provide an example.',
    category: 'Database',
    difficulty: 'EASY',
    isActive: true,
    sampleAnswer:
      'INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all rows from the left table and matched rows from the right (NULLs where no match). Example: SELECT * FROM users LEFT JOIN orders ON users.id = orders.user_id returns all users even those with no orders.',
  },
  {
    questionId: 5,
    skillName: 'Python',
    questionText: 'What are Python generators and when should you use them over list comprehensions?',
    category: 'Backend',
    difficulty: 'MEDIUM',
    isActive: true,
    sampleAnswer:
      'Generators use `yield` to produce values lazily, consuming O(1) memory vs list comprehensions which materialize the full list. Use generators for large datasets, infinite sequences, or when you only need to iterate once.',
  },
  {
    questionId: 6,
    skillName: 'Docker / Kubernetes',
    questionText: 'Explain the difference between a Docker image and a Docker container.',
    category: 'DevOps',
    difficulty: 'EASY',
    isActive: true,
    sampleAnswer:
      'A Docker image is a read-only template with instructions to create a container. A container is a running instance of an image — a writable process with its own isolated filesystem, network, and process space.',
  },
  {
    questionId: 7,
    skillName: 'TypeScript',
    questionText: 'What is the difference between `interface` and `type` in TypeScript?',
    category: 'Frontend',
    difficulty: 'MEDIUM',
    isActive: true,
    sampleAnswer:
      'Both define shapes. Interfaces are extendable (via extends/implements) and declaration-merged. Types are more flexible (unions, intersections, mapped types). Prefer interface for object shapes, type for complex compositions.',
  },
  {
    questionId: 8,
    skillName: 'Machine Learning',
    questionText: 'What is the vanishing gradient problem and how can it be mitigated?',
    category: 'AI / ML',
    difficulty: 'HARD',
    isActive: false,
    sampleAnswer:
      'As gradients are backpropagated through many layers, they shrink exponentially toward zero, preventing early layers from learning. Mitigations: ReLU activations, batch normalization, residual connections (skip connections), proper weight initialization.',
  },
  {
    questionId: 9,
    skillName: 'Microservices',
    questionText:
      'What patterns do you use to handle distributed transactions in a microservices architecture?',
    category: 'System Design',
    difficulty: 'HARD',
    isActive: true,
    sampleAnswer:
      'Saga pattern (choreography or orchestration), 2-phase commit (not recommended for distributed), outbox pattern with CDC (Change Data Capture), and eventual consistency with compensating transactions.',
  },
  {
    questionId: 10,
    skillName: 'Git',
    questionText: 'What is the difference between `git rebase` and `git merge`?',
    category: 'DevOps',
    difficulty: 'EASY',
    isActive: true,
    sampleAnswer:
      'Merge creates a merge commit preserving full history. Rebase re-applies commits on top of another branch for a linear history. Rebase rewrites commits (do not rebase shared/public branches).',
  },
  {
    questionId: 11,
    skillName: 'React',
    questionText: 'When would you use `useCallback` vs `useMemo` and what problem do they solve?',
    category: 'Frontend',
    difficulty: 'MEDIUM',
    isActive: true,
    sampleAnswer:
      'Both memoize values to prevent unnecessary re-computation or re-renders. `useMemo` memoizes a computed value. `useCallback` memoizes a function reference. Use them when passing callbacks to child components wrapped in React.memo or as dependencies in useEffect.',
  },
  {
    questionId: 12,
    skillName: 'AWS / Cloud',
    questionText:
      'Explain the CAP theorem and how it applies when choosing a database for a distributed system.',
    category: 'System Design',
    difficulty: 'HARD',
    isActive: false,
    sampleAnswer:
      'CAP: you can only guarantee 2 of 3: Consistency, Availability, Partition tolerance. Since network partitions are inevitable, you choose CP (strong consistency, e.g. HBase) or AP (availability, eventual consistency, e.g. Cassandra) based on business requirements.',
  },
];

const DIFFICULTY_CONFIG = {
  EASY: {
    label: 'Easy',
    className: 'bg-[#8C9A84]/15 text-[#2D3A31] border-[#8C9A84]/30',
    icon: 'looks_one',
  },
  MEDIUM: {
    label: 'Medium',
    className: 'bg-[#C27B66]/12 text-[#C27B66] border-[#C27B66]/30',
    icon: 'looks_two',
  },
  HARD: {
    label: 'Hard',
    className: 'bg-[#2D3A31]/12 text-[#2D3A31] border-[#2D3A31]/20',
    icon: 'looks_3',
  },
};

const CATEGORIES = ['ALL', 'Frontend', 'Backend', 'Database', 'System Design', 'DevOps', 'AI / ML'];
const DIFFICULTIES = ['ALL', 'EASY', 'MEDIUM', 'HARD'];

// ─── Question Form Modal ──────────────────────────────────────────────────────
const BLANK_FORM = {
  skillName: '',
  category: 'Frontend',
  questionText: '',
  difficulty: 'MEDIUM',
  sampleAnswer: '',
  isActive: true,
};

function QuestionFormModal({ initial, onSave, onCancel }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(initial ? { ...initial } : { ...BLANK_FORM });
  const [errors, setErrors] = useState({});

  const set = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.skillName.trim()) e.skillName = 'Skill name is required';
    if (!form.questionText.trim()) e.questionText = 'Question text is required';
    if (!form.sampleAnswer.trim()) e.sampleAnswer = 'Sample answer is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (validate()) onSave(form);
  };

  const inputCls =
    'input-botanical w-full text-[13px] font-sans focus:outline-none px-4 py-2.5';
  const labelCls = 'block text-[11px] font-sans font-bold text-[#2D3A31]/50 uppercase tracking-wide mb-1.5';
  const errorCls = 'text-[11px] font-sans text-[#C27B66] mt-1';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qform-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#2D3A31]/20 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className="relative card-botanical w-full max-w-2xl max-h-[90vh] flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-[#E6E2DA] shrink-0">
          <div>
            <h2 id="qform-title" className="text-[19px] font-serif font-bold text-[#2D3A31]">
              {isEdit ? 'Edit Question' : 'Add New Question'}
            </h2>
            <p className="text-[12px] font-sans text-[#2D3A31]/50 mt-0.5">
              Fill in the fields below. All fields marked are required.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C9A84] hover:bg-[#2D3A31]/8 hover:text-[#2D3A31] transition-all duration-150"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
          {/* Row: Skill + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="qf-skill" className={labelCls}>
                Skill *
              </label>
              <input
                id="qf-skill"
                type="text"
                value={form.skillName}
                onChange={(e) => set('skillName', e.target.value)}
                placeholder="e.g. React, Java, Python..."
                className={inputCls}
              />
              {errors.skillName && <p className={errorCls}>{errors.skillName}</p>}
            </div>
            <div>
              <label htmlFor="qf-category" className={labelCls}>
                Category
              </label>
              <select
                id="qf-category"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className={inputCls}
              >
                {['Frontend', 'Backend', 'Database', 'System Design', 'DevOps', 'AI / ML', 'Other'].map(
                  (c) => <option key={c}>{c}</option>
                )}
              </select>
            </div>
          </div>

          {/* Question text */}
          <div>
            <label htmlFor="qf-text" className={labelCls}>
              Question *
            </label>
            <textarea
              id="qf-text"
              value={form.questionText}
              onChange={(e) => set('questionText', e.target.value)}
              placeholder="Write the interview question here..."
              rows={3}
              className={`${inputCls} resize-y rounded-2xl`}
            />
            {errors.questionText && <p className={errorCls}>{errors.questionText}</p>}
          </div>

          {/* Row: Difficulty + Active */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="qf-difficulty" className={labelCls}>
                Difficulty
              </label>
              <div className="flex gap-2">
                {['EASY', 'MEDIUM', 'HARD'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => set('difficulty', d)}
                    className={[
                      'flex-1 py-2 text-[11px] font-sans font-bold rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40',
                      form.difficulty === d
                        ? DIFFICULTY_CONFIG[d].className + ' shadow-soft'
                        : 'border-[#E6E2DA] text-[#2D3A31]/50 hover:border-[#8C9A84]',
                    ].join(' ')}
                    aria-pressed={form.difficulty === d}
                  >
                    {DIFFICULTY_CONFIG[d].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-end">
              <label className={labelCls}>Active Status</label>
              <button
                type="button"
                onClick={() => set('isActive', !form.isActive)}
                className={[
                  'flex items-center gap-3 px-4 py-2.5 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40 text-[12px] font-sans font-semibold',
                  form.isActive
                    ? 'bg-[#8C9A84]/15 text-[#2D3A31] border-[#8C9A84]/35'
                    : 'bg-[#DCCFC2]/30 text-[#2D3A31]/50 border-[#DCCFC2]',
                ].join(' ')}
                aria-pressed={form.isActive}
              >
                <span
                  className={[
                    'w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-colors duration-200',
                    form.isActive ? 'bg-[#8C9A84] border-[#8C9A84]' : 'bg-transparent border-[#DCCFC2]',
                  ].join(' ')}
                />
                {form.isActive ? 'Active — visible to system' : 'Inactive — hidden from use'}
              </button>
            </div>
          </div>

          {/* Sample answer */}
          <div>
            <label htmlFor="qf-answer" className={labelCls}>
              Sample Answer *
            </label>
            <textarea
              id="qf-answer"
              value={form.sampleAnswer}
              onChange={(e) => set('sampleAnswer', e.target.value)}
              placeholder="Provide a reference answer for AI scoring..."
              rows={4}
              className={`${inputCls} resize-y rounded-2xl`}
            />
            {errors.sampleAnswer && <p className={errorCls}>{errors.sampleAnswer}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-7 py-5 border-t border-[#E6E2DA] shrink-0">
          <button
            onClick={onCancel}
            className="btn-botanical-secondary flex-1 py-2.5 text-xs rounded-full"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-botanical-primary flex-1 py-2.5 text-xs rounded-full"
          >
            {isEdit ? 'Save Changes' : 'Add Question'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteConfirmModal({ question, onConfirm, onCancel }) {
  if (!question) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-[#2D3A31]/25 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative card-botanical max-w-md w-full p-7 flex flex-col items-center text-center gap-4 z-10">
        <div className="w-14 h-14 rounded-2xl bg-[#C27B66]/15 border border-[#C27B66]/25 flex items-center justify-center">
          <span className="material-symbols-outlined text-[28px] text-[#C27B66]">delete</span>
        </div>
        <div>
          <h2 className="text-[19px] font-serif font-bold text-[#2D3A31] mb-1">
            Delete Question?
          </h2>
          <p className="text-[13px] font-sans text-[#2D3A31]/65 leading-relaxed">
            This will permanently remove the question:{' '}
            <em className="text-[#2D3A31] font-medium not-italic">
              "{question.questionText.slice(0, 60)}…"
            </em>
          </p>
        </div>
        <div className="flex gap-3 w-full mt-1">
          <button onClick={onCancel} className="btn-botanical-secondary flex-1 py-2.5 text-xs rounded-full">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(question.questionId)}
            className="flex-1 py-2.5 text-xs font-sans font-bold rounded-full bg-[#C27B66] text-white hover:bg-[#b06b59] transition-all duration-300 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#C27B66]/50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminQuestionBankPage() {
  const [questions, setQuestions] = useState(INITIAL_QUESTION_BANK);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [editingQuestion, setEditingQuestion] = useState(null); // null | question object
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // ── Filtered list ──
  const filteredQuestions = useMemo(() => {
    const q = search.toLowerCase().trim();
    return questions.filter((qn) => {
      const matchSearch =
        !q ||
        qn.questionText.toLowerCase().includes(q) ||
        qn.skillName.toLowerCase().includes(q) ||
        qn.category.toLowerCase().includes(q);
      const matchCat = categoryFilter === 'ALL' || qn.category === categoryFilter;
      const matchDiff = difficultyFilter === 'ALL' || qn.difficulty === difficultyFilter;
      const matchActive =
        activeFilter === 'ALL' ||
        (activeFilter === 'ACTIVE' && qn.isActive) ||
        (activeFilter === 'INACTIVE' && !qn.isActive);
      return matchSearch && matchCat && matchDiff && matchActive;
    });
  }, [questions, search, categoryFilter, difficultyFilter, activeFilter]);

  // ── CRUD handlers ──
  const handleAdd = (form) => {
    const newQ = { ...form, questionId: nextId++ };
    setQuestions((prev) => [newQ, ...prev]);
    setShowAddModal(false);
    showSuccess('Question added successfully.');
  };

  const handleEdit = (form) => {
    setQuestions((prev) =>
      prev.map((q) => (q.questionId === editingQuestion.questionId ? { ...q, ...form } : q))
    );
    setEditingQuestion(null);
    showSuccess('Question updated successfully.');
  };

  const handleDelete = (id) => {
    setQuestions((prev) => prev.filter((q) => q.questionId !== id));
    setDeleteTarget(null);
    showSuccess('Question deleted.');
  };

  const handleToggleActive = (id) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.questionId === id ? { ...q, isActive: !q.isActive } : q
      )
    );
  };

  const activeCount = questions.filter((q) => q.isActive).length;
  const inactiveCount = questions.filter((q) => !q.isActive).length;

  return (
    <div className="min-h-screen bg-[#F9F8F4] flex">
      <AdminSidebar
        activeSection="questions"
        onNavigate={(_, hash) => { window.location.hash = hash; }}
      />

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8 lg:py-10">

          {/* ── Page header ── */}
          <header className="mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[11px] font-sans font-bold text-[#8C9A84] uppercase tracking-widest mb-1">
                  Content Management · UC-34
                </p>
                <h1 className="text-[28px] lg:text-[34px] font-serif font-bold text-[#2D3A31] leading-tight tracking-tight">
                  Question Bank
                </h1>
                <p className="text-[14px] font-sans text-[#2D3A31]/60 mt-1.5">
                  Manage the AI interview question library — add, edit, activate, or remove questions.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Counters */}
                <span className="text-[11px] font-sans font-semibold px-3 py-1.5 rounded-full bg-[#8C9A84]/15 text-[#2D3A31] border border-[#8C9A84]/30">
                  {activeCount} Active
                </span>
                <span className="text-[11px] font-sans font-semibold px-3 py-1.5 rounded-full bg-[#DCCFC2]/50 text-[#2D3A31]/60 border border-[#DCCFC2]">
                  {inactiveCount} Inactive
                </span>
                {/* Add button */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-botanical-primary py-2.5 px-5 text-xs rounded-full flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Add Question
                </button>
              </div>
            </div>
          </header>

          {/* ── Success message ── */}
          {successMessage && (
            <div className="mb-4 flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#8C9A84]/15 border border-[#8C9A84]/30 text-[#2D3A31]">
              <span className="material-symbols-outlined text-[18px] text-[#8C9A84]">check_circle</span>
              <p className="text-[13px] font-sans font-semibold">{successMessage}</p>
            </div>
          )}

          {/* ── Filters toolbar ── */}
          <div className="space-y-3 mb-6">
            {/* Search */}
            <div className="relative max-w-md">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#8C9A84]">
                search
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by question, skill, or category..."
                className="input-botanical w-full pl-10 pr-4 py-2.5 text-[13px] font-sans focus:outline-none"
                aria-label="Search questions"
              />
            </div>

            {/* Filter pills row */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Category */}
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={[
                    'text-[11px] font-sans font-semibold px-3 py-1.5 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40',
                    categoryFilter === c
                      ? 'bg-[#2D3A31] text-white border-[#2D3A31]'
                      : 'text-[#2D3A31]/55 border-[#E6E2DA] hover:border-[#8C9A84] hover:text-[#2D3A31]',
                  ].join(' ')}
                  aria-pressed={categoryFilter === c}
                >
                  {c === 'ALL' ? 'All Categories' : c}
                </button>
              ))}

              {/* Divider */}
              <span className="w-px h-5 bg-[#E6E2DA] mx-1" />

              {/* Difficulty */}
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficultyFilter(d)}
                  className={[
                    'text-[11px] font-sans font-semibold px-3 py-1.5 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40',
                    difficultyFilter === d
                      ? d === 'ALL'
                        ? 'bg-[#2D3A31] text-white border-[#2D3A31]'
                        : DIFFICULTY_CONFIG[d].className + ' shadow-soft'
                      : 'text-[#2D3A31]/55 border-[#E6E2DA] hover:border-[#8C9A84] hover:text-[#2D3A31]',
                  ].join(' ')}
                  aria-pressed={difficultyFilter === d}
                >
                  {d === 'ALL' ? 'All Levels' : DIFFICULTY_CONFIG[d].label}
                </button>
              ))}

              {/* Divider */}
              <span className="w-px h-5 bg-[#E6E2DA] mx-1" />

              {/* Active filter */}
              {['ALL', 'ACTIVE', 'INACTIVE'].map((a) => (
                <button
                  key={a}
                  onClick={() => setActiveFilter(a)}
                  className={[
                    'text-[11px] font-sans font-semibold px-3 py-1.5 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40',
                    activeFilter === a
                      ? 'bg-[#2D3A31] text-white border-[#2D3A31]'
                      : 'text-[#2D3A31]/55 border-[#E6E2DA] hover:border-[#8C9A84] hover:text-[#2D3A31]',
                  ].join(' ')}
                  aria-pressed={activeFilter === a}
                >
                  {a === 'ALL' ? 'All' : a === 'ACTIVE' ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>
          </div>

          {/* ── Results count ── */}
          <p className="text-[12px] font-sans text-[#2D3A31]/40 mb-4">
            Showing {filteredQuestions.length} of {questions.length} questions
          </p>

          {/* ── Question list ── */}
          {filteredQuestions.length === 0 ? (
            <div className="card-botanical flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#8C9A84]/12 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[28px] text-[#8C9A84]">search_off</span>
              </div>
              <h3 className="text-[16px] font-serif font-bold text-[#2D3A31] mb-1">
                No questions found
              </h3>
              <p className="text-[13px] font-sans text-[#2D3A31]/55">
                Adjust your search or filters, or add a new question.
              </p>
              <button
                onClick={() => { setSearch(''); setCategoryFilter('ALL'); setDifficultyFilter('ALL'); setActiveFilter('ALL'); }}
                className="btn-botanical-secondary mt-4 py-2 px-5 text-xs rounded-full"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q) => {
                const diffCfg = DIFFICULTY_CONFIG[q.difficulty] || DIFFICULTY_CONFIG.MEDIUM;
                const isExpanded = expandedId === q.questionId;

                return (
                  <div
                    key={q.questionId}
                    className={[
                      'card-botanical overflow-hidden transition-all duration-300',
                      !q.isActive ? 'opacity-60' : '',
                    ].join(' ')}
                  >
                    {/* Main row */}
                    <div className="flex items-start gap-4 p-5">
                      {/* Question number */}
                      <div className="w-8 h-8 rounded-xl bg-[#2D3A31]/8 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[12px] font-sans font-bold text-[#2D3A31]/50">
                          #{q.questionId}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Tags row */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-[11px] font-sans font-bold text-[#8C9A84] uppercase tracking-wide">
                            {q.skillName}
                          </span>
                          <span className="text-[#E6E2DA]">·</span>
                          <span className="text-[11px] font-sans text-[#2D3A31]/50">{q.category}</span>

                          {/* Difficulty badge */}
                          <span
                            className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full border ${diffCfg.className}`}
                          >
                            {diffCfg.label}
                          </span>

                          {/* Active badge */}
                          {q.isActive ? (
                            <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-[#8C9A84]/12 text-[#2D3A31] border border-[#8C9A84]/25">
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-[#DCCFC2]/40 text-[#2D3A31]/50 border border-[#DCCFC2]">
                              Inactive
                            </span>
                          )}
                        </div>

                        {/* Question text */}
                        <p className="text-[14px] font-sans font-medium text-[#2D3A31] leading-snug">
                          {q.questionText}
                        </p>

                        {/* Sample answer (expandable) */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-[#E6E2DA]">
                            <p className="text-[10px] font-sans font-bold text-[#2D3A31]/40 uppercase tracking-widest mb-1.5">
                              Sample Answer
                            </p>
                            <p className="text-[13px] font-sans text-[#2D3A31]/70 leading-relaxed">
                              {q.sampleAnswer}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Expand */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : q.questionId)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C9A84] hover:bg-[#8C9A84]/15 hover:text-[#2D3A31] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40"
                          title={isExpanded ? 'Collapse' : 'View sample answer'}
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? 'Collapse answer' : 'View sample answer'}
                        >
                          <span className="material-symbols-outlined text-[17px]">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>

                        {/* Toggle active */}
                        <button
                          onClick={() => handleToggleActive(q.questionId)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C9A84] hover:bg-[#8C9A84]/15 hover:text-[#2D3A31] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40"
                          title={q.isActive ? 'Deactivate' : 'Activate'}
                          aria-label={q.isActive ? `Deactivate question #${q.questionId}` : `Activate question #${q.questionId}`}
                        >
                          <span className="material-symbols-outlined text-[17px]">
                            {q.isActive ? 'toggle_on' : 'toggle_off'}
                          </span>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => setEditingQuestion(q)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8C9A84] hover:bg-[#8C9A84]/15 hover:text-[#2D3A31] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#8C9A84]/40"
                          title="Edit"
                          aria-label={`Edit question #${q.questionId}`}
                        >
                          <span className="material-symbols-outlined text-[17px]">edit</span>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(q)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#C27B66] hover:bg-[#C27B66]/15 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#C27B66]/40"
                          title="Delete"
                          aria-label={`Delete question #${q.questionId}`}
                        >
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Add Modal ── */}
      {showAddModal && (
        <QuestionFormModal
          initial={null}
          onSave={handleAdd}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {/* ── Edit Modal ── */}
      {editingQuestion && (
        <QuestionFormModal
          initial={editingQuestion}
          onSave={handleEdit}
          onCancel={() => setEditingQuestion(null)}
        />
      )}

      {/* ── Delete Confirm ── */}
      <DeleteConfirmModal
        question={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
