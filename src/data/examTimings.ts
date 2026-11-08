interface PaperTiming {
  durationMinutes: number;
  title: string;
}

interface UnitTiming extends PaperTiming {
  componentCode: string;
}

interface ExamTimingDefinition {
  level: string;
  board: string;
  subject: string;
  qualificationCode: string;
  associatedQualificationCode?: string;
  sourceUrl: string;
  papers?: Record<number, PaperTiming>;
  units?: Record<string, UnitTiming>;
}

export interface ResolvedExamTiming {
  componentCode: string;
  durationSeconds: number;
}

export interface SubjectQualificationInfo {
  subjectName: string;
  qualificationName: string;
  qualificationCode: string;
  associatedQualificationCode?: string;
}

const cambridgeIgcses = (sourceUrl: string, subject: string, syllabusCode: string, papers: Record<number, PaperTiming>): ExamTimingDefinition => ({
  level: 'igcse',
  board: 'cambridge',
  subject,
  qualificationCode: syllabusCode,
  sourceUrl,
  papers,
});

const cambridgeALevels = (sourceUrl: string, subject: string, syllabusCode: string, papers: Record<number, PaperTiming>): ExamTimingDefinition => ({
  level: 'a-level',
  board: 'cambridge',
  subject,
  qualificationCode: syllabusCode,
  sourceUrl,
  papers,
});

const edexcelIALUnits = (
  subject: string,
  qualificationCode: string,
  sourceUrl: string,
  units: Record<string, UnitTiming>,
  associatedQualificationCode?: string,
): ExamTimingDefinition => ({
  level: 'a-level',
  board: 'edexcel',
  subject,
  qualificationCode,
  associatedQualificationCode,
  sourceUrl,
  units,
});

const igcseSciencePaperTimings: Record<number, PaperTiming> = {
  1: { title: 'Multiple Choice (Core)', durationMinutes: 45 },
  2: { title: 'Multiple Choice (Extended)', durationMinutes: 45 },
  3: { title: 'Theory (Core)', durationMinutes: 75 },
  4: { title: 'Theory (Extended)', durationMinutes: 75 },
  5: { title: 'Practical Test', durationMinutes: 75 },
  6: { title: 'Alternative to Practical', durationMinutes: 60 },
};

const aLevelSciencePaperTimings: Record<number, PaperTiming> = {
  1: { title: 'Multiple Choice', durationMinutes: 75 },
  2: { title: 'AS Level Structured Questions', durationMinutes: 75 },
  3: { title: 'Advanced Practical Skills', durationMinutes: 120 },
  4: { title: 'A Level Structured Questions', durationMinutes: 120 },
  5: { title: 'Planning, Analysis and Evaluation', durationMinutes: 75 },
};

