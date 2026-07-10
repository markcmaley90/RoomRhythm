import type { TestTemplate } from '@/lib/testing/schema';

const VERIFY =
  'Timings are provided for practice and mock administration only. Always verify against your official test manual or coordinator before a live administration.';

const STANDARD = { id: 'std', label: 'Standard', timeMultiplier: 1 };
const EXT_15 = { id: 'ext15', label: 'Extended time (1.5×)', timeMultiplier: 1.5 };
const EXT_20 = { id: 'ext20', label: 'Double time (2×)', timeMultiplier: 2 };

const warn = (m: number, label: string, spoken = false) => ({
  offsetSeconds: m * 60,
  label,
  spoken,
  sound: true,
});

/** ---------------- 1. School-created exam (no IP entanglement) ---------------- */
export const finalExam90: TestTemplate = {
  id: 'seed-final-90',
  name: '90-Minute Final Exam',
  domain: 'school_exam',
  description: 'A single-section classroom final with standard warning callouts.',
  verificationNotice: VERIFY,
  accommodationLanes: [STANDARD, EXT_15, EXT_20],
  segments: [
    {
      id: 's0',
      kind: 'instructions',
      label: 'Instructions',
      durationSeconds: 0,
      advance: 'manual',
      announcement:
        'Clear your desks. Phones off and in your bag. You will have 90 minutes. Begin when I say begin.',
    },
    {
      id: 's1',
      kind: 'section',
      label: 'Final Exam',
      durationSeconds: 90 * 60,
      advance: 'gated',
      warnings: [
        warn(30, '30 minutes remaining'),
        warn(10, '10 minutes remaining'),
        warn(5, '5 minutes remaining', true),
        warn(1, '1 minute remaining', true),
      ],
    },
    {
      id: 's2',
      kind: 'transition',
      label: 'Collect materials',
      durationSeconds: 0,
      advance: 'manual',
      announcement: 'Pencils down. Remain seated while I collect your exams.',
    },
  ],
  meta: { source: 'seed', version: 1, lastVerified: '2026-07-08' },
};

/** ---------------- 2. Mock SAT (practice only) ---------------- */
export const mockDigitalSat: TestTemplate = {
  id: 'seed-mock-sat',
  name: "RoomRhythm's Mock Practice Timing for the SAT® Exam",
  domain: 'practice_admissions',
  description:
    'Section timing for a paper/mock practice administration. The official digital SAT is timed individually inside College Board\'s Bluebook app, not by a shared room clock.',
  verificationNotice: VERIFY,
  trademark: {
    mark: 'SAT®',
    disclaimer:
      'SAT® is a registered trademark of the College Board, which was not involved in the production of, and does not endorse, this product.',
  },
  accommodationLanes: [STANDARD, EXT_15, EXT_20],
  segments: [
    { id: 'rw1', kind: 'section', label: 'Reading & Writing — Module 1', durationSeconds: 32 * 60, advance: 'gated',
      warnings: [warn(5, '5 minutes remaining'), warn(1, '1 minute remaining')] },
    { id: 'rw2', kind: 'section', label: 'Reading & Writing — Module 2', durationSeconds: 32 * 60, advance: 'gated',
      warnings: [warn(5, '5 minutes remaining'), warn(1, '1 minute remaining')] },
    { id: 'brk', kind: 'break', label: 'Break', durationSeconds: 10 * 60, advance: 'gated',
      announcement: 'You have a 10-minute break. Do not discuss the test.' },
    { id: 'm1', kind: 'section', label: 'Math — Module 1', durationSeconds: 35 * 60, advance: 'gated',
      warnings: [warn(5, '5 minutes remaining'), warn(1, '1 minute remaining')] },
    { id: 'm2', kind: 'section', label: 'Math — Module 2', durationSeconds: 35 * 60, advance: 'gated',
      warnings: [warn(5, '5 minutes remaining'), warn(1, '1 minute remaining')] },
  ],
  meta: {
    source: 'seed', version: 1, lastVerified: '2026-07-08',
    sourceUrl: 'https://blog.collegeboard.org/how-long-does-the-sat-take',
  },
};