const examTimingDefinitions: ExamTimingDefinition[] = [
  edexcelIALUnits(
    'Pure Mathematics',
    'YPM01',
    'https://qualifications.pearson.com/content/dam/pdf/International%20Advanced%20Level/Mathematics/2018/Specification-and-Sample-Assessment/international-a-level-maths-spec.pdf',
    {
      pure1: { componentCode: 'WMA11/01', title: 'Pure Mathematics 1', durationMinutes: 90 },
      pure2: { componentCode: 'WMA12/01', title: 'Pure Mathematics 2', durationMinutes: 90 },
      pure3: { componentCode: 'WMA13/01', title: 'Pure Mathematics 3', durationMinutes: 90 },
      pure4: { componentCode: 'WMA14/01', title: 'Pure Mathematics 4', durationMinutes: 90 },
    },
    'YMA01',
  ),
  edexcelIALUnits(
    'Mechanics',
    'WME01-3',
    'https://qualifications.pearson.com/content/dam/pdf/International%20Advanced%20Level/Mathematics/2018/Specification-and-Sample-Assessment/international-a-level-maths-spec.pdf',
    {
      mechanics1: { componentCode: 'WME01/01', title: 'Mechanics 1', durationMinutes: 90 },
      mechanics2: { componentCode: 'WME02/01', title: 'Mechanics 2', durationMinutes: 90 },
    },
    "YMA01",
  ),
  edexcelIALUnits(
    'Chemistry',
    'YCH11',
    
    'https://qualifications.pearson.com/content/dam/pdf/International%20Advanced%20Level/Chemistry/2018/Specification-and-Sample-Assessment/International-A-Level-Chemistry-Spec.pdf',
    {
      u1: { componentCode: 'WCH11/01', title: 'Unit 1', durationMinutes: 90 },
      u2: { componentCode: 'WCH12/01', title: 'Unit 2', durationMinutes: 90 },
      u3: { componentCode: 'WCH13/01', title: 'Practical Skills I', durationMinutes: 80 },
      u4: { componentCode: 'WCH14/01', title: 'Unit 4', durationMinutes: 105 },
      u5: { componentCode: 'WCH15/01', title: 'Unit 5', durationMinutes: 105 },
      u6: { componentCode: 'WCH16/01', title: 'Practical Skills II', durationMinutes: 80 },
    },'XCH11',
    
  ),
  edexcelIALUnits(
    'Biology',
    'YBI11',
    
    'https://qualifications.pearson.com/content/dam/pdf/International%20Advanced%20Level/Biology/2018/Specification-and-Sample-Assessment/International-A-Level-Biology-Spec.pdf',
    {
      u1: { componentCode: 'WBI11/01', title: 'Molecules, Diet, Transport and Health', durationMinutes: 90 },
      u2: { componentCode: 'WBI12/01', title: 'Cells, Development, Biodiversity and Conservation', durationMinutes: 90 },
      u3: { componentCode: 'WBI13/01', title: 'Practical Skills I', durationMinutes: 80 },
      u4: { componentCode: 'WBI14/01', title: 'Energy, Environment, Microbiology and Immunity', durationMinutes: 105 },
      u5: { componentCode: 'WBI15/01', title: 'Respiration, Internal Environment, Coordination and Gene Technology', durationMinutes: 105 },
      u6: { componentCode: 'WBI16/01', title: 'Practical Skills II', durationMinutes: 80 },
    },'XCH11',
    
  ),
  edexcelIALUnits(
    'Physics',
    'YPH11',
    'https://qualifications.pearson.com/content/dam/pdf/International%20Advanced%20Level/Physics/2018/Specification%20and%20Sample%20Assessment/9781446957783_IAL_Physics_Iss3.pdf',
    {
      u1: { componentCode: 'WPH11/01', title: 'Mechanics and Materials', durationMinutes: 90 },
      u2: { componentCode: 'WPH12/01', title: 'Waves and Electricity', durationMinutes: 90 },
      u3: { componentCode: 'WPH13/01', title: 'Practical Skills I', durationMinutes: 80 },
      u4: { componentCode: 'WPH14/01', title: 'Further Mechanics, Fields and Particles', durationMinutes: 105 },
      u5: { componentCode: 'WPH15/01', title: 'Thermodynamics, Radiation, Oscillations and Cosmology', durationMinutes: 105 },
      u6: { componentCode: 'WPH16/01', title: 'Practical Skills II', durationMinutes: 80 },
    },
    'XPH11',
  ),
  cambridgeIgcses(
    'https://www.cambridgeinternational.org/Images/697209-2026-2028-syllabus.pdf',
    'Physics',
    '0625',
    igcseSciencePaperTimings,
  ),
  cambridgeIgcses(
    'https://www.cambridgeinternational.org/Images/697203-2026-2028-syllabus.pdf',
    'Biology',
    '0610',
    igcseSciencePaperTimings,
  ),
  cambridgeIgcses(
    'https://www.cambridgeinternational.org/Images/697205-2026-2028-syllabus.pdf',
    'Chemistry',
    '0620',
    igcseSciencePaperTimings,
  ),
  cambridgeIgcses(
    'https://www.cambridgeinternational.org/Images/662466-2025-2027-syllabus.pdf',
    'Mathematics',
    '0580',
    {
      1: { title: 'Non-calculator (Core)', durationMinutes: 90 },
      2: { title: 'Non-calculator (Extended)', durationMinutes: 120 },
      3: { title: 'Calculator (Core)', durationMinutes: 90 },
      4: { title: 'Calculator (Extended)', durationMinutes: 120 },
    },
  ),
  cambridgeIgcses(
    'https://www.cambridgeinternational.org/Images/662470-2025-2027-syllabus.pdf',
    'Additional Mathematics',
    '0606',
    {
      1: { title: 'Non-calculator', durationMinutes: 120 },
      2: { title: 'Calculator', durationMinutes: 120 },
    },
  ),
  cambridgeIgcses(
    'https://www.cambridgeinternational.org/Images/697167-2026-2028-syllabus.pdf',
    'Computer Science',
    '0478',
    {
      1: { title: 'Computer Systems', durationMinutes: 105 },
      2: { title: 'Algorithms, Programming and Logic', durationMinutes: 105 },
    },
  ),
  cambridgeALevels(
    'https://www.cambridgeinternational.org/Images/664563-2025-2027-syllabus.pdf',
    'Chemistry',
    '9701',
    aLevelSciencePaperTimings,
  ),
  cambridgeALevels(
    'https://www.cambridgeinternational.org/Images/664565-2025-2027-syllabus.pdf',
    'Physics',
    '9702',
    aLevelSciencePaperTimings,
  ),
  cambridgeALevels(
    'https://www.cambridgeinternational.org/Images/664560-2025-2027-syllabus.pdf',
    'Biology',
    '9700',
    aLevelSciencePaperTimings,
  ),
  cambridgeALevels(
    'https://www.cambridgeinternational.org/Images/697427-2026-2027-syllabus.pdf',
    'Mathematics',
    '9709',
    {
      1: { title: 'Pure Mathematics 1', durationMinutes: 110 },
      2: { title: 'Pure Mathematics 2', durationMinutes: 75 },
      3: { title: 'Pure Mathematics 3', durationMinutes: 110 },
      4: { title: 'Mechanics', durationMinutes: 75 },
      5: { title: 'Probability & Statistics 1', durationMinutes: 75 },
      6: { title: 'Probability & Statistics 2', durationMinutes: 75 },
    },
  ),
  cambridgeALevels(
    'https://www.cambridgeinternational.org/Images/697357-2026-2027-syllabus.pdf',
    'Further Mathematics',
    '9231',
    {
      1: { title: 'Further Pure Mathematics 1', durationMinutes: 120 },
      2: { title: 'Further Pure Mathematics 2', durationMinutes: 120 },
      3: { title: 'Further Mechanics', durationMinutes: 90 },
      4: { title: 'Further Probability & Statistics', durationMinutes: 90 },
    },
  ),
  cambridgeALevels(
    'https://www.cambridgeinternational.org/Images/721397-2027-2029-syllabus.pdf',
    'Computer Science',
    '9618',
    {
      1: { title: 'Theory Fundamentals', durationMinutes: 90 },
      2: { title: 'Fundamental Problem-solving and Programming Skills', durationMinutes: 120 },
      3: { title: 'Advanced Theory', durationMinutes: 90 },
      4: { title: 'Practical', durationMinutes: 150 },
    },
  ),
];