/** ---------------- 3. Mock ACT (enhanced format, practice only) ---------------- */
export const mockEnhancedAct: TestTemplate = {
  id: 'seed-mock-act',
  name: "RoomRhythm's Mock Practice Timing for the ACT® Test",
  domain: 'practice_admissions',
  description: 'Enhanced ACT format. Science and Writing are optional add-on sections.',
  verificationNotice: VERIFY,
  trademark: {
    mark: 'ACT®',
    disclaimer:
      'ACT® is a registered trademark of ACT, Inc., which was not involved in the production of, and does not endorse, this product.',
  },
  accommodationLanes: [STANDARD, EXT_15, EXT_20],
  segments: [
    { id: 'eng', kind: 'section', label: 'English', durationSeconds: 35 * 60, advance: 'gated',
      warnings: [warn(5, '5 minutes remaining'), warn(1, '1 minute remaining')] },
    { id: 'math', kind: 'section', label: 'Mathematics', durationSeconds: 50 * 60, advance: 'gated',
      warnings: [warn(10, '10 minutes remaining'), warn(5, '5 minutes remaining')] },
    { id: 'brk', kind: 'break', label: 'Break', durationSeconds: 10 * 60, advance: 'gated' },
    { id: 'read', kind: 'section', label: 'Reading', durationSeconds: 40 * 60, advance: 'gated',
      warnings: [warn(5, '5 minutes remaining'), warn(1, '1 minute remaining')] },
    { id: 'sci', kind: 'section', label: 'Science (optional)', durationSeconds: 40 * 60, advance: 'gated',
      warnings: [warn(5, '5 minutes remaining')] },
    { id: 'writ', kind: 'section', label: 'Writing (optional)', durationSeconds: 40 * 60, advance: 'gated',
      warnings: [warn(5, '5 minutes remaining')] },
  ],
  meta: {
    source: 'seed', version: 1, lastVerified: '2026-07-08',
    sourceUrl: 'https://www.act.org/content/act/en/products-and-services/the-act/test-changes/enhancements.html',
  },
};

/** ---------------- 4. Corporate / warehouse certification ---------------- */
export const safetyCertification: TestTemplate = {
  id: 'seed-safety-cert',
  name: 'Safety Certification Session',
  domain: 'corporate_training',
  description:
    'Training modules plus a timed certification assessment. Suits warehouse, compliance, and equipment certification.',
  verificationNotice:
    'Verify all timings against your certifying body\'s requirements before a live certification session.',
  accommodationLanes: [STANDARD, EXT_15],
  segments: [
    { id: 'brief', kind: 'instructions', label: 'Safety briefing', durationSeconds: 0, advance: 'manual',
      announcement: 'Confirm all trainees have signed the attendance sheet before beginning.' },
    { id: 'mod1', kind: 'section', label: 'Module 1 — Hazard identification', durationSeconds: 25 * 60, advance: 'gated',
      warnings: [warn(5, '5 minutes remaining')] },
    { id: 'b1', kind: 'break', label: 'Break', durationSeconds: 10 * 60, advance: 'auto' },
    { id: 'mod2', kind: 'section', label: 'Module 2 — Equipment operation', durationSeconds: 25 * 60, advance: 'gated',
      warnings: [warn(5, '5 minutes remaining')] },
    { id: 'assess', kind: 'section', label: 'Certification assessment', durationSeconds: 30 * 60, advance: 'gated',
      warnings: [warn(10, '10 minutes remaining'), warn(5, '5 minutes remaining', true), warn(1, '1 minute remaining', true)],
      announcement: 'This is a closed-book assessment. You have 30 minutes.' },
  ],
  meta: { source: 'seed', version: 1, lastVerified: '2026-07-08' },
};

export const SEED_TEMPLATES: TestTemplate[] = [
  finalExam90,
  mockDigitalSat,
  mockEnhancedAct,
  safetyCertification,
];