const normalize = (value: string): string => value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const normalizeUnit = (unit: string): string => normalize(unit).replace(/^unit/, 'u');

export const getSubjectQualificationInfo = (
  level: string,
  board: string,
  subject: string,
): SubjectQualificationInfo | null => {
  const definition = examTimingDefinitions.find(
    item =>
      normalize(item.level) === normalize(level) &&
      normalize(item.board) === normalize(board) &&
      normalize(item.subject) === normalize(subject),
  );
  if (!definition) return null;

  const qualificationName = normalize(definition.board) === 'cambridge'
    ? normalize(definition.level) === 'igcse'
      ? 'Cambridge IGCSE'
      : 'Cambridge International AS & A Level'
    : 'Pearson Edexcel International A Level';

  return {
    subjectName: definition.subject,
    qualificationName,
    qualificationCode: definition.qualificationCode,
    associatedQualificationCode: definition.associatedQualificationCode,
  };
};

export const getSubjectQualificationCode = (
  level: string,
  board: string,
  subject: string,
): string | null => {
  const qualification = getSubjectQualificationInfo(level, board, subject);
  if (!qualification) return null;
  return [
    qualification.qualificationCode,
    qualification.associatedQualificationCode,
  ].filter(Boolean).join(' / ');
};

export const getExamTiming = (
  level: string,
  board: string,
  subject: string,
  unit: string,
  paperNumber: number | null,
  variant: number | null,
): ResolvedExamTiming | null => {
  const definition = examTimingDefinitions.find(
    item =>
      normalize(item.level) === normalize(level) &&
      normalize(item.board) === normalize(board) &&
      normalize(item.subject) === normalize(subject),
  );
  if (!definition) return null;

  const unitTiming = definition.units?.[normalizeUnit(unit)];
  const paperTiming = paperNumber === null ? undefined : definition.papers?.[paperNumber];
  const selectedTiming = unitTiming || paperTiming;
  if (!selectedTiming) return null;

  const componentCode = unitTiming
    ? unitTiming.componentCode
    : `${definition.qualificationCode}/${paperNumber}${variant ?? ''}`;

  return {
    componentCode,
    durationSeconds: selectedTiming.durationMinutes * 60,
  };
};
