import { getTopicMetadata } from '../utils/curriculumData.ts';

type TopicDataRawEntry = {
  title?: string;
  subject?: string;
  curriculum?: string;
  description?: string;
  videos?: TopicVideo[];
  resources?: TopicResource[];
  quizzes?: TopicQuiz[];
  color?: string;
  group?: string;
};

// Topic data - only specify videos, resources, and quizzes
// Title, description, subject, and curriculum are automatically pulled from CurriculumPage.tsx
const topicDataRaw: Record<string, TopicDataRawEntry> = {
  'P3-Math-T1': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Algebra Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P3/1-Algebra/P3 Topic 1 Algebra QS.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P3/1-Algebra/P3 Topic 1 Algebra MS.pdf' }, { id: 'q1', title: 'Functions Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P3/2-Functions/P3 Topic 2 Functions QS.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P3/2-Functions/P3 Topic 2 Functions MS.pdf' }]


  },

  'P3-Math-T3': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Trigonometry Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P3/3-Trigonometry/P3 Topic 3 Trigonometry QS.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P3/3-Trigonometry/P3 Topic 3 Trigonometry MS.pdf' }]

  },
  'P3-Math-T4': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Exponentials and Logarithms Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P3/4-Exponentials-and-Logarithms/P3 Topic 4 Exponentials and Logarithms QS.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P3/4-Exponentials-and-Logarithms/P3 Topic 4 Exponentials and Logarithms MS.pdf' }]

  },
  'P3-Math-T5': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Differentiation Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P3/5-Differentiation/P3 Topic 5 Differentiation QS.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P3/5-Differentiation/P3 Topic 5 Differentiation MS.pdf' }]

  },
  'P3-Math-T6': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Integration Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P3/6-Integration/P3 Topic 6 Integration QS.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P3/6-Integration/P3 Topic 6 Integrationsa MS.pdf' }]

  },
  'P3-Math-T7': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Numerical Methods', questionFile: '/Questions/alevel/edexcel/math/Pure/P3/7-Numerical-Methods/P3 Topic 7 Numerical Methods QS.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P3/7-Numerical-Methods/P3 Topic 7 Numerical Methods MS.pdf' }]

  },

  // P1 Pure Mathematics Topics

  'P1-Math-T1': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Algebra Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P1/1-Algebra and inqualities/P1 - Topic 1 Algebra 2019 - 2024 QP.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P1/1-Algebra and inqualities/P1 - Topic 1 Algebra 2019 - 2024 MS.pdf' },
    { id: 'q2', title: 'Quadratics topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P1/1-Algebra and inqualities/P1 - Topic 2 Quadratics 2019 - 2024 QP.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P1/1-Algebra and inqualities/P1 - Topic 2 Quadratics 2019 - 2024 MS.pdf' },
    { id: 'q3', title: 'Inequalities topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P1/1-Algebra and inqualities/P1 - Topic 3 Inequalities 2019 - 2024 QP.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P1/1-Algebra and inqualities/P1 - Topic 3 Inequalities 2019 - 2024 MS.pdf' },
    { id: 'q1', title: 'Functions Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P1/2-Functions/P1 - Topic 4 Graphs 2019 - 2024 QP.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P1/2-Functions/P1 - Topic 4 Graphs 2019 - 2024 MS.pdf' }
    ]

  },

  'P1-Math-T2': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Coordinate Geometry Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P1/3-Coordinate Geometry/P1 - Topic 5 Straight Line Graphs 2019 - 2024 QP.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P1/3-Coordinate Geometry/P1 - Topic 5 Straight Line Graphs 2019 - 2024 MS.pdf' }]

  },
  'P1-Math-T3': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Trigonometry Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P1/4-Trigonometry/P1 - Topic 6 Trigonometric Ratios 2019 - 2024 QP.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P1/4-Trigonometry/P1 - Topic 6 Trigonometric Ratios 2019 - 2024 MS.pdf' },
    { id: 'q2', title: 'Radians Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P1/4-Trigonometry/P1 - Topic 7 Radians 2019 - 2024 QP.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P1/4-Trigonometry/P1 - Topic 7 Radians 2019 - 2024 MS.pdf' }
    ]

  },
  'P1-Math-T4': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Differentiation Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P1/5-Differentiation/P1 - Topic 8 Differentiation 2019 - 2024 QP.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P1/5-Differentiation/P1 - Topic 8 Differentiation 2019 - 2024 MS.pdf' }]

  },
  'P1-Math-T5': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Integration Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P1/6-Integration/P1 - Topic 9 Integration 2019 - 2024 QP.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P1/6-Integration/P1 - Topic 9 Integration 2019 - 2024 MS.pdf' }]

  },

  // P2 Pure Mathematics Topics
  'P2-Math-T1': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Proof Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P2/1-Proof/placeholder.txt', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P2/1-Proof/placeholder.txt' }]

  },
  'P2-Math-T2': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Algebraic Methods Topical', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P2/2-Algebric methods/Algebraic Methods.pdf', questionFile: '/Questions/alevel/edexcel/math/Pure/P2/2-Algebric methods/p2-chapter-1-algebraic-methods Copy.pdf' }]

  },
  'P2-Math-T3': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Coordinate Geometry (Circles) Topical', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P2/3-Coordinate Geometry/Coordinate Geometry.pdf', questionFile: '/Questions/alevel/edexcel/math/Pure/P2/3-Coordinate Geometry/p2-chapter-2-coordinate-geometry Copy.pdf' }]

  },

  'P2-Math-T4': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Sequences and Series Topical', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P2/5-Sequences and Series/Sequences and Series.pdf', questionFile: '/Questions/alevel/edexcel/math/Pure/P2/5-Sequences and Series/p2-chapter-5-sequences-and-series Copy.pdf' }, { id: 'q1', title: 'Binomial Expansion Topical', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P2/4-Binomial expansion/Binomial Expansion.pdf', questionFile: '/Questions/alevel/edexcel/math/Pure/P2/4-Binomial expansion/p2-chapter-4-binomial-expansion Copy.pdf' }]

  },
  'P2-Math-T5': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Exponentials and Logarithms Topical', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P2/6-Exponentials and Logarithms/Exponentials and Logarithms.pdf', questionFile: '/Questions/alevel/edexcel/math/Pure/P2/6-Exponentials and Logarithms/p2-chapter-3-exponentials-and-logarithms Copy.pdf' }]

  },
  'P2-Math-T6': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Trigonometry Topical', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P2/7-Trigonometry/Trigonometric Identities and Equations.pdf', questionFile: '/Questions/alevel/edexcel/math/Pure/P2/7-Trigonometry/p2-chapter-6-trigonmetric-identities-and-equations Copy.pdf' }]

  },
  'P2-Math-T7': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Differentiation Topical', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P2/8-Differentiation/Differentiation.pdf', questionFile: '/Questions/alevel/edexcel/math/Pure/P2/8-Differentiation/p2-chapter-7-differentiation Copy.pdf' }]

  },
  'P2-Math-T8': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Integration Topical', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P2/9-Integration/Integration.pdf', questionFile: '/Questions/alevel/edexcel/math/Pure/P2/9-Integration/p2-chapter-8-integration-and-trapezium-rule Copy.pdf' }]

  },

  // P4 Pure Mathematics Topics
  'P4-Math-T1': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Proof by Contradiction Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P4/1-Proof by Contradiction/P4 Topic 1 Proof QP.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P4/1-Proof by Contradiction/P4 Topic 1 Proof MS.pdf' }]

  },
  'P4-Math-T2': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Partial Fractions Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P4/2-Partial Fractions/P4 Topic 2 Partial Fractions QP.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P4/2-Partial Fractions/P4 Topic 2 Partial Fractions QP.pdf' }]

  },
  'P4-Math-T3': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Coordinate Geometry (Parametric) Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P4/3-Coordinate Geometry/P4 Topic 3 Coordinate Geometry QP.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P4/3-Coordinate Geometry/P4 Topic 3 Coordinate Geometry MS.pdf' }]

  },
  'P4-Math-T4': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Binomial Expansion Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P4/4-Binomial Expansion/P4 Topic 4 Binomial Expansion QP.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P4/4-Binomial Expansion/P4 Topic 4 Binomial Expansion MS.pdf' }]

  },
  'P4-Math-T5': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Differentiation (Implicit & Parametric) Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P4/5-Differentiation/P4 Topic 5 Differentiation QP.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P4/5-Differentiation/P4 Topic 5 Differentiation MS.pdf' }]

  },
  'P4-Math-T6': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Integration (Advanced Methods) Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P4/6-Integration/P4 Topic 6 Integration QP.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P4/6-Integration/P4 Topic 6 Integration MS.pdf' }]

  },
  'P4-Math-T7': {
    videos: [],
    resources: [],
    quizzes: [{ id: 'q1', title: 'Vectors Topical', questionFile: '/Questions/alevel/edexcel/math/Pure/P4/7-Vectors/P4 Topic 7 Vectors QP.pdf', markSchemeFile: '/Questions/alevel/edexcel/math/Pure/P4/7-Vectors/P4 Topic 7 Vectors MS.pdf' }]

  },


  "P1-CH1": {
    "videos": [], "resources": [{ "id": "r1", "title": "Quadratics Study Notes", "url": "/documents/alevel/cambridge/Math/P1/Quadratics Study Notes.pdf" }], "quizzes": []
  },
  "P1-CH2": {
    "videos": [], "resources": [{ "id": "r1", "title": "Functions Study Notes", "url": "/documents/alevel/cambridge/Math/P1/Functions Study Notes.pdf" }], "quizzes": []
  },
  "P1-CH3": {
    "videos": [], "resources": [{ "id": "r1", "title": "Coordinate Geometry Study Notes", "url": "/documents/alevel/cambridge/Math/P1/Coordinate Geometry Study Notes.pdf" }], "quizzes": []
  },
  "P1-CH4": {
    "videos": [], "resources": [{ "id": "r1", "title": "Circular Measure Study Notes", "url": "/documents/alevel/cambridge/Math/P1/Circular Measure Study Notes.pdf" }], "quizzes": []
  },
  "P1-CH5": {
    "videos": [], "resources": [{ "id": "r1", "title": "Trigonometry Study Notes", "url": "/documents/alevel/cambridge/Math/P1/Trigonometry Study Notes.pdf" }], "quizzes": []
  },
  "P1-CH6": {
    "videos": [], "resources": [{ "id": "r1", "title": "Series Study Notes", "url": "/documents/alevel/cambridge/Math/P1/Series Study Notes.pdf" }], "quizzes": []
  },
  "P1-CH7": {
    "videos": [], "resources": [{ "id": "r1", "title": "Differentiation Study Notes", "url": "/documents/alevel/cambridge/Math/P1/Differentiation Study Notes.pdf" }], "quizzes": []
  },
  "P1-CH8": {
    "videos": [], "resources": [{ "id": "r1", "title": "Integration Study Notes", "url": "/documents/alevel/cambridge/Math/P1/Integration Study Notes.pdf" }], "quizzes": []
  },
  "P1-revision": { videos: [], resources: [{ id: 'r1', title: 'Pure math 1 Revision Notes (Veda)', url: '/documents/alevel/cambridge/Math/P1/Pure Mathematics 1 Notes AS - Veda.pdf', description: 'Notes  from: https://sites.google.com/view/vehemsstudyloft/home' },] },


  'P3-CH1': {
    videos: [],
    resources: [{ id: 'r1', title: 'Algebra(@Tim Tam)', url: '/documents/alevel/cambridge/Math/P3/Algebra.pdf' },],
    quizzes: []
  },
  'P3-CH2': {
    videos: [],
    resources: [{ id: 'r1', title: 'Logarithmic & exponential functions(@Tim Tam)', url: '/documents/alevel/cambridge/Math/P3/Logarithmic & exponential functions.pdf' },],
    quizzes: []
  },
  'P3-CH3': {
    videos: [],
    resources: [{ id: 'r1', title: 'Trigonometry(@Tim Tam)', url: '/documents/alevel/cambridge/Math/P3/Trigonometry.pdf' },],
  },
  'P3-CH4': {
    videos: [],
    resources: [{ id: 'r1', title: 'Differentiation(@Tim Tam)', url: '/documents/alevel/cambridge/Math/P3/Differentiation.pdf' },],
  },
  'P3-CH5': {
    videos: [],
    resources: [{ id: 'r1', title: 'Integration(@Tim Tam)', url: '/documents/alevel/cambridge/Math/P3/Integration.pdf' },],
  },
  'P3-CH6': {
    videos: [],
    resources: [{ id: 'r1', title: 'Numerical Methods(@Tim Tam)', url: '/documents/alevel/cambridge/Math/P3/Numerical Methods.pdf' },],
  },
  'P3-CH7': {
    videos: [],
    resources: [{ id: 'r1', title: 'Vectors(@Tim Tam)', url: '/documents/alevel/cambridge/Math/P3/Vectors.pdf' },],
  },
  'P3-CH8': {
    videos: [],
    resources: [{ id: 'r1', title: 'Differential equations(@Tim Tam)', url: '/documents/alevel/cambridge/Math/P3/Differential Equations.pdf' },],
  },
  'P3-CH9': {
    videos: [],
    resources: [{ id: 'r1', title: 'Complex Numbers(@Tim Tam)', url: '/documents/alevel/cambridge/Math/P3/Complex Numbers.pdf' },],
  },



  "S1-CH1": {
    "videos": [],
    "resources": [{ "id": "r1", "title": "Representation of Data Study Notes", "url": "/documents/alevel/cambridge/Math/S1/Representation of Data Study Notes.pdf" }]
  },
  "S1-CH2": {
    "videos": [],
    "resources": [{ "id": "r1", "title": "Permutations and Combinations Study Notes", "url": "/documents/alevel/cambridge/Math/S1/Permutations and Combinations Study Notes.pdf" }]
  },
  "S1-CH3": {
    "videos": [],
    "resources": [{ "id": "r1", "title": "Probability Study Notes", "url": "/documents/alevel/cambridge/Math/S1/Probability Study Notes.pdf" }]
  },
  "S1-CH4": {
    "videos": [],
    "resources": [{ "id": "r1", "title": "Discrete Random Variables Study Notes", "url": "/documents/alevel/cambridge/Math/S1/Discrete Random Variables Study Notes.pdf" }]
  },
  "S1-revision": { videos: [], resources: [{ id: 'r1', title: 'Probability & Statistics Revision Notes (Veda)', url: '/documents/alevel/cambridge/Math/S1/Probability & Statistics 1 Notes AS - Veda.pdf', description: 'Notes  from: https://sites.google.com/view/vehemsstudyloft/home' },] },




  'S2-CH1': {
    videos: [],
    resources: [{ id: 'r1', title: 'The Poisson distribution(@Tim Tam)', url: '/documents/alevel/cambridge/Math/S2/Poisson.pdf' },],
  },
  'S2-CH2': {
    videos: [],
    resources: [{ id: 'r1', title: 'Linear combinations of random variables(@Tim Tam)', url: '/documents/alevel/cambridge/Math/S2/Linear combinations of random variables.pdf' },],
  },
  'S2-CH3': {
    videos: [],
    resources: [{ id: 'r1', title: 'Continuous random variables(@Tim Tam)', url: '/documents/alevel/cambridge/Math/S2/Continuous random variables.pdf' },],
  },
  'S2-CH4': {
    videos: [],
    resources: [{ id: 'r1', title: 'Sampling and estimation(@Tim Tam)', url: '/documents/alevel/cambridge/Math/S2/Sampling and estimation.pdf' },],
  },
  'S2-CH5': {
    videos: [],
    resources: [{ id: 'r1', title: 'Hypothesis tests(@Tim Tam)', url: '/documents/alevel/cambridge/Math/S2/Hypothesis tests.pdf' },],
  },






  'maths-1': {
    videos: [],
    resources: [{ id: 'r1', title: 'Number Notes (Haris)', url: '/documents/igcse/cambridge/Math/1-Number/Haris Notes Number.pdf' },],
  },
  'maths-2': {
    videos: [],
    resources: [{ id: 'r1', title: 'Algebra and Graphs Notes (Haris)', url: '/documents/igcse/cambridge/Math/2-Algebra and graphs/Haris Notes Algebra and Graphs.pdf' },],
  },
  'maths-3': {
    videos: [],
    resources: [{ id: 'r1', title: 'Coordinate Geometry Notes (Haris)', url: '/documents/igcse/cambridge/Math/3-Coordinate geometry/Haris Notes Coordinate Geometry.pdf' },],
  },
  'maths-4': {
    videos: [],
    resources: [{ id: 'r1', title: 'Geometry Notes (Haris)', url: '/documents/igcse/cambridge/Math/4-Geometry/Haris Notes Geometry.pdf' },],
  },
  'maths-5': {
    videos: [],
    resources: [{ id: 'r1', title: 'Mensuration Notes (Haris)', url: '/documents/igcse/cambridge/Math/5-Mensuration/Haris Notes Mensuration.pdf' },],
  },
  'maths-6': {
    videos: [],
    resources: [{ id: 'r1', title: 'Trigonometry Notes (Haris)', url: '/documents/igcse/cambridge/Math/6-Trigonometry/Haris Notes Trigonometry.pdf' },],
  },
  'maths-7': {
    videos: [],
    resources: [{ id: 'r1', title: 'Transformations and Vectors Notes (Haris)', url: '/documents/igcse/cambridge/Math/7-Transformations and vectors/Haris Notes Transformations and Vectors.pdf' },],
  },
  'maths-8': {
    videos: [],
    resources: [{ id: 'r1', title: 'Probability Notes (Haris)', url: '/documents/igcse/cambridge/Math/8-Probability/Haris Notes Probability.pdf' },],
  },
  'maths-9': {
    videos: [],
    resources: [{ id: 'r1', title: 'Statistics Notes (Haris)', url: '/documents/igcse/cambridge/Math/9-Statistics/Haris Notes Statistics.pdf' },],
  },
  'maths-full-revision': {
    videos: [],
    resources: [{ id: 'r1', title: 'Maths Full Revision Notes (Veda)', url: '/documents/igcse/cambridge/Math/Full Revision/Mathematics Notes IGCSE - Veda.pdf', description: 'Notes  from: https://sites.google.com/view/vehemsstudyloft/home' },],
  },
















  'biology-full-revision': {
    videos: [],
    resources: [{ id: 'r3', title: 'Biology notes (Veda)', url: '/documents/igcse/cambridge/Biology/Full Revision/Biology Notes IGCSE - Veda.pdf', description: 'Notes  from: https://sites.google.com/view/vehemsstudyloft/home' },
    { id: 'r1', title: 'Biology Definitions (Vasumitra)', url: '/documents/igcse/cambridge/Biology/Full Revision/Biology Definitions (Vasumitra).pdf', description: 'Big thanks to: https://vasumitragajbhiye.com/' },
    { id: 'r2', title: 'Biology Notes (Vasumitra)', url: '/documents/igcse/cambridge/Biology/Full Revision/Biology Notes (Vasumitra).pdf', description: 'Big thanks to: https://vasumitragajbhiye.com/' },
    { id: 'r3', title: 'Biology Diagrams (Vasumitra)', url: '/documents/igcse/cambridge/Biology/Full Revision/Biology Diagrams (Vasumitra).pdf', description: 'Big thanks to: https://vasumitragajbhiye.com/' }
    ],
    quizzes: [{
      id: 'q1', title: 'Biology *Easy* Drawings Booklet (Vasumitra)',
      questionFile: '/Questions/igcse/cambridge/biology/Biology Easy Drawings Booklet (Vasumitra).pdf', description: 'Big thanks to: https://vasumitragajbhiye.com/'
    },
    {
      id: 'q2', title: 'Biology HARD Drawings Booklet (Vasumitra)',
      questionFile: '/Questions/igcse/cambridge/biology/Biology Hard Drawings Booklet (Vasumitra).pdf', description: 'Big thanks to: https://vasumitragajbhiye.com/'
    },
    {
      id: 'q3', title: 'Biology Commonly asked questions (Vasumitra)',
      questionFile: '/Questions/igcse/cambridge/biology/Biology CAQ (Vasumitra).pdf', description: 'Big thanks to: https://vasumitragajbhiye.com/'
    },

    ]
  },
  'biology-1': {
    videos: [],
    resources: [{ id: 'r1', title: 'Characteristics and Classifications Notes (HAF)', url: '/documents/igcse/cambridge/Biology/1-Characteristics and classification of living organisms/Bio chapter 1 (HAF).pdf' },
    { id: 'r3', title: 'Characteristics and Classification of Living Organisms Notes (a.aseer)', url: '/documents/igcse/cambridge/Biology/1-Characteristics and classification of living organisms/Characteristics and classification of living organisms (a.aseer).pdf' },
    { id: 'r2', title: 'Characteristics and Classifications Notes (Eshal)', url: '/documents/igcse/cambridge/Biology/1-Characteristics and classification of living organisms/Bio chapter 1 - Characteristics and classification of living organisms.pdf' }],
    quizzes: []
  },
  'biology-2': {
    videos: [],
    resources: [{ id: 'r1', title: 'Organisation of the Organism Notes (HAF)', url: '/documents/igcse/cambridge/Biology/2-Organisation of the organism/Bio chapter 2 (HAF).pdf' },
    { id: 'r3', title: 'Organisation of the Organism Notes (a.aseer)', url: '/documents/igcse/cambridge/Biology/2-Organisation of the organism/Organisation of the organism (a.aseer).pdf' },
    { id: 'r2', title: 'Organisation of the Organism Notes (Eshal)', url: '/documents/igcse/cambridge/Biology/2-Organisation of the organism/Bio chapter 2 - Organisation of the organism.pdf' }],
    quizzes: []
  },
  'biology-3': {
    videos: [],
    resources: [{ id: 'r1', title: 'Movement Into and Out of Cells Notes (HAF)', url: '/documents/igcse/cambridge/Biology/3-Movement into and out of cells/Bio chapter 3 (HAF).pdf' },
    { id: 'r3', title: 'Movement Into and Out of Cells Notes (a.aseer)', url: '/documents/igcse/cambridge/Biology/3-Movement into and out of cells/Movement into and out of cells (a.aseer).pdf' },
    { id: 'r2', title: 'Movement Into and Out of Cells Notes (Eshal)', url: '/documents/igcse/cambridge/Biology/3-Movement into and out of cells/Bio chapter 3 - Movement into and out of cells.pdf' }],
    quizzes: [

    ]
  },



  'biology-4': {
    videos: [],
    resources: [{ id: 'r1', title: 'Biological Molecules Notes (HAF)', url: '/documents/igcse/cambridge/Biology/4-Biological molecules/Bio chapter 4 (HAF).pdf' },
    { id: 'r2', title: 'Biological Molecules (@PISANG)', url: 'https://drive.google.com/file/d/1ekIXRfI5ey4k4uFDqNF61GvVcvcgcsYg/preview?usp=drive_link' },
    { id: 'r3', title: 'Biological Molecules Notes (a.aseer)', url: '/documents/igcse/cambridge/Biology/4-Biological molecules/Biological molecules (a.aseer).pdf' },
    { id: 'r4', title: 'Biological Molecules Notes (Eshal)', url: '/documents/igcse/cambridge/Biology/4-Biological molecules/Bio chapter 4 - Biological molecules.pdf' },

    ],
    quizzes: []

  },
  'biology-5': {
    videos: [],
    resources: [{ id: 'r1', title: 'Enzymes Notes (HAF)', url: '/documents/igcse/cambridge/Biology/5-Enzymes/Bio chapter 5 (HAF).pdf' },
    { id: 'r2', title: 'Enzymes (@PISANG)', url: 'https://drive.google.com/file/d/1O2eAMklSCQFlAFM-hNWK726Ky1-_5rk2/preview?usp=drive_link' },
    { id: 'r3', title: 'Enzymes (a.aseer)', url: '/documents/igcse/cambridge/Biology/5-Enzymes/Enzymes (a.aseer).pdf' },
    { id: 'r4', title: 'Enzymes Notes (Eshal)', url: '/documents/igcse/cambridge/Biology/5-Enzymes/Bio chapter 5 - Enzymes.pdf' }],
    quizzes: []
  },
  'biology-6': {
    videos: [],
    resources: [{ id: 'r1', title: 'Plant Nutrition Notes (HAF)', url: '/documents/igcse/cambridge/Biology/6-Plant nutrition/Bio chapter 6 (HAF).pdf' },
    { id: 'r3', title: 'Plant Nutrition Notes (a.aseer)', url: '/documents/igcse/cambridge/Biology/6-Plant nutrition/Plant nutrition (a.aseer).pdf' },
    { id: 'r2', title: 'Plant Nutrition Notes (Eshal)', url: '/documents/igcse/cambridge/Biology/6-Plant nutrition/Bio chapter 6 - Plant nutrition.pdf' }],
    quizzes: []
  },
  'biology-7': {
    videos: [],
    resources: [{ id: 'r1', title: 'Human Nutrition Notes (HAF)', url: '/documents/igcse/cambridge/Biology/7-Human nutrition/Bio chapter 7 (HAF).pdf' },
    { id: 'r2', title: 'Human Nutrition Notes (a.aseer)', url: '/documents/igcse/cambridge/Biology/7-Human nutrition/Human nutrition (a.aseer).pdf' },
    { id: 'r3', title: 'Human Nutrition Notes (Eshal)', url: '/documents/igcse/cambridge/Biology/7-Human nutrition/Bio chapter 7 - Human nutrition.pdf' },
    ],
    quizzes: []
  },
  'biology-8': {
    videos: [],
    resources: [{ id: 'r1', title: 'Transport in Plants Notes (HAF)', url: '/documents/igcse/cambridge/Biology/8-Transport in plants/Bio chapter 8 (HAF).pdf' },
    { id: 'r2', title: 'Transport in Plants Notes (a.aseer)', url: '/documents/igcse/cambridge/Biology/8-Transport in plants/Transport in plants (a.aseer).pdf' },
    { id: 'r3', title: 'Transport in Plants Notes (Eshal)', url: '/documents/igcse/cambridge/Biology/8-Transport in plants/Bio chapter 8 - Transport in plants.pdf' }],
    quizzes: []
  },
  'biology-9': {
    videos: [],
    resources: [{ id: 'r1', title: 'Transport in Animals Notes (HAF)', url: '/documents/igcse/cambridge/Biology/9-Transport in animals/Bio chapter 9 (HAF).pdf' },
    { id: 'r2', title: 'Transport in Animals Notes (a.aseer)', url: '/documents/igcse/cambridge/Biology/9-Transport in animals/Transport in animals (a.aseer).pdf' },
    { id: 'r3', title: 'Transport in Animals Notes (Eshal)', url: '/documents/igcse/cambridge/Biology/9-Transport in animals/Bio chapter 9 - Transport in animals.pdf' },],
    quizzes: []
  },
  'biology-10': {
    videos: [],
    resources: [{ id: 'r1', title: 'Diseases and Immunity Notes (HAF)', url: '/documents/igcse/cambridge/Biology/10-Diseases and immunity/Bio chapter 10 (HAF).pdf' },
    { id: 'r3', title: 'Diseases and Immunity Notes (a.aseer)', url: '/documents/igcse/cambridge/Biology/10-Diseases and immunity/Diseases and immunity (a.aseer).pdf' },
    { id: 'r2', title: 'Diseases and Immunity Notes (Eshal)', url: '/documents/igcse/cambridge/Biology/10-Diseases and immunity/Bio chapter 10 - Diseases and immunity.pdf' }],
    quizzes: []
  },




  'biology-11': {
    videos: [],
    resources: [{ id: 'r1', title: 'Gas Exchange in Animals Notes (HAF)', url: '/documents/igcse/cambridge/Biology/11-Gas exchange in humans/Bio chapter 11 (HAF).pdf' },
    { id: 'r2', title: 'Gas Exchange in Humans Notes (a.aseer)', url: '/documents/igcse/cambridge/Biology/11-Gas exchange in humans/Gas exchange in humans (a.aseer).pdf' },
    { id: 'r3', title: 'Gas Exchange in Animals Notes (Eshal)', url: '/documents/igcse/cambridge/Biology/11-Gas exchange in humans/Bio chapter 11 - Gas exchange in humans.pdf' },
    ],
    quizzes: []
  },
  'biology-12': {
    videos: [],
    resources: [{ id: 'r1', title: 'Respiration Notes (HAF)', url: '/documents/igcse/cambridge/Biology/12-Respiration/Bio chapter 12 (HAF).pdf' },
    { id: 'r2', title: 'Respiration (@PISANG)', url: 'https://drive.google.com/file/d/1tgq3R0dAWN0rgijhrdxZUFcAKhM8Hlwh/preview?usp=drive_link' },
    { id: 'r3', title: 'Respiration (a.aseer)', url: '/documents/igcse/cambridge/Biology/12-Respiration/Respiration (a.aseer).pdf' },
    { id: 'r4', title: 'Respiration Notes (Eshal)', url: '/documents/igcse/cambridge/Biology/12-Respiration/Bio chapter 12 - Respiration.pdf' },
    ],
    quizzes: []
  },
  'biology-13': {
    videos: [],
    resources: [{ id: 'r1', title: 'Excretion in Humans Notes (HAF)', url: '/documents/igcse/cambridge/Biology/13-Excretion in humans/Bio chapter 13 (HAF).pdf' },
    { id: 'r2', title: 'Excretion in Humans (@PISANG)', url: 'https://drive.google.com/file/d/1qYFpKtgEtaqZ1dXUJoeM1ImnHoZIgnPj/preview?usp=drive_link' },
    { id: 'r3', title: 'Excretion in Humans Notes (a.aseer)', url: '/documents/igcse/cambridge/Biology/13-Excretion in humans/Excretion in humans (a.aseer).pdf' },
    { id: 'r4', title: 'Excretion in Humans Notes (Eshal)', url: '/documents/igcse/cambridge/Biology/13-Excretion in humans/Bio chapter 13 - Excretion in humans.pdf' }],
    quizzes: []
  },

  'biology-14': {
    videos: [],
    resources: [{ id: 'r1', title: 'Coordination and Response Notes (HAF)', url: '/documents/igcse/cambridge/Biology/14-Coordination and response/Bio chapter 14 (HAF).pdf' },
    { id: 'r2', title: 'Coordination and Response Notes (a.aseer)', url: '/documents/igcse/cambridge/Biology/14-Coordination and response/Coordination and response (a.aseer).pdf' },
    { id: 'r3', title: 'Coordination and Response Notes (Eshal)', url: '/documents/igcse/cambridge/Biology/14-Coordination and response/Bio chapter 14 - Coordination and response.pdf' }],
    quizzes: []
  },
  'biology-15': {
    title: 'Drugs',
    videos: [],
    resources: [{ id: 'r1', title: 'Drugs Notes (HAF)', url: '/documents/igcse/cambridge/Biology/15-Drugs/Bio chapter 15 (HAF).pdf' },
    { id: 'r2', title: 'Drugs Notes (a.aseer)', url: '/documents/igcse/cambridge/Biology/15-Drugs/Drugs (a.aseer).pdf' },
    { id: 'r3', title: 'Drugs Notes(Eshal)', url: '/documents/igcse/cambridge/Biology/15-Drugs/Bio chapter 15 - Drugs.pdf' }],
    quizzes: []
  },

  'biology-16': {
    videos: [],
    resources: [{ id: 'r1', title: 'Reproduction Notes (HAF)', url: '/documents/igcse/cambridge/Biology/16-Reproduction/Bio chapter 16 (HAF).pdf' },

    { id: 'r2', title: 'Reproduction Notes (@PISANG)', url: 'https://drive.google.com/file/d/1tgq3R0dAWN0rgijhrdxZUFcAKhM8Hlwh/preview?usp=drive_link' }
      , { id: 'r3', title: 'Reproduction Notes (a.aseer)', url: '/documents/igcse/cambridge/Biology/16-Reproduction/Reproduction (a.aseer).pdf' },
    { id: 'r4', title: 'Reproduction Notes (Eshal)', url: '/documents/igcse/cambridge/Biology/16-Reproduction/Bio chapter 16 - Reproduction.pdf' }],
    quizzes: []
  },
  'biology-17': {
    videos: [],
    resources: [{ id: 'r1', title: 'Inheritance Notes (HAF)', url: '/documents/igcse/cambridge/Biology/17-Inheritance/Bio chapter 17 (HAF).pdf' },
    { id: 'r2', title: 'Inheritance Notes (Eshal)', url: '/documents/igcse/cambridge/Biology/17-Inheritance/Bio chapter 17 - Inheritance.pdf' },
    { id: 'r3', title: 'Inheritance Notes (a.aseer)', url: '/documents/igcse/cambridge/Biology/17-Inheritance/Inheritance (a.aseer).pdf' }],
    quizzes: []
  },
  'biology-18': {
    videos: [],
    resources: [{ id: 'r1', title: 'Variation and Selection Notes (HAF)', url: '/documents/igcse/cambridge/Biology/18-Variation and selection/Bio chapter 18 (HAF).pdf' },
    { id: 'r2', title: 'Variation and selection (a.aseer)', url: '/documents/igcse/cambridge/Biology/18-Variation and selection/Variation and selection (a.aseer).pdf' },
    { id: 'r3', title: 'Variation and Selection Notes (Eshal)', url: '/documents/igcse/cambridge/Biology/18-Variation and selection/Bio chapter 18 - Variation and selection.pdf' }],
    quizzes: []
  },
  'biology-19': {
    videos: [],
    resources: [{ id: 'r1', title: 'Organisms and their Environment Notes (HAF)', url: '/documents/igcse/cambridge/Biology/19-Organisms and their environment/Bio chapter 19 (HAF).pdf' },
    { id: 'r2', title: 'Organisms and their Environment Notes (a.aseer)', url: '/documents/igcse/cambridge/Biology/19-Organisms and their environment/Organisms and their environment (a.aseer).pdf' },
    { id: 'r3', title: 'Organisms and their Environment Notes (Eshal)', url: '/documents/igcse/cambridge/Biology/19-Organisms and their environment/Bio chapter 19 - Organisms and their environment.pdf' }],
    quizzes: []
  },
  'biology-20': {
    videos: [],
    resources: [{ id: 'r1', title: 'Human Influences on Ecosystems Notes (HAF)', url: '/documents/igcse/cambridge/Biology/20-Human influences on ecosystems/Bio chapter 20 (HAF).pdf' },
    { id: 'r2', title: 'Human Influences on Ecosystems Notes (a.aseer)', url: '/documents/igcse/cambridge/Biology/20-Human influences on ecosystems/Human influences on ecosystems (a.aseer).pdf' },
    { id: 'r3', title: 'Human Influences on Ecosystems Notes(Eshal)', url: '/documents/igcse/cambridge/Biology/20-Human influences on ecosystems/Bio chapter 20 - Human influences on ecosystems.pdf' }],
    quizzes: []
  },
  'biology-21': {
    videos: [],
    resources: [{ id: 'r1', title: 'Biotechnology and genetic modification Notes (HAF)', url: '/documents/igcse/cambridge/Biology/21-Biotechnology and genetic modification/Bio chapter 21 (HAF).pdf' },
    { id: 'r2', title: 'Biotechnology and genetic modification Notes (a.aseer)', url: '/documents/igcse/cambridge/Biology/21-Biotechnology and genetic modification/Biotechnology and genetic modification (a.aseer).pdf' },
    { id: 'r3', title: 'Biotechnology and genetic modification Notes(Eshal)', url: '/documents/igcse/cambridge/Biology/21-Biotechnology and genetic modification/Bio chapter 21 - Biotechnology and genetic modification.pdf' }],
    quizzes: []
  },

  'biology-paper-6': {
    resources: [{ id: 'r1', title: 'Biology ATP Analysis (Vasumitra)', url: '/documents/igcse/cambridge/Biology/Paper 6/Biology ATP Analysis (Vasumitra).pdf', description: 'Big thanks to: https://vasumitragajbhiye.com/' }, { id: 'r2', title: 'Biology Experiments (Vasumitra)', url: '/documents/igcse/cambridge/Biology/Paper 6/Biology Experiments (Vasumitra).pdf', description: 'Big thanks to: https://vasumitragajbhiye.com/' }],
    videos: [],
    quizzes: [
    ]

  },




  //------------------------------------------------------------------------------------------------------------------------------------------------------------
  'chemistry-full-revision': {
    videos: [],
    resources: [{ id: 'r3', title: 'Chemistry notes (Veda)', url: '/documents/igcse/cambridge/Chemistry/Full Revision/Chemistry Notes IGCSE - Veda.pdf', description: 'Notes  from: https://sites.google.com/view/vehemsstudyloft/home' },
    { id: 'r1', title: 'Chemistry Definitions (Vasumitra)', url: '/documents/igcse/cambridge/Chemistry/Full Revision/Chemistry Definitions (Vasumitra).pdf', description: 'Big thanks to: https://vasumitragajbhiye.com/' },
    { id: 'r2', title: 'Chemistry Notes (Vasumitra)', url: '/documents/igcse/cambridge/Chemistry/Full Revision/Chemistry Notes (Vasumitra).pdf', description: 'Big thanks to: https://vasumitragajbhiye.com/' }
    ],
    quizzes: [
      { id: 'q1', title: 'Chemistry Commonly Asked Questions (Vasumitra)', questionFile: '/Questions/igcse/cambridge/chemistry/Chemistry CAQ (Vasumitra).pdf', description: 'Big thanks to: https://vasumitragajbhiye.com/' },]
  },

  'chemistry-1': {
    videos: [],
    resources: [{ id: 'r1', title: 'States of Matter Notes (a.aseer)', url: '/documents/igcse/cambridge/Chemistry/1 States of matter/States of matter (a.aseer).pdf' },],
    quizzes: []
  },
  'chemistry-2': {
    videos: [],

    resources: [{ id: 'r1', title: 'Atoms and Elements Notes (a.aseer)', url: '/documents/igcse/cambridge/Chemistry/2 Atoms, elements and compounds/Atoms and elements (a.aseer).pdf' },
    { id: 'r2', title: 'Bonding Notes (a.aseer)', url: '/documents/igcse/cambridge/Chemistry/2 Atoms, elements and compounds/Bonding (a.aseer).pdf' },

    { id: 'r3', title: 'Atoms, Elements and Compounds Notes (Eshal)', url: '/documents/igcse/cambridge/Chemistry/2 Atoms, elements and compounds/2 Atoms, elements and compounds.pdf' }],
    quizzes: []
  },

  'chemistry-3': {
    videos: [],
    resources: [{ id: 'r2', title: 'Stoichiometry Notes (a.aseer)', url: '/documents/igcse/cambridge/Chemistry/3 Stoichiometry/Stoichiometry (a.aseer).pdf' },
    { id: 'r1', title: 'Stoichiometry (Eshal)', url: '/documents/igcse/cambridge/Chemistry/3 Stoichiometry/3 Stoichiometry.pdf' }],
    quizzes: []
  },

  'chemistry-4': {
    videos: [],
    resources: [{ id: 'r1', title: 'Electrochemistry Notes (@PISANG)', url: 'https://drive.google.com/file/d/13hqvb_BRTV5BRebRko5wwTRJ0BBhS2v6/preview' },
    { id: 'r2', title: 'Electrolysis Notes (a.aseer)', url: '/documents/igcse/cambridge/Chemistry/4 Electrochemistry/Electrolysis (a.aseer).pdf' },
    { id: 'r3', title: 'Electrochemistry Notes (Eshal)', url: '/documents/igcse/cambridge/Chemistry/4 Electrochemistry/4 Electrochemistry.pdf' }],
    quizzes: []
  },


  'chemistry-5': {
    videos: [],
    resources: [{ id: 'r1', title: 'Chemical Energetics Notes (@PISANG)', url: 'https://drive.google.com/file/d/1C_FxrnxnykI-CW3Z348OklCx-546O2zB/preview' },
    { id: 'r2', title: 'Energetics Notes (a.aseer)', url: '/documents/igcse/cambridge/Chemistry/5 Chemical energetics/Energetics (a.aseer).pdf' },
    { id: 'r3', title: 'Chemical Energetics Notes (Eshal)', url: '/documents/igcse/cambridge/Chemistry/5 Chemical energetics/5 Chemical energetics.pdf' }],
    quizzes: []
  },


  'chemistry-6': {
    videos: [],
    resources: [{ id: 'r1', title: 'Chemical reaction Notes (@PISANG)', url: 'https://drive.google.com/file/d/1OyjsL-pn6BCJ2LDx9T8VihsO3gr6haYV/preview' },
    { id: 'r2', title: 'Rate of reaction Notes (a.aseer)', url: '/documents/igcse/cambridge/Chemistry/6 Chemical reactions/Rate of reaction (a.aseer).pdf' },
    { id: 'r3', title: 'Redox Reactions Notes (a.aseer)', url: '/documents/igcse/cambridge/Chemistry/6 Chemical reactions/Redox (a.aseer).pdf' },
    { id: 'r4', title: 'Reversible reactions and equilibrium (a.aseer)', url: '/documents/igcse/cambridge/Chemistry/6 Chemical reactions/Reversible reactions and equilibrium (a.aseer).pdf' },
    { id: 'r5', title: 'Chemical reactions (Eshal)', url: '/documents/igcse/cambridge/Chemistry/6 Chemical reactions/6 Chemical reactions.pdf' }],
    quizzes: []
  },

  'chemistry-7': {
    videos: [],
    resources: [{ id: 'r1', title: 'Acid bases and salts Notes (@PISANG)', url: 'https://drive.google.com/file/d/1U5np9rc80ENHPVT_venD-wmLmr2ljXXl/preview' },
    { id: 'r2', title: 'Acids and bases Notes (a.aseer)', url: '/documents/igcse/cambridge/Chemistry/7 Acids, bases and salts/Acids and bases (a.aseer).pdf' },
    { id: 'r3', title: 'Acids, bases and salts Notes (Eshal)', url: '/documents/igcse/cambridge/Chemistry/7 Acids, bases and salts/7 Acids, bases and salts.pdf' }],
    quizzes: []
  },

  'chemistry-8': {
    videos: [],
    resources: [{ id: 'r1', title: 'The Periodic Table(Eshal)', url: '/documents/igcse/cambridge/Chemistry/8 The Periodic Table/8 The Periodic Table.pdf' }],
    quizzes: []
  },

  'chemistry-9': {
    videos: [],
    resources: [{ id: 'r1', title: 'Metals Notes (@PISANG)', url: 'https://drive.google.com/file/d/1rBJQynX7n5yJpI0naU7gLOEaSvRUxyui/preview' },
    { id: 'r2', title: 'Metals Notes (a.aseer)', url: '/documents/igcse/cambridge/Chemistry/9 Metals/Metals (a.aseer).pdf' },
    { id: 'r3', title: 'Metals Notes (Eshal)', url: '/documents/igcse/cambridge/Chemistry/9 Metals/9 Metals.pdf' }],
    quizzes: []
  },



  'chemistry-10': {
    title: 'Chemistry of the environment',
    subject: 'Chemistry',
    curriculum: 'igcse',
    description: 'Explore the principles of air and water, including composition, pollution and treatment methods.',
    videos: [],
    resources: [{ id: 'r1', title: 'Chemistry of the Environment Notes (@PISANG)', url: 'https://drive.google.com/file/d/1lYJ-8Z9xC7S729FpZYvoV09lwlJVKOaJ/preview?usp=sharing' },
    { id: 'r2', title: 'Chemistry of the Environment Notes (a.aseer)', url: '/documents/igcse/cambridge/Chemistry/10 Chemistry of the environment/Chemistry of the environment (a.aseer).pdf' }
      , { id: 'r3', title: 'Chemistry of the Environment Notes (Eshal)', url: '/documents/igcse/cambridge/Chemistry/10 Chemistry of the environment/10 Chemistry of the environment.pdf' }],
    quizzes: []
  },

  'chemistry-11': {
    title: 'Organic chemistry',
    subject: 'Chemistry',
    curriculum: 'igcse',
    description: 'Explore the principles of organic chemistry, including hydrocarbons, polymers and fuels.',
    videos: [],
    resources: [{ id: 'r1', title: 'Organic Chemistry Notes (@PISANG)', url: 'https://drive.google.com/file/d/1QFz0lRao_bjKbQG-EPtxT_jKMwXZCNp3/preview?usp=sharing' },
    { id: 'r2', title: 'Organic Chemistry Notes (a.aseer)', url: '/documents/igcse/cambridge/Chemistry/11 Organic chemistry/Organic chemistry (a.aseer).pdf' },
    { id: 'r3', title: 'Organic Chemistry Notes (Eshal)', url: '/documents/igcse/cambridge/Chemistry/11 Organic chemistry/11 Organic chemistry.pdf' }],
    quizzes: []
  },

  'chemistry-12': {
    videos: [],
    resources: [
      { id: 'r1', title: 'Separation methods and instruments Notes (a.aseer)', url: '/documents/igcse/cambridge/Chemistry/12 Experimental techniques and chemical analysis/Separation methods and instruments (a.aseer).pdf' },
      { id: 'r2', title: 'Testing for anions and cations Notes (a.aseer)', url: '/documents/igcse/cambridge/Chemistry/12 Experimental techniques and chemical analysis/Testing for anions and cations (a.aseer).pdf' },
      { id: 'r3', title: 'Experimental techniques and chemical analysis Notes (Eshal)', url: '/documents/igcse/cambridge/Chemistry/12 Experimental techniques and chemical analysis/12 Experimental techniques and chemical analysis.pdf' }],
    quizzes: []
  },
  'chemistry-paper-6': {
    videos: [],
    resources: [{ id: 'r1', title: 'Chemistry ATP Analysis (Vasumitra)', url: '/documents/igcse/cambridge/Chemistry/Paper 6/Chemistry ATP Analysis (Vasumitra).pdf', description: 'Big thanks to: https://vasumitragajbhiye.com/' },
    { id: 'r2', title: 'Experimental techniques and chemical analysis Notes (Eshal)', url: '/documents/igcse/cambridge/Chemistry/12 Experimental techniques and chemical analysis/12 Experimental techniques and chemical analysis.pdf' }],
    quizzes: [
      { id: 'q1', title: 'Chemistry ATP 6 markers (Vasumitra)', questionFile: '/Questions/igcse/cambridge/chemistry/Chemistry ATP 6 markers (Vasumitra).pdf', description: 'Big thanks to: https://vasumitragajbhiye.com/' },
    ]
  },

  // IGCSE Physics topics
  'physics-full-revision': {
    videos: [],
    resources: [{ id: 'r3', title: 'Physics notes (Veda)', url: '/documents/igcse/cambridge/Physics/Full Revision/Physics Notes IGCSE - Veda.pdf', description: 'Notes  from: https://sites.google.com/view/vehemsstudyloft/home' },
    { id: 'r1', title: 'Physics Definitions (Vasumitra)', url: '/documents/igcse/cambridge/Physics/Full Revision/Physics Definitions (Vasumitra).pdf', description: 'Big thanks to: https://vasumitragajbhiye.com/' },
    { id: 'r2', title: 'Physics Notes (Vasumitra)', url: '/documents/igcse/cambridge/Physics/Full Revision/Physics Notes (Vasumitra).pdf', description: 'Big thanks to: https://vasumitragajbhiye.com/' }
    ],
    quizzes: [
      { id: 'q1', title: 'Physics Commonly Asked Questions (Vasumitra)', questionFile: '/Questions/igcse/cambridge/physics/Physics CAQ (Vasumitra).pdf', description: 'Big thanks to: https://vasumitragajbhiye.com/' },
    ]
  },

  'physics-1': {
    videos: [],
    resources: [{ id: 'r5', title: 'Motion, forces and energy Notes (@Jme)', url: '/documents/igcse/cambridge/Physics/1-Motion, forces and energy/Motion, forces and energy (@Jme).pdf' },
    { id: 'r1', title: 'Energy, Work and Power (a.aseer)', url: '/documents/igcse/cambridge/Physics/1-Motion, forces and energy/Energy, work and power (a.aseer).pdf' },
    { id: 'r2', title: 'Forces, Motion and Momentum (a.aseer)', url: '/documents/igcse/cambridge/Physics/1-Motion, forces and energy/Forces, motion and momentum (a.aseer).pdf' },
    { id: 'r3', title: 'Physical Quantities and Measurement Techniques (a.aseer)', url: '/documents/igcse/cambridge/Physics/1-Motion, forces and energy/Physical quantities and measurement techniques (a.aseer).pdf' },
    { id: 'r4', title: 'Pressure (a.aseer)', url: '/documents/igcse/cambridge/Physics/1-Motion, forces and energy/Pressure (a.aseer).pdf' }
    ],
    quizzes: []
  },

  'physics-2': {
    videos: [],
    resources: [{ id: 'r3', title: 'Thermal Physics (@Jme)', url: '/documents/igcse/cambridge/Physics/2-Thermal physics/Thermal physics (@Jme).pdf' },
    { id: 'r1', title: 'Thermal Physics (a.aseer)', url: '/documents/igcse/cambridge/Physics/2-Thermal physics/Thermal physics (a.aseer).pdf' },
    { id: 'r2', title: 'Thermal Physics (Eshal)', url: '/documents/igcse/cambridge/Physics/2-Thermal physics/Thermal physics.pdf' }],
    quizzes: []
  },

  'physics-3': {
    videos: [],
    resources: [{ id: 'r3', title: 'Waves (@Jme)', url: '/documents/igcse/cambridge/Physics/3-Waves/Waves (@Jme).pdf' },
    { id: 'r1', title: 'Waves (a.aseer)', url: '/documents/igcse/cambridge/Physics/3-Waves/Waves (a.aseer).pdf' },
    { id: 'r2', title: 'Waves (Eshal)', url: '/documents/igcse/cambridge/Physics/3-Waves/Waves.pdf' }],
    quizzes: []
  },

  'physics-4': {
    description: 'Explore electric circuits, electric fields, magnetic fields, and electromagnetic induction.',
    videos: [],
    resources: [{ id: 'r5', title: 'Electricity and magnetism (@Jme)', url: '/documents/igcse/cambridge/Physics/4-Electricity and magnetism/Electricity & magnetism (@Jme).pdf' },
    { id: 'r1', title: 'Electricity (a.aseer)', url: '/documents/igcse/cambridge/Physics/4-Electricity and magnetism/Electricity (a.aseer).pdf' },
    { id: 'r2', title: 'Magnetism (a.aseer)', url: '/documents/igcse/cambridge/Physics/4-Electricity and magnetism/Magnetism (a.aseer).pdf' },
    { id: 'r3', title: 'Electricity and magnetism (Eshal)', url: '/documents/igcse/cambridge/Physics/4-Electricity and magnetism/Electricity and magnetism.pdf' },

    { id: 'r4', title: 'Electromagnetism (Eshal)', url: '/documents/igcse/cambridge/Physics/4-Electricity and magnetism/Electromagnetism.pdf' }],
    quizzes: []
  },

  'physics-5': {
    videos: [],
    resources: [{ id: 'r3', title: 'Nuclear Physics (@Jme)', url: '/documents/igcse/cambridge/Physics/5-Nuclear physics/Nuclear physics (@Jme).pdf' },
    { id: 'r1', title: 'Nuclear Physics (a.aseer)', url: '/documents/igcse/cambridge/Physics/5-Nuclear physics/Nuclear physics (a.aseer).pdf' },
    { id: 'r2', title: 'Nuclear Physics (Eshal)', url: '/documents/igcse/cambridge/Physics/5-Nuclear physics/Nuclear physics.pdf' }],
    quizzes: []
  },

  'physics-6': {
    videos: [],
    resources: [{ id: 'r3', title: 'Space Physics (@Jme)', url: '/documents/igcse/cambridge/Physics/6-Space physics/Space physics (@Jme).pdf' },
    { id: 'r1', title: 'Space Physics (a.aseer)', url: '/documents/igcse/cambridge/Physics/6-Space physics/Space physics (a.aseer).pdf' },
    { id: 'r2', title: 'Space Physics (Eshal)', url: '/documents/igcse/cambridge/Physics/6-Space physics/Space physics.pdf' }],
    quizzes: []
  },

  'physics-paper-6': {
    videos: [],
    resources: [{ id: 'r2', title: 'Physics ATP Analysis (Vasumitra).pdf', url: '/documents/igcse/cambridge/Physics/Paper 6/Physics ATP Analysis (Vasumitra).pdf', description: 'Big thanks to: https://vasumitragajbhiye.com/' }, { id: 'r1', title: 'Physics ATP notes', url: '/documents/igcse/cambridge/Physics/Paper 6/Physics ATP Notes.pdf' }],
    quizzes: [
      { id: 'q1', title: 'Physics ATP 7 markers (Vasumitra)', questionFile: '/Questions/igcse/cambridge/physics/Physics ATP 7 markers (Vasumitra).pdf', description: 'Big thanks to: https://vasumitragajbhiye.com/' },
    ]
  },

  // Chemistry topics T1..T5 (U1)

  //------------------------------------------------------------------------------------------------------------------------------------------------------------


  'chemistry-CH1': {
    videos: [],
    resources: [{ id: 'r2', title: 'Atomic Structure Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/1-Atomic structure/Unit 1.pdf' },
    { id: 'r1', title: 'Atomic Structure Notes (@Mockingbird)', url: '/documents/alevel/cambridge/Chemistry/AS/1-Atomic structure/Atomic Structure.pdf' }
      ,
    ],
    quizzes: []
  },
  'chemistry-CH2': {
    videos: [],
    resources: [{ id: 'r2', title: 'Atom, molecules and stiochimetry (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/2-Atoms, molecules and stoichiometry/Unit 2.pdf' },
    { id: 'r1', title: 'Atom, molecules and stiochimetry (@Mockingbird)', url: '/documents/alevel/cambridge/Chemistry/AS/2-Atoms, molecules and stoichiometry/Atoms, molecules and stoichiometry.pdf' }
      ,
    ],
    quizzes: []
  },
  'chemistry-CH3': {
    videos: [],
    resources: [{ id: 'r2', title: 'Chemical bonding Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/3-Chemical bonding/Unit 3.pdf' }
      , { id: 'r1', title: 'Chemical bonding Notes (@Mockingbird)', url: '/documents/alevel/cambridge/Chemistry/AS/3-Chemical bonding/Chemical bonding.pdf' }

    ],
    quizzes: []
  },
  'chemistry-CH4': {
    videos: [],
    resources: [{ id: 'r2', title: 'States of Matter Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/4-States of matter/Unit 4.pdf' },
    { id: 'r1', title: 'States of Matter Notes (@Mockingbird)', url: '/documents/alevel/cambridge/Chemistry/AS/4-States of matter/States of Matter.pdf' },
    ]
    ,
    quizzes: []
  },
  'chemistry-CH5': {
    videos: [],
    resources: [{ id: 'r2', title: 'Chemical Energetics Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/5-Chemical energetics/Unit 5.pdf' },
    { id: 'r1', title: 'Chemical Energetics Notes (@Mockingbird)', url: '/documents/alevel/cambridge/Chemistry/AS/5-Chemical energetics/Chemical Energetics.pdf' }
      ,
    ],
    quizzes: []
  },
  'chemistry-CH6': {
    videos: [],
    resources: [{ id: 'r2', title: 'Electrochemistry Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/6-Electrochemistry/Unit 6.pdf' }
      , { id: 'r1', title: 'Electrochemistry Notes (@Mockingbird)', url: '/documents/alevel/cambridge/Chemistry/AS/6-Electrochemistry/Electrochemistry.pdf' }
      ,
    ],
    quizzes: []
  },
  'chemistry-CH7': {
    videos: [],
    resources: [
      { id: 'r1', title: 'The Periodic Table Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/7-Equilibria/Unit 7.pdf' }
    ],
    quizzes: []
  },
  'chemistry-CH8': {
    videos: [],
    resources: [{ id: 'r2', title: 'Reaction kinetics Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/8-Reaction kinetics/Unit 8.pdf' },
    { id: 'r1', title: 'Reaction kinetics Notes (@Mockingbird)', url: '/documents/alevel/cambridge/Chemistry/AS/8-Reaction kinetics/Reaction kinetics.pdf' },

    ],
    quizzes: []
  },
  'chemistry-CH9': {
    videos: [],
    resources: [{ id: 'r1', title: 'The Periodic Table chemical periodicity Notes (@Mockingbird)', url: '/documents/alevel/cambridge/Chemistry/AS/9-The Periodic Table: chemical periodicity/The Periodic Table chemical periodicity.pdf' },
    { id: 'r2', title: 'The Periodic Table chemical periodicity Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/9-The Periodic Table: chemical periodicity/Unit 9.pdf' }],
    quizzes: []
  },
  'chemistry-CH10': {
    videos: [],
    resources: [{ id: 'r1', title: 'Group 2 (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/10-Group 2/Unit 10.pdf' }],
    quizzes: []
  },
  'chemistry-CH11': {
    videos: [],
    resources: [{ id: 'r2', title: 'Group 17 (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/11-Group 17/Unit 11.pdf' },
    ],
    quizzes: []
  },
  'chemistry-CH12': {
    videos: [],
    resources: [{ id: 'r2', title: 'Nitrogen and sulfur (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/12-Nitrogen and sulfur/Unit 12.pdf' },
    ],
    quizzes: []
  },
  'chemistry-CH13': {
    videos: [],
    resources: [{ id: 'r1', title: 'Introduction to AS Level organic chemistry (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/13-An introduction to AS Level organic chemistry/Unit 13.pdf' }],
    quizzes: []
  },
  'chemistry-CH14': {
    videos: [],
    resources: [{ id: 'r1', title: 'Hydrocarbons Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/14-Hydrocarbons/Unit 14.pdf' }],
    quizzes: []
  },
  'chemistry-CH15': {
    videos: [],
    resources: [{ id: 'r1', title: 'Halogen compounds Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/15-Halogen compounds/Unit 15.pdf' }],
    quizzes: []
  },
  'chemistry-CH16': {
    videos: [],
    resources: [{ id: 'r1', title: 'Hydroxy compounds (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/16-Hydroxy compounds/Unit 16.pdf' }],

    quizzes: []
  },
  'chemistry-CH17': {
    videos: [],
    resources: [{ id: 'r1', title: 'Carbonyl compounds Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/17-Carbonyl compounds/Unit 17.pdf' }],
    quizzes: []
  },
  'chemistry-CH18': {
    videos: [],
    resources: [{ id: 'r1', title: 'Carboxylic acids and derivatives Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/18-Carboxylic acids and derivatives/Unit 18.pdf' }],
    quizzes: []
  },
  'chemistry-CH19': {
    videos: [],
    resources: [{ id: 'r1', title: 'Nitrogen compounds Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/19-Nitrogen compounds/Unit 19.pdf' }],
    quizzes: []
  },
  'chemistry-CH20': {
    videos: [],
    resources: [{ id: 'r1', title: 'Polymerisation Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS/20-Polymerisation/Unit 20.pdf' }],
    quizzes: []
  },
  'chemistry-AS-revision': {
    videos: [],
    resources: [{ id: 'r1', title: 'AS organic reactions (Eshal)', url: '/documents/alevel/cambridge/Chemistry/AS organic reactions.pdf' },
    { id: 'r2', title: 'AS Chemistry notes (Veda)', url: '/documents/alevel/cambridge/Chemistry/AS/AS revision/Chemistry Notes AS - Veda.pdf', description: 'Notes  from: https://sites.google.com/view/vehemsstudyloft/home' },
    ],
    quizzes: []
  },
  //--------------(Cambridge A-Level Chemistry (A2) topics)--------------------------------------
  'chemistry-CH23': {
    videos: [],
    resources: [{ id: 'r1', title: 'Chemical energetics Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/A2/23-Chemical energetics/Unit 23.pdf' }],
    quizzes: []
  },
  'chemistry-CH24': {
    videos: [],
    resources: [{ id: 'r1', title: 'Electrochemistry Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/A2/24-Electrochemistry/Unit 24.pdf' }],
    quizzes: []
  },
  'chemistry-CH25': {
    videos: [],
    resources: [{ id: 'r1', title: 'Equilibria Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/A2/25-Equilibria/Unit 25.pdf' }],
    quizzes: []
  },
  'chemistry-CH26': {
    videos: [],
    resources: [{ id: 'r1', title: 'Reaction kinetics Notes(Eshal)', url: '/documents/alevel/cambridge/Chemistry/A2/26-Reaction kinetics/Unit 26.pdf' }],
    quizzes: []
  },
  'chemistry-CH27': {
    videos: [],
    resources: [{ id: 'r1', title: 'Group 2 Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/A2/27-Group 2/Unit 27.pdf' }],
    quizzes: []
  },
  'chemistry-CH28': {
    videos: [],
    resources: [{ id: 'r1', title: 'Chemistry of transition elements Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/A2/28-Chemistry of transition elements/Unit 28.pdf' }],
    quizzes: []
  },
  'chemistry-CH29': {
    videos: [],
    resources: [{ id: 'r1', title: 'An introduction to A Level organic chemistry Notes(Eshal)', url: '/documents/alevel/cambridge/Chemistry/A2/29-An introduction to A Level organic chemistry/Unit 29.pdf' }],
    quizzes: []
  },
  'chemistry-CH30': {
    videos: [],
    resources: [{ id: 'r1', title: 'Hydrocarbons Notes Eshal)', url: '/documents/alevel/cambridge/Chemistry/A2/30-Hydrocarbons/Unit 30.pdf' }],
    quizzes: []
  },
  'chemistry-CH31': {
    videos: [],
    resources: [{ id: 'r1', title: 'Halogen compounds Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/A2/31-Halogen compounds/Unit 31.pdf' }],
    quizzes: []
  },
  'chemistry-CH32': {
    videos: [],
    resources: [{ id: 'r1', title: 'Hydroxy compounds Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/A2/32-Hydroxy compounds/Unit 32.pdf' }],
    quizzes: []
  },
  'chemistry-CH33': {
    videos: [],
    resources: [{ id: 'r1', title: 'Carboxylic acids and derivatives Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/A2/33-Carboxylic acids and derivatives/Unit 33.pdf' }],
    quizzes: []
  },
  'chemistry-CH34': {
    videos: [],
    resources: [{ id: 'r1', title: 'Nitrogen compounds Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/A2/34-Nitrogen compounds/Unit 34.pdf' }],
    quizzes: []
  },
  'chemistry-CH35': {
    videos: [],
    resources: [{ id: 'r1', title: 'Polymerisation Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/A2/35-Polymerisation/Unit 35.pdf' }],
    quizzes: []
  },
  'chemistry-CH36': {
    videos: [],
    resources: [{ id: 'r1', title: 'Organic synthesis Notes (Eshal)', url: '/documents/alevel/cambridge/Chemistry/A2/36-Organic synthesis/Unit 36.pdf' }],
    quizzes: []
  },


  'chemistry-A2-revision': {
    videos: [],
    resources: [{ id: 'r3', title: 'A2 Chemistry notes (Veda)', url: '/documents/alevel/cambridge/Chemistry/A2/A2 revision/Chemistry Notes A2 - Veda.pdf', description: 'Notes  from: https://sites.google.com/view/vehemsstudyloft/home' },
    { id: 'r1', title: 'A2 organic reactions(Eshal)', url: '/documents/alevel/cambridge/Chemistry/A2 organic reactions.pdf' },
    { id: 'r2', title: 'Synthetic Routes(Eshal)', url: '/documents/alevel/cambridge/Chemistry/Synthetic Routes.pdf' }
    ],
    quizzes: []
  },











  // Cambridge A-Level Biology (AS)
  'Biology-CH1': { videos: [], resources: [{ id: 'r1', title: 'Cell structure (Eshal)', url: '/documents/alevel/cambridge/Biology/AS/1. Cell structure/Unit 1.pdf' }], quizzes: [] },
  'Biology-CH2': { videos: [], resources: [{ id: 'r1', title: 'Biological molecules (Eshal)', url: '/documents/alevel/cambridge/Biology/AS/2. Biological molecules/Unit 2.pdf' }], quizzes: [] },
  'Biology-CH3': { videos: [], resources: [{ id: 'r1', title: 'Enzymes (Eshal)', url: '/documents/alevel/cambridge/Biology/AS/3. Enzymes/Unit 3.pdf' }], quizzes: [] },
  'Biology-CH4': { videos: [], resources: [{ id: 'r1', title: 'Cell membranes and transport (Eshal)', url: '/documents/alevel/cambridge/Biology/AS/4. Cell membranes and transport/Unit 4.pdf' }], quizzes: [] },
  'Biology-CH5': { videos: [], resources: [{ id: 'r1', title: 'The mitotic cell cycle (Eshal)', url: '/documents/alevel/cambridge/Biology/AS/5. The mitotic cell cycle/Unit 5.pdf' }], quizzes: [] },
  'Biology-CH6': { videos: [], resources: [{ id: 'r1', title: 'Nucleic acids and protein synthesis (Eshal)', url: '/documents/alevel/cambridge/Biology/AS/6. Nucleic acids and protein synthesis/Unit 6.pdf' }], quizzes: [] },
  'Biology-CH7': { videos: [], resources: [{ id: 'r1', title: 'Transport in plants (Eshal)', url: '/documents/alevel/cambridge/Biology/AS/7. Transport in plants/Unit 7.pdf' }], quizzes: [] },
  'Biology-CH8': { videos: [], resources: [{ id: 'r1', title: 'Transport in mammals (Eshal)', url: '/documents/alevel/cambridge/Biology/AS/8. Transport in mammals/Unit 8.pdf' }], quizzes: [] },
  'Biology-CH9': { videos: [], resources: [{ id: 'r1', title: 'Gas exchange (Eshal)', url: '/documents/alevel/cambridge/Biology/AS/9. Gas exchange/Unit 9.pdf' }], quizzes: [] },
  'Biology-CH10': { videos: [], resources: [{ id: 'r1', title: 'Infectious diseases (Eshal)', url: '/documents/alevel/cambridge/Biology/AS/10. Infectious diseases/Unit 10.pdf' }], quizzes: [] },
  'Biology-CH11': { videos: [], resources: [{ id: 'r1', title: 'Immunity (Eshal)', url: '/documents/alevel/cambridge/Biology/AS/11. Immunity/Unit 11.pdf' }], quizzes: [] },
  'Biology-AS-revision': { videos: [], resources: [{ id: 'r1', title: 'AS Biology notes (Veda)', url: '/documents/alevel/cambridge/Biology/AS/AS revision/Biology Notes AS - Veda.pdf', description: 'Notes  from: https://sites.google.com/view/vehemsstudyloft/home' },] },

  // Cambridge A-Level Biology (A2)
  'Biology-CH12': { videos: [], resources: [{ id: 'r1', title: 'Energy and respiration (Eshal)', url: '/documents/alevel/cambridge/Biology/A2/12. Energy and respiration/Unit 12.pdf' }], quizzes: [] },
  'Biology-CH13': { videos: [], resources: [{ id: 'r1', title: 'Photosynthesis (Eshal)', url: '/documents/alevel/cambridge/Biology/A2/13. Photosynthesis/Unit 13.pdf' }], quizzes: [] },
  'Biology-CH14': { videos: [], resources: [{ id: 'r1', title: 'Homeostasis (Eshal)', url: '/documents/alevel/cambridge/Biology/A2/14. Homeostasis/Unit 14.pdf' }], quizzes: [] },
  'Biology-CH15': { videos: [], resources: [{ id: 'r1', title: 'Control and coordination (Eshal)', url: '/documents/alevel/cambridge/Biology/A2/15. Control and coordination/Unit 15.pdf' }], quizzes: [] },
  'Biology-CH16': { videos: [], resources: [{ id: 'r1', title: 'Inheritance (Eshal)', url: '/documents/alevel/cambridge/Biology/A2/16. Inheritance/Unit 16.pdf' }], quizzes: [] },
  'Biology-CH17': { videos: [], resources: [{ id: 'r1', title: 'Selection and evolution (Eshal)', url: '/documents/alevel/cambridge/Biology/A2/17. Selection and evolution/Unit 17.pdf' }], quizzes: [] },
  'Biology-CH18': { videos: [], resources: [{ id: 'r1', title: 'Classification, biodiversity and conservation (Eshal)', url: '/documents/alevel/cambridge/Biology/A2/18. Classification, biodiversity and conservation/Unit 18.pdf' }], quizzes: [] },
  'Biology-CH19': { videos: [], resources: [{ id: 'r1', title: 'Genetic technology (Eshal)', url: '/documents/alevel/cambridge/Biology/A2/19. Genetic technology/Unit 19.pdf' }], quizzes: [] },
  'Biology-Paper5': { videos: [], resources: [{ id: 'r1', title: 'Paper 5 resources (Eshal)', url: '/documents/alevel/cambridge/Biology/A2/Paper 5/Paper 5 stuff.pdf' }], quizzes: [] },
  'Biology-A2-revision': { videos: [], resources: [{ id: 'r1', title: 'A2 Biology notes (Veda)', url: '/documents/alevel/cambridge/Biology/A2/A2 revision/Biology Notes A2 - Veda.pdf', description: 'Notes  from: https://sites.google.com/view/vehemsstudyloft/home' },] },





  'Biology-T1': {
    videos: [],
    resources: [{ id: 'r1', title: 'Molecules, Transport and Health Notes (@TheLivingAndDead)', url: '/documents/alevel/edexcel/Biology/1-Molecules, Transport and Health/Molecules, Transport and Health (TheLivingAndDead).pdf' },
    { id: 'r2', title: 'Biomolecules NOTES (@attorneighhh)', url: '/documents/alevel/edexcel/Biology/1-Molecules, Transport and Health/Biomolecules NOTES.pdf' },
    { id: 'r3', title: 'The Human Transport System NOTES (@attorneighhh)', url: '/documents/alevel/edexcel/Biology/1-Molecules, Transport and Health/The Human Transport System NOTES.pdf' },

    ],
    quizzes: []
  },

  'Biology-T2': {
    videos: [],
    resources: [
      { id: 'r1', title: 'Membranes, Proteins, DNA and Gene Expression (TheLivingAndDead)', url: '/documents/alevel/edexcel/Biology/2-Membranes, Proteins, DNA and Gene Expression/Membranes, Proteins, DNA and Gene Expression (TheLivingAndDead).pdf' },
      { id: 'r2', title: 'Proteins and Enzymes NOTES (@attorneighhh)', url: '/documents/alevel/edexcel/Biology/2-Membranes, Proteins, DNA and Gene Expression/Proteins and Enzymes NOTES.pdf' },
      { id: 'r3', title: 'Cell Membrane and Transport NOTES(@attorneighhh)', url: '/documents/alevel/edexcel/Biology/2-Membranes, Proteins, DNA and Gene Expression/Cell Membrane and Transport NOTES.pdf' },
      { id: 'r4', title: 'DNA, Genes, Mutations NOTES (@attorneighhh)', url: '/documents/alevel/edexcel/Biology/2-Membranes, Proteins, DNA and Gene Expression/DNA, Genes, Mutations NOTES.pdf' }
    ],
    quizzes: []
  },

  'Biology-Unit-1': {
    videos: [],
    resources: [{ id: 'r3', title: 'Unit 1 Biology Revision Notes', url: '/documents/alevel/edexcel/Biology/Unit-1/Unit 1 biology notes.pdf' },
    { id: 'r1', title: 'Unit 1 Biology Definitions', url: '/documents/alevel/edexcel/Biology/Unit-1/Unit 1 Biology Definitions.pdf' },
    ],

    quizzes: []
  },

  'Biology-T3': {
    videos: [],
    resources: [
      { id: 'r1', title: 'Cell Structure (TheLivingAndDead)', url: '/documents/alevel/edexcel/Biology/3-Cell Structure, Reproduction and Development/Cell Structure, Reproduction and Development (TheLivingAndDead).pdf' },
      { id: 'r2', title: 'Cell Structure NOTES (@attorneighhh)', url: '/documents/alevel/edexcel/Biology/3-Cell Structure, Reproduction and Development/Cell Structure NOTES.pdf' },
      { id: 'r3', title: 'Cell Division NOTES (@attorneighhh)', url: '/documents/alevel/edexcel/Biology/3-Cell Structure, Reproduction and Development/Cell Division NOTES.pdf' },
      { id: 'r4', title: 'Reproduction NOTES (@attorneighhh)', url: '/documents/alevel/edexcel/Biology/3-Cell Structure, Reproduction and Development/Reproduction NOTES.pdf' },
      { id: 'r5', title: 'Stem Cells & Epigenetics NOTES (@attorneighhh)', url: '/documents/alevel/edexcel/Biology/3-Cell Structure, Reproduction and Development/Stem Cells & Epigenetics NOTES.pdf' },
      { id: 'r6', title: 'Topic 3 Definitions (TheLivingAndDead)', url: '/documents/alevel/edexcel/Biology/3-Cell Structure, Reproduction and Development/Topic 3 Definitions.pdf' }
    ],
    quizzes: []
  },

  'Biology-T4': {
    videos: [],
    resources: [
      { id: 'r1', title: 'Plant Structure and Function, Biodiversity and Conservation (TheLivingAndDead)', url: '/documents/alevel/edexcel/Biology/4–Plant Structure and Function, Biodiversity and Conservation/Plant Structure and Function, Biodiversity and Conservation (TheLivingAndDead).pdf' },
      { id: 'r2', title: 'Plants NOTES (@attorneighhh)', url: '/documents/alevel/edexcel/Biology/4–Plant Structure and Function, Biodiversity and Conservation/Plants NOTES.pdf' },
      { id: 'r3', title: 'Biodiversity & Conservation NOTES (@attorneighhh)', url: '/documents/alevel/edexcel/Biology/4–Plant Structure and Function, Biodiversity and Conservation/Biodiversity & Conservarion NOTES.pdf' },
      { id: 'r4', title: 'Topic 4 Definitions (TheLivingAndDead)', url: '/documents/alevel/edexcel/Biology/4–Plant Structure and Function, Biodiversity and Conservation/Topic 4 Definitions.pdf' }
    ],
    quizzes: []
  },



  'Biology-Unit-2': {
    videos: [],
    resources: [{ id: 'r2', title: 'Biology Notes from MS (MTK)', url: '/documents/alevel/edexcel/Biology/Unit-2/U2 IAS Biology NFMS(MTK).pdf' },
    { id: 'r4', title: 'Biology Model Answers (MTK)', url: '/documents/alevel/edexcel/Biology/Unit-2/U2 IAS Biology Model Answers.pdf' },
    { id: 'r3', title: 'Unit 2 Biology Revision Notes', url: '/documents/alevel/edexcel/Biology/Unit-2/Unit 2 biology notes.pdf' },
    { id: 'r1', title: 'Unit 2 Biology Definitions', url: '/documents/alevel/edexcel/Biology/Unit-2/Unit 2 Biology Definitions.pdf' },],

    quizzes: []
  },


  'Biology-T5': {
    videos: [],
    resources: [{ id: 'r2', title: 'IAL Biology U4 topic 5 Self-Study booklet (@ppac_pp).pdf', url: '/documents/alevel/edexcel/Biology/5-Energy Flow, Ecosystems and the Environment/IAL Biology U4 topic 5 Self-Study booklet (@ppac_pp).pdf' },
    { id: 'r1', title: 'Energy and Ecosystems notes', url: '/documents/alevel/edexcel/Biology/5-Energy Flow, Ecosystems and the Environment/A2 BIOLOGY TOPIC 5.pdf' },
    ],
    quizzes: []
  },
  'Biology-T6': {
    videos: [],
    resources: [{ id: 'r2', title: 'IAL Biology U4 topic 6 Self-Study booklet (@ppac_pp).pdf', url: '/documents/alevel/edexcel/Biology/6-Microbiology, Immunity and Forensics/IAL Biology U4 topic 6 Self-Study booklet (@ppac_pp).pdf' },
    { id: 'r1', title: 'Microbiology, Immunity and Forensics notes', url: '/documents/alevel/edexcel/Biology/6-Microbiology, Immunity and Forensics/A2 BIOLOGY TOPIC 6.pdf' },
    ],
    quizzes: []
  },

  'Biology-Unit-3': {
    videos: [],
    resources: [{ id: 'r2', title: 'Biology IAS U3', url: '/documents/alevel/edexcel/Biology/Unit-3/Biology IAS U3.pdf' },

    { id: 'r1', title: 'Unit 3 Biology Mark Scheme Notes', url: '/documents/alevel/edexcel/Biology/Unit-3/Unit-3 Mark Scheme Notes.pdf' },],

    quizzes: [
      { questionFile: '/Questions/alevel/edexcel/biology/Unit-3/Biology Unit 3 FAQ.pdf', title: 'Unit 3 FAQ' }
    ]
  },

  'Biology-T7': {
    videos: [],
    resources: [{ id: 'r2', title: 'IAL Biology U5 topic 7 Self-Study booklet (@ppac_pp).pdf', url: '/documents/alevel/edexcel/Biology/7-Respiration, Muscles and the Internal Environment/IAL Biology U5 topic 7 Self-Study booklet (@ppac_pp).pdf' },
    { id: 'r1', title: 'Respiration, Muscles and the Internal Environment notes (Nour)', url: '/documents/alevel/edexcel/Biology/7-Respiration, Muscles and the Internal Environment/Respiration, Muscles and the Internal Environment (Nour).pdf' },
    ],
    quizzes: []
  },
  'Biology-T8': {
    videos: [],
    resources: [{ id: 'r2', title: 'IAL Biology U5 topic 8 Self-Study booklet (@ppac_pp).pdf', url: '/documents/alevel/edexcel/Biology/8-Coordination, Response and Gene Technology/IAL Biology U5 topic 8 Self-Study booklet (@ppac_pp).pdf' },
    { id: 'r1', title: 'Coordination, Response and Gene Technology notes (Nour)', url: '/documents/alevel/edexcel/Biology/8-Coordination, Response and Gene Technology/Coordination, Response and Gene Technology (Nour).pdf' },
    ],
    quizzes: []
  },

  'Biology-Unit-6': { resources: [{ id: 'r1', title: 'Biology IAS U6', url: '/documents/alevel/edexcel/Biology/Unit-6/Biology IAS U6.pdf' }], },

  'chemistry-T1': {
    videos: [],
    resources: [{ id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/1-Formulae, Equations and Amount of Substance/IAL Chemistry U1 topic 1 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' }],
    quizzes: []
  },
  'chemistry-T2': {
    title: 'Atomic Structure and the Periodic Table (U1)',
    subject: 'Chemistry',
    curriculum: 'A-Level',
    description: 'Explore atomic models, electronic structure, isotopes, and trends across the periodic table.',
    videos: [],
    resources: [{ id: 'r1', title: 'Atomic Structure Notes(HAF)', url: '/documents/alevel/edexcel/Chemistry/2-Atomic Structure and Periodic Table/Atomic Structure and the Periodic Table IAL Chem (HAF).pdf' },
    { id: 'r2', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/2-Atomic Structure and Periodic Table/IAL Chemistry U1 topic 2 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' },

    ],
    quizzes: []
  },


  'chemistry-T3': {
    title: 'Bonding and Structure (U1)',
    subject: 'Chemistry',
    curriculum: 'A-Level',
    description: 'Learn ionic, covalent and metallic bonding, molecular shapes, and how bonding relates to properties.',
    videos: [],
    resources: [{ id: 'r1', title: 'Bonding and Structure Notes(HAF)', url: '/documents/alevel/edexcel/Chemistry/3-Bonding and Structure/Bonding and Structure IAL Chem (HAF).pdf' },
    { id: 'r2', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/3-Bonding and Structure/IAL Chemistry U1 topic 3 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' }
    ],
    quizzes: []
  },


  'chemistry-T4': {
    title: 'Introductory Organic Chemistry and Alkanes (U1)',
    subject: 'Chemistry',
    curriculum: 'A-Level',
    description: 'Introduction to organic nomenclature, structure and properties of alkanes and simple reaction types.',
    videos: [],
    resources: [{ id: 'r2', title: 'Introductory Organic Chemistry and Alkanes Notes(HAF)', url: '/documents/alevel/edexcel/Chemistry/4-Introductory Organic Chemistry and Alkanes/Introductory Organic Chemistry and Alkanes IAL Chem (HAF).pdf' }
      , { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/4-Introductory Organic Chemistry and Alkanes/IAL Chemistry U1 topic 4 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' }
      ,
    ],
    quizzes: [
    ]
  },
  'chemistry-Unit-1': {
    videos: [],
    resources: [{ id: 'r1', title: 'Unit 1 summary (ThelivingAndDead)', url: '/documents/alevel/edexcel/Chemistry/Unit-1/Chemistry Unit 1 summary (ThelivingAndDead).pdf' },
    ],
    quizzes: []
  },

  'chemistry-T5': {
    description: 'Study structure, reactions and mechanisms of alkenes including addition reactions and polymerisation.',
    videos: [],
    resources: [{ id: 'r2', title: 'Alkenes Notes(HAF)', url: '/documents/alevel/edexcel/Chemistry/5-Alkenes/Alkenes IAL Chem (HAF).pdf' }
      , { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/5-Alkenes/IAL Chemistry U1 topic 5 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' }],
    quizzes: []
  },


  // Chemistry topics T6..T10 (U2)
  'chemistry-T6': { title: 'Energetics, Group Chemistry, Halogenoalkanes and Alcohols (U2)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Covers energy changes in reactions, group trends, and the chemistry of halogenoalkanes and alcohols.', videos: [], resources: [{ id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/6-Energetics/IAL Chemistry U2 topic 6 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' }, { id: 'r2', title: 'Energetics Notes (ThelivingAndDead)', url: '/documents/alevel/edexcel/Chemistry/6-Energetics/Energetics (ThelivingAndDead).pdf' }], quizzes: [] },
  'chemistry-T7': {
    resources: [{ id: 'r3', title: 'Intermolecular forces Notes(HAF)', url: '/documents/alevel/edexcel/Chemistry/7-Intermolecular Forces/Intermolecular Forces IAL Chem (HAF).pdf' }, {
      id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/7-Intermolecular Forces/IAL Chemistry U2 topic 7 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.'
    },
    { id: 'r2', title: 'Intermolecular Forces Notes (ThelivingAndDead)', url: '/documents/alevel/edexcel/Chemistry/7-Intermolecular Forces/Intermolecular Forces (ThelivingAndDead).pdf' }],
    quizzes: []
  },
  'chemistry-T8': {
    resources: [{ id: 'r3', title: 'Redox Chemistry Notes(HAF)', url: '/documents/alevel/edexcel/Chemistry/8-Redox Chemistry and Groups 1, 2 and 7/Redox Chemistry and Groups 1, 2 and 7 (HAF).pdf' },
    { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/8-Redox Chemistry and Groups 1, 2 and 7/IAL Chemistry U2 topic 8 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' }, { id: 'r2', title: 'Redox Chemistry Notes (ThelivingAndDead)', url: '/documents/alevel/edexcel/Chemistry/8-Redox Chemistry and Groups 1, 2 and 7/Redox Chemistry and Groups 1, 2 and 7 (ThelivingAndDead).pdf' }], quizzes: []
  },
  'chemistry-T9': { title: 'Introduction to Kinetics and Equilibria (U2)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Understand reaction rates, collision theory and the principles of chemical equilibrium.', videos: [], resources: [{ id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/9-Introduction to Kinetics and Equilibria/IAL Chemistry U2 topic 9 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' }, { id: 'r2', title: 'Kinetics and Equilibria Notes (ThelivingAndDead)', url: '/documents/alevel/edexcel/Chemistry/9-Introduction to Kinetics and Equilibria/Introduction to Kinetics and Equilibria (ThelivingAndDead).pdf' }], quizzes: [] },
  'chemistry-T10': {
    videos: [],
    resources: [{ id: 'r3', title: 'Halogenalkanes and Alcohols Notes(HAF)', url: '/documents/alevel/edexcel/Chemistry/10-Organic Chemistry: Halogenoalkanes, Alcohols and Spectra/Halogenalkanes and Alcohols (HAF).pdf' },
    { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/10-Organic Chemistry: Halogenoalkanes, Alcohols and Spectra/IAL Chemistry U2 topic 10 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' }, { id: 'r2', title: 'Organic Chemistry Notes (ThelivingAndDead)', url: '/documents/alevel/edexcel/Chemistry/10-Organic Chemistry: Halogenoalkanes, Alcohols and Spectra/Organic Chemistry: Halogenoalkanes, Alcohols and Spectra (ThelivingAndDead).pdf' }], quizzes: []
  },
  'chemistry-Unit-2': {
    videos: [],
    resources: [{ id: 'r1', title: 'Chemistry Unit 2 Notes from MS (MTK)', url: 'documents/alevel/edexcel/Chemistry/Unit-2/U2 IAS Chemistry NFMS(MTK).pdf' }],
    quizzes: [{
      title: 'Unit 2 CAQ(@Aeth_en)',
      questionFile: '/Questions/alevel/edexcel/chemistry/Unit-2/IAL Chemistry CAQs U2.pdf'
    }
    ]
  },

  'chemistry-Unit-3': {
    videos: [],
    resources: [{ id: 'r1', title: 'Unit 3 practical', url: '/documents/alevel/edexcel/Chemistry/Unit-3/Chemistry unit 3 (TheLivingAndDead).pdf' },
    { id: 'r2', title: 'Unit 3 Additional Practical Notes (ThelivingAndDead)', url: '/documents/alevel/edexcel/Chemistry/Unit-3/Unit 3 Additional Practical Notes (ThelivingAndDead).pdf' }
    ],
    quizzes: [{
      title: 'Unit 3 CAQ(@Aeth_en)',
      questionFile: '/Questions/alevel/edexcel/chemistry/Unit-3/IAL Chemistry CAQs U3.pdf'
    }]
  },

  // Chemistry topics T11..T15 (U4)
  'chemistry-T11': { title: 'Rates, Equilibria and Further Organic Chemistry (U4)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Advanced kinetics and equilibria topics plus extended organic chemistry concepts for A-level study.', videos: [], resources: [{ id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/11-Kinetics/IAL Chemistry U4 topic 11 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' }], quizzes: [] },
  'chemistry-T12': { title: 'Entropy and Energetics (U4)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Thermodynamics topics including enthalpy, entropy and spontaneity of reactions.', videos: [], resources: [{ id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/12-Entropy and Energetics/IAL Chemistry U4 topic 12 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' }], quizzes: [] },
  'chemistry-T13': { title: 'Chemical Equilibria (U4)', subject: 'Chemistry', curriculum: 'A-Level', description: 'In-depth study of equilibrium constants, Le Chatelier’s principle and calculations involving equilibria.', videos: [], resources: [{ id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/13-Chemical Equilibria/IAL Chemistry U4 topic 13 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' }], quizzes: [] },
  'chemistry-T14': { title: 'Acid-base Equilibria (U4)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Acid-base theories, pH calculations, buffers and titration curves for weak/strong acids and bases.', videos: [], resources: [{ id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/14-Acid-base Equilibria/IAL Chemistry U4 topic 14 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' }], quizzes: [] },
  'chemistry-T15':

  {
    videos: [],
    resources: [{ id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/15-Organic Chemistry: Carbonyls, Carboxylic Acids and Chirality/IAL Chemistry U4 topic 15 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' }], quizzes: []
  },



  // Chemistry topics T16..T20 (U5)
  'chemistry-T16': { title: 'Transition Metals and Organic Nitrogen Chemistry (U5)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Explore the chemistry of transition metals and nitrogen-containing organic molecules.', videos: [], resources: [{ id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/16-Redox Equilibria/IAL Chemistry U5 topic 16 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' }], quizzes: [] },
  'chemistry-T17': { title: 'Transition Metals and their Chemistry (U5)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Key properties, complex formation and reactions of transition metals.', videos: [], resources: [{ id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/17-Transition Metals and their Chemistry/IAL Chemistry U5 topic 17 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' }], quizzes: [] },
  'chemistry-T18': { title: 'Organic Chemistry – Arenes (U5)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Aromatic chemistry including electrophilic substitution and properties of arenes.', videos: [], resources: [{ id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/18-Organic Chemistry – Arenes/IAL Chemistry U5 topic 18 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' }], quizzes: [] },
  'chemistry-T19': { title: 'Organic Nitrogen Compounds: Amines, Amides, Amino Acids and Proteins (U5)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Structure, properties and reactions of amines, amides and biologically relevant nitrogen compounds.', videos: [], resources: [{ id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/19-Organic Nitrogen Compounds: Amines, Amides, Amino Acids and Proteins/IAL Chemistry U5 topic 19 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' }], quizzes: [] },
  'chemistry-T20': { title: 'Organic Synthesis (U5)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Strategies and mechanisms for multi-step organic synthesis and functional group interconversions.', videos: [], resources: [{ id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Chemistry/20-Organic Synthesis/IAL Chemistry U5 topic 20 Self-Study booklet(@Aeth_en).pdf', description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' }], quizzes: [] },





  'Physics-T1': {
    title: 'Mechanics (U1)',
    subject: 'Physics',
    curriculum: 'A-Level',
    description: 'Explore the principles of mechanics including motion, forces and energy.',
    videos: [],
    resources: [{ id: 'r1', title: 'Mechanics Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Phyiscs/IAL Physics U1 topic 1.3 Self-Study booklet(@Aeth_en).pdf' }],
    quizzes: []
    ,
  },
  'Physics-T2': {
    title: 'Materials (U1)',
    subject: 'Physics',
    curriculum: 'A-Level',
    description: 'Understand Materials and their properties.',
    videos: [],
    resources: [{ id: 'r1', title: 'Materials Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Phyiscs/IAL Physics U1 topic 1.4 Self-Study booklet(@Aeth_en).pdf' }],
    quizzes: []
  },

  'Physics-Unit-1': {
    videos: [],
    resources: [],
    quizzes: [
      { title: 'Unit 1 CAQ(@Aeth_en)', questionFile: '/Questions/alevel/edexcel/physics/Unit-1/IAL Physics CAQs U1.pdf' }
    ]
  },
  'Physics-T3': {
    title: 'Waves and Particle Nature of Light (U2)',
    subject: 'Physics',
    curriculum: 'A-Level',
    description: 'Understand wave properties, behaviour and applications.',
    videos: [],
    resources: [{ id: 'r1', title: 'Waves and Particle Nature of Light Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Phyiscs/IAL Physics U2 topic 2.3 Self-Study booklet(@Aeth_en).pdf' }],
    quizzes: []
  },
  'Physics-T4': {
    title: 'Electric Circuits (U2)',
    subject: 'Physics',
    curriculum: 'A-Level',
    description: 'Learn about electric circuits, current, voltage, and resistance.',
    videos: [],
    resources: [{ id: 'r1', title: 'Electric Circuits Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Phyiscs/IAL Physics U2 topic 2.4 Self-Study booklet(@Aeth_en).pdf' }],
    quizzes: []
  },
  'Physics-Unit-2': {
    videos: [],
    resources: [],
    quizzes: [
      { title: 'Unit 2 CAQ(@Aeth_en)', questionFile: '/Questions/alevel/edexcel/physics/Unit-2/IAL Physics CAQs U2.pdf' }
    ]
  },

  'Physics-Unit-3': {
    videos: [],
    resources: [],
    quizzes: [
      { title: 'Unit 3 CAQ(@Aeth_en)', questionFile: '/Questions/alevel/edexcel/physics/Unit-3/IAL Physics CAQs U3.pdf' }
    ]
  },

  'Physics-T5': {
    title: 'Further Mechanics (U4)',
    subject: 'Physics',
    curriculum: 'A-Level',
    description: 'Understand advanced mechanics concepts including circular motion, oscillations, and gravitation.',
    videos: [],
    resources: [{ id: 'r1', title: 'Further Mechanics Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Phyiscs/IAL Physics U4 topic 4.3 Self-Study booklet(@Aeth_en).pdf' },
    { id: 'r2', title: 'Further Mechanics Notes (@Corinth)', url: '/documents/alevel/edexcel/Phyiscs/IAL Physics Unit 4.3 (@Corinth).pdf' }
    ],
    quizzes: []
  },
  'Physics-T6': {
    title: 'Electric and Magnetic Fields (U4)',
    subject: 'Physics',
    curriculum: 'A-Level',
    description: 'Explore electric and magnetic fields, forces, and electromagnetic induction.',
    videos: [],
    resources: [{ id: 'r1', title: 'Electric and Magnetic Fields Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Phyiscs/IAL Physics U4 topic 4.4 Self-Study booklet(@Aeth_en).pdf' },
    { id: 'r2', title: 'Electric and Magnetic Fields Notes (@Corinth)', url: '/documents/alevel/edexcel/Phyiscs/IAL Physics Unit 4.4 (@Corinth).pdf' }
    ],
    quizzes: []
  },
  'Physics-T7': {
    title: 'Nuclear and Particle Physics (U4)',
    subject: 'Physics',
    curriculum: 'A-Level',
    description: 'Study the structure of the nucleus, radioactivity, and nuclear reactions.',
    videos: [],
    resources: [{ id: 'r1', title: 'Nuclear and Particle Physics Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Phyiscs/IAL Physics U4 topic 4.5 Self-Study booklet(@Aeth_en).pdf' },
    { id: 'r2', title: 'Nuclear and Particle Physics Notes (@Corinth)', url: '/documents/alevel/edexcel/Phyiscs/IAL Physics Unit 4.5 (@Corinth).pdf' }
    ],
    quizzes: []
  },
  'Physics-Unit-4': {
    videos: [],
    resources: [],
    quizzes: [
      { title: 'Unit 4 CAQ(@Aeth_en)', questionFile: '/Questions/alevel/edexcel/physics/Unit-4/IAL Physics CAQs U4.pdf' }
    ]
  },
  'Physics-T8': {
    title: 'Thermodynamics (U5)',
    subject: 'Physics',
    curriculum: 'A-Level',
    description: 'Understand the principles of thermal physics, including temperature, heat transfer, and the kinetic theory of gases.',
    videos: [],
    resources: [{ id: 'r1', title: 'Thermodynamics Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Phyiscs/IAL Physics U5 topic 5.3 Self-Study booklet(@Aeth_en).pdf' }],
    quizzes: []
  },

  'Physics-T9': {
    title: 'Nuclear Decay (U5)',
    subject: 'Physics',
    curriculum: 'A-Level',
    description: 'Learn about different types of nuclear decay, half-life, and radioactive decay processes.',
    videos: [],
    resources: [{ id: 'r1', title: 'Nuclear Decay Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Phyiscs/IAL Physics U5 topic 5.4 Self-Study booklet(@Aeth_en).pdf' }],
    quizzes: []
  },
  'Physics-T10': {
    title: 'Oscillations (U5)',
    subject: 'Physics',
    curriculum: 'A-Level',
    description: 'Explore oscillatory motion, simple harmonic motion, and their applications.',
    videos: [],
    resources: [{ id: 'r1', title: 'Oscillations Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Phyiscs/IAL Physics U5 topic 5.5 Self-Study booklet(@Aeth_en).pdf' }],
    quizzes: []
  },
  'Physics-T11': {
    title: 'Astrophysics and Cosmology (U5)',
    subject: 'Physics',
    curriculum: 'A-Level',
    description: 'Understand astrophysical phenomena and the structure and evolution of the universe.',
    videos: [],
    resources: [{ id: 'r1', title: 'Astrophysics and Cosmology Self-Study booklet(@Aeth_en)', url: '/documents/alevel/edexcel/Phyiscs/IAL Physics U5 topic 5.6 Self-Study booklet(@Aeth_en).pdf' }],
    quizzes: []
  },

  'Physics-Unit-5': {
    videos: [],
    resources: [],
    quizzes: [
      { title: 'Unit 5 CAQ(@Aeth_en)', questionFile: '/Questions/alevel/edexcel/physics/Unit-5/IAL Physics CAQs U5.pdf' }
    ]
  },
  'Physics-Unit-6': {
    videos: [],
    resources: [],
    quizzes: [
      { title: 'Unit 6 CAQ(@Aeth_en)', questionFile: '/Questions/alevel/edexcel/physics/Unit-6/IAL Physics CAQs U6.pdf' }
    ]
  },
  //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  'Physics-AS-revision': {
    videos: [], resources: [{ id: 'r1', title: 'AS Physics notes (Veda)', url: '/documents/alevel/cambridge/Physics/AS revision/Physics Notes AS - Veda.pdf', description: 'Notes  from: https://sites.google.com/view/vehemsstudyloft/home' },
    { id: 'r2', title: 'AS Physics Definitions', url: '/documents/alevel/cambridge/Physics/AS revision/AS Physics Definitions.pdf' },
    { id: 'r3', title: 'AS Physics notes (Ayesha Hayat)', url: '/documents/alevel/cambridge/Physics/AS revision/AS Physics notes (Ayesha Hayat).pdf' }
      , { id: 'r4', title: 'AS Physics pastpaper notes (Ayesha Hayat)', url: '/documents/alevel/cambridge/Physics/AS revision/AS pastpaper notes (Ayesha Hayat).pdf' }

    ]
  },
  'Physics-CH1': {
    videos: [],
    resources: [{ id: 'r1', title: 'Physical Quantities and Units Notes', url: '/documents/alevel/cambridge/Physics/1-Physical quantities and units/Physical Quantities and Units.pdf' },
    { id: 'r2', title: 'Measurement techniques Notes', url: '/documents/alevel/cambridge/Physics/1-Physical quantities and units/Measurement techniques.pdf' }
    ],
    quizzes: [
      {
        id: 'q1',
        questionFile: '/Questions/alevel/cambridge/physics/Structured Questions/9702_p2 vectors.pdf',
        title: 'Vector structured questions'
      },
      {
        id: 'q3',
        questionFile: '/Questions/alevel/cambridge/physics/MCQ/9702_p1 vectors.pdf',
        title: 'Vector MCQ questions'
      },
      {
        id: 'q2',
        questionFile: '/Questions/alevel/cambridge/physics/Structured Questions/9702_p2 physical quantities & units.pdf',
        title: 'physical quantities & units structured questions'

      },
      {
        id: 'q4',
        questionFile: '/Questions/alevel/cambridge/physics/MCQ/9702_p1 physical quantities & units.pdf',
        title: 'physical quantities & units MCQ questions'

      }
    ]
  },

  'Physics-CH2': {
    videos: [],
    resources: [{ id: 'r1', title: 'Kinematics Notes', url: '/documents/alevel/cambridge/Physics/2-Kinematics/Kinematics.pdf' }],
    quizzes: [

      {
        id: 'q1',
        questionFile: '/Questions/alevel/cambridge/physics/Structured Questions/9702_p2 kinematics.pdf',
        title: 'Kinematics structured questions'
      },
      {
        id: 'q2',
        questionFile: '/Questions/alevel/cambridge/physics/MCQ/9702_p1 kinematics equations.pdf',
        title: 'Kinematics MCQ questions'
      },

      {
        id: 'q3',
        questionFile: '/Questions/alevel/cambridge/physics/Structured Questions/9702_p2 kinematics projectiles.pdf',
        title: 'Kinematics projectiles structured questions'
      },
      {
        id: 'q4',
        questionFile: '/Questions/alevel/cambridge/physics/MCQ/9702_p1 kinematics projectiles.pdf',
        title: 'Kinematics projectiles MCQ questions'
      },
      {
        id: 'q5',
        questionFile: '/Questions/alevel/cambridge/physics/MCQ/9702_p1 kinematics graph.pdf',
        title: 'Kinematics graph MCQ questions'
      },
    ]
  },

  'Physics-CH3': {
    videos: [],
    resources: [{ id: 'r1', title: 'Dynamics Notes', url: '/documents/alevel/cambridge/Physics/3-Dynamics/Dynamics.pdf' },
    { id: 'r2', title: 'Momentum Notes (HAF)', url: '/documents/alevel/cambridge/Physics/3-Dynamics/Momentum (HAF).pdf' }
    ],
    quizzes: [{
      id: 'q1',
      questionFile: '/Questions/alevel/cambridge/physics/Structured Questions/9702_p2 dynamics.pdf',
      title: 'Dynamics structured questions'
    },
    {
      id: 'q2',
      questionFile: '/Questions/alevel/cambridge/physics/MCQ/9702_p1 dynamics.pdf',
      title: 'Dynamics MCQ questions'
    },
    ]
  },

  'Physics-CH4': {
    videos: [],
    resources: [{ id: 'r1', title: 'Forces, density and pressure Notes', url: '/documents/alevel/cambridge/Physics/4-Forces, density and pressure/Forces, density and pressure.pdf' },],
    quizzes: [
      {
        id: 'q1',
        questionFile: '/Questions/alevel/cambridge/physics/Structured Questions/9702_p2 forces, density & pressure.pdf',
        title: 'Forces, density and pressure structured questions'
      },
      {
        id: 'q2',
        questionFile: '/Questions/alevel/cambridge/physics/MCQ/9702_p1 forces, density & pressure.pdf',
        title: 'Forces, density and pressure MCQ questions'
      },
    ]
  },

  'Physics-CH5': {

    videos: [],
    resources: [{ id: 'r2 ', title: 'Work, energy and power Notes (HAF)', url: '/documents/alevel/cambridge/Physics/5-Work, energy and power/Work, energy and power (HAF).pdf' },
    { id: 'r1', title: 'Work, energy and power Notes', url: '/documents/alevel/cambridge/Physics/5-Work, energy and power/Work, energy and power.pdf' }],
    quizzes: [
      {
        id: 'q1',
        questionFile: '/Questions/alevel/cambridge/physics/Structured Questions/9702_p2 work, energy & power.pdf',
        title: 'Work, energy and power structured questions'
      },
      {
        id: 'q2',
        questionFile: '/Questions/alevel/cambridge/physics/MCQ/9702_p1 work, energy & power.pdf',
        title: 'Work, energy and power MCQ questions'
      },
    ]
  },

  'Physics-CH6': {
    videos: [],
    resources: [{ id: 'r2 ', title: 'Deformation of solids Notes (HAF)', url: '/documents/alevel/cambridge/Physics/6-Deformation of solids/Deformation of solids (HAF).pdf' },
    { id: 'r1', title: 'Deformation of solids Notes', url: '/documents/alevel/cambridge/Physics/6-Deformation of solids/Deformation of solids.pdf' }],
    quizzes: [
      {
        id: 'q1',
        questionFile: '/Questions/alevel/cambridge/physics/Structured Questions/9702_p2 deformation of solids.pdf',
        title: 'Deformation of solids structured questions'
      },
      {
        id: 'q2',
        questionFile: '/Questions/alevel/cambridge/physics/MCQ/9702_p1 deformation of solids.pdf',
        title: 'Deformation of solids MCQ questions'
      },

    ]
  },
  'Physics-CH7': {
    videos: [],
    resources: [{ id: 'r2 ', title: 'Waves Notes (HAF)', url: '/documents/alevel/cambridge/Physics/7-Waves/Waves (HAF).pdf' },
    { id: 'r1', title: 'Waves Notes', url: '/documents/alevel/cambridge/Physics/7-Waves/Waves.pdf' }],
    quizzes: [
      {
        id: 'q1',
        questionFile: '/Questions/alevel/cambridge/physics/Structured Questions/9702_p2 waves.pdf',
        title: 'Waves structured questions'
      },
      {
        id: 'q2',
        questionFile: '/Questions/alevel/cambridge/physics/MCQ/9702_p1 waves.pdf',
        title: 'Waves MCQ questions'
      },
    ]
  },



  'Physics-CH8': {
    videos: [],
    resources: [{ id: 'r2 ', title: 'Superposition Notes (HAF)', url: '/documents/alevel/cambridge/Physics/8-Superposition/Superposition (HAF).pdf' },
    { id: 'r1', title: 'Superposition Notes', url: '/documents/alevel/cambridge/Physics/8-Superposition/Superposition.pdf' }],
    quizzes: [
      {
        id: 'q1',
        questionFile: '/Questions/alevel/cambridge/physics/Structured Questions/9702_p2 superposition.pdf',
        title: 'Superposition structured questions'
      },
      {
        id: 'q2',
        questionFile: '/Questions/alevel/cambridge/physics/MCQ/9702_p1 superposition.pdf',
        title: 'Superposition MCQ questions'
      },
    ]

  },


  'Physics-CH9': {
    videos: [],
    resources: [{ id: 'r2 ', title: 'Electricity Notes (HAF)', url: '/documents/alevel/cambridge/Physics/9-Electricity/Electricity (HAF).pdf' }
      , { id: 'r1', title: 'Electricity Notes', url: '/documents/alevel/cambridge/Physics/9-Electricity/Electricity.pdf' }],
    quizzes: [
      {
        id: 'q1',
        questionFile: '/Questions/alevel/cambridge/physics/Structured Questions/9702_p2 electricity & DC circuits.pdf',
        title: 'Electricity and D.C. circuits structured questions'
      },
      {
        id: 'q2',
        questionFile: '/Questions/alevel/cambridge/physics/MCQ/9702_p1 electricity & DC circuits.pdf',
        title: 'Electricity and D.C. circuits MCQ questions'
      },
    ]
  },





  'Physics-CH10': {
    videos: [],
    resources: [{ id: 'r2 ', title: 'D.C. circuits Notes (HAF)', url: '/documents/alevel/cambridge/Physics/10-D.C. circuits/D.C. circuits (HAF).pdf' },
    { id: 'r1', title: 'D.C. circuits Notes', url: '/documents/alevel/cambridge/Physics/10-D.C. circuits/D.C. circuits.pdf' }],
    quizzes: [
      {
        id: 'q1',
        questionFile: '/Questions/alevel/cambridge/physics/Structured Questions/9702_p2 electricity & DC circuits.pdf',
        title: 'Electricity and D.C. circuits structured questions'
      },
      {
        id: 'q2',
        questionFile: '/Questions/alevel/cambridge/physics/MCQ/9702_p1 electricity & DC circuits.pdf',
        title: 'Electricity and D.C. circuits MCQ questions'
      },
    ]


  },



  'Physics-CH11': {
    videos: [],
    resources: [
      { id: 'r1', title: 'Particle physics Notes', url: '/documents/alevel/cambridge/Physics/11-Particle physics/Particle physics.pdf' }],
    quizzes: [
      {
        id: 'q1',
        questionFile: '/Questions/alevel/cambridge/physics/Structured Questions/9702_p1 particle physics.pdf',
        title: 'Particle physics structured questions'
      },
      {
        id: 'q2',
        questionFile: '/Questions/alevel/cambridge/physics/MCQ/9702_p1 particle physics.pdf',
        title: 'Particle physics MCQ questions'
      },
    ]


  },

  'Physics-Practical(AS)': {
    videos: [],
    resources: [{ id: 'r2 ', title: 'Uncertainty Notes (HAF)', url: '/documents/alevel/cambridge/Physics/Practical/Uncertainty (HAF).pdf' }, { id: 'r1', title: 'Practical Skills notes ', url: '/documents/alevel/cambridge/Physics/Practical/Practical skills 1.pdf' }],
    quizzes: []
  },


  'Physics-A2-revision': {
    videos: [], resources: [{ id: 'r1', title: 'A2 Physics notes (Veda)', url: '/documents/alevel/cambridge/Physics/A2 revision/Physics Notes A2 - Veda.pdf', description: 'Notes  from: https://sites.google.com/view/vehemsstudyloft/home' },
    { id: 'r2', title: 'A2 Physics notes (Ayesha Hayat)', url: '/documents/alevel/cambridge/Physics/A2 revision/A2 Physics notes (Ayesha Hayat).pdf' },
    ]
  },

  'Physics-CH12': {
    videos: [],
    resources: [{ id: 'r3', title: 'Motion in a circle Notes (HAF)', url: '/documents/alevel/cambridge/Physics/12-Motion in a circle/Circular Motion (HAF).pdf' },

    { id: 'r2', title: 'Motion in a circle Notes (Yuhao Yang)', url: '/documents/alevel/cambridge/Physics/12-Motion in a circle/12 Motion in a circle.pdf' },

    { id: 'r1', title: 'Motion in a circle Notes', url: '/documents/alevel/cambridge/Physics/12-Motion in a circle/Motion in a circle.pdf' }],
    quizzes: []



  },
  'Physics-CH13': {
    videos: [],
    resources: [{ id: 'r3', title: 'Gravitational fields Notes (HAF)', url: '/documents/alevel/cambridge/Physics/13-Gravitational fields/Gravitational Fields (HAF).pdf' },
    { id: 'r2', title: 'Gravitational fields Notes (Yuhao Yang)', url: '/documents/alevel/cambridge/Physics/13-Gravitational fields/13 Gravitational fields.pdf' },

    { id: 'r1', title: 'Gravitational fields Notes', url: '/documents/alevel/cambridge/Physics/13-Gravitational fields/Gravitational fields.pdf' }],
    quizzes: []


  },



  'Physics-CH14': {
    videos: [],
    resources: [{ id: 'r2', title: 'Temperature Notes (Yuhao Yang)', url: '/documents/alevel/cambridge/Physics/14-Temperature/14 Temperature.pdf' },
    { id: 'r1', title: 'Temperature Notes ', url: '/documents/alevel/cambridge/Physics/14-Temperature/Temperature.pdf' }],
    quizzes: []
  },



  'Physics-CH15': {
    videos: [],
    resources: [{ id: 'r2', title: 'Ideal gases notes (Yuhao Yang)', url: '/documents/alevel/cambridge/Physics/15-Ideal gases/15 Ideal gases.pdf' },
    { id: 'r1', title: 'Ideal gases notes ', url: '/documents/alevel/cambridge/Physics/15-Ideal gases/Ideal gases.pdf' }],
    quizzes: []
  },


  'Physics-CH16': {
    videos: [],
    resources: [{ id: 'r2', title: 'Thermodynamics notes (Yuhao Yang)', url: '/documents/alevel/cambridge/Physics/16-Thermodynamics/16 Thermodynamics.pdf' },
    { id: 'r1', title: 'Thermodynamics notes ', url: '/documents/alevel/cambridge/Physics/16-Thermodynamics/Thermodynamics.pdf' }],
    quizzes: []
  },


  'Physics-CH17': {
    videos: [],
    resources: [{ id: 'r2', title: 'Oscillations notes (Yuhao Yang)', url: '/documents/alevel/cambridge/Physics/17-Oscillations/17 Oscillations.pdf' },
    { id: 'r1', title: 'Oscillations notes ', url: '/documents/alevel/cambridge/Physics/17-Oscillations/Oscillations.pdf' }],
    quizzes: []
  },



  'Physics-CH18': {
    videos: [],
    resources: [{ id: 'r2', title: 'Electric fields notes (Yuhao Yang)', url: '/documents/alevel/cambridge/Physics/18-Electric fields/18 Electric fields.pdf' },
    { id: 'r1', title: 'Electric fields notes ', url: '/documents/alevel/cambridge/Physics/18-Electric fields/Electric fields.pdf' }],
    quizzes: []



  },


  'Physics-CH19': {
    videos: [],
    resources: [{ id: 'r2', title: 'Capacitance notes (Yuhao Yang)', url: '/documents/alevel/cambridge/Physics/19-Capacitance/19 Capacitance.pdf' },
    { id: 'r1', title: 'Capacitance notes ', url: '/documents/alevel/cambridge/Physics/19-Capacitance/Capacitance.pdf' }],
    quizzes: []
  },



  'Physics-CH20': {
    videos: [],
    resources: [{ id: 'r2', title: 'Magnetic fields notes (Yuhao Yang)', url: '/documents/alevel/cambridge/Physics/20-Magnetic fields/20 Magnetic fields.pdf' },
    { id: 'r1', title: 'Magnetic fields notes ', url: '/documents/alevel/cambridge/Physics/20-Magnetic fields/Magnetic fields.pdf' }],
    quizzes: []


  },



  'Physics-CH21': {
    videos: [],
    resources: [{ id: 'r2', title: 'Alternating current notes (Yuhao Yang)', url: '/documents/alevel/cambridge/Physics/21-Alternating current/21 Alternating current.pdf' },
    { id: 'r1', title: 'Alternating current notes ', url: '/documents/alevel/cambridge/Physics/21-Alternating current/Alternating current.pdf' }],
    quizzes: []
  },



  'Physics-CH22': {
    videos: [],
    resources: [{ id: 'r2', title: 'Quantum physics notes (Yuhao Yang)', url: '/documents/alevel/cambridge/Physics/22-Quantum physics/22 Quantum physics.pdf' },
    { id: 'r1', title: 'Quantum physics notes ', url: '/documents/alevel/cambridge/Physics/22-Quantum physics/Quantum physics.pdf' }],
    quizzes: []
  },



  'Physics-CH23': {
    videos: [],
    resources: [{ id: 'r2', title: 'Nuclear physics notes (Yuhao Yang)', url: '/documents/alevel/cambridge/Physics/23-Nuclear physics/23 Nuclear physics.pdf' },
    { id: 'r1', title: 'Nuclear physics notes ', url: '/documents/alevel/cambridge/Physics/23-Nuclear physics/Nuclear physics.pdf' }],
    quizzes: []

  },
  'Physics-CH24': {
    videos: [],
    resources: [{ id: 'r2', title: 'Medical Physics notes (Yuhao Yang)', url: '/documents/alevel/cambridge/Physics/24-Medical physics/24 Medical physics.pdf' },
    { id: 'r1', title: 'Medical Physics notes ', url: '/documents/alevel/cambridge/Physics/24-Medical physics/Medical physics.pdf' }],
    quizzes: []

  },

  'Physics-CH25': {
    videos: [],
    resources: [{ id: 'r2', title: 'Astronomy and cosmology notes (Yuhao Yang)', url: '/documents/alevel/cambridge/Physics/25-Astronomy and cosmology/25 Astronomy and cosmology.pdf' },
    { id: 'r1', title: 'Astronomy and cosmology notes ', url: '/documents/alevel/cambridge/Physics/25-Astronomy and cosmology/Astronomy and cosmology.pdf' }],
    quizzes: []

  },

  'Physics-Practical(A2)': {
    videos: [],
    resources: [
      { id: 'r1', title: 'Practical Skills notes ', url: '/documents/alevel/cambridge/Physics/Practical/Practical skills 2.pdf' }],
    quizzes: []
  },


  'chemistry-L1': {
    videos: [],
    resources: [],
    quizzes: [
      {
        id: 'q1',
        questionFile: '/Questions/igcse/edexcel/chemistry/Unit 1: Principles of Chemistry-Topical.pdf',
        title: 'Principles of Chemistry Topical'
      }
    ]
  },
  'chemistry-L2': {
    videos: [],
    resources: [],
    quizzes: [
      {
        id: 'q1',
        questionFile: '/Questions/igcse/edexcel/chemistry/Unit 2: Inorganic Chemistry-Topical.pdf',
        title: 'Inorganic Chemistry Topical'
      }
    ]
  },
  'chemistry-L3': {
    videos: [],
    resources: [],
    quizzes: [
      {
        id: 'q1',
        questionFile: '/Questions/igcse/edexcel/chemistry/Unit 3: Physical Chemistry-Topical.pdf',
        title: 'Physical Chemistry Topical'
      }
    ]
  },
  'chemistry-L4': {

    videos: [],
    resources: [{ id: 'r1', title: 'ORGANIC CHEM REVISION (FRED_LOL09)', url: '/documents/igcse/edexcel/Chemistry/ORGANIC CHEM REVISION (FRED_LOL09).pdf' }],
    quizzes: [
      {
        id: 'q1',
        questionFile: '/Questions/igcse/edexcel/chemistry/Unit 4: Organic Chemistry-Topical.pdf',
        title: 'Organic Chemistry Topical'
      }
    ],
  },

  'chemistry(edexcel)-full-revision': {
    videos: [],
    resources: [{ id: 'r1', title: 'All Apparatus for IGCSE Chemistry (FRED_LOL09)', url: '/documents/igcse/edexcel/Chemistry/Full Revision/ALL APPARATUS FOR IGCSE CHEM (FRED_LOL09).pdf' },
    { id: 'r2', title: 'Chemistry Core Concepts (FRED_LOL09)', url: '/documents/igcse/edexcel/Chemistry/Full Revision/Chemistry Core Concepts (FRED_LOL09).pdf' },
    { id: 'r3', title: 'Important Image to Revise', url: '/documents/igcse/edexcel/Chemistry/Full Revision/Important image to revise.pdf', description: 'Inluciding reactivity series,definition, and coumpound colors.' },
    { id: 'r4', title: 'Chemicaltests  (FRED_LOL09)', url: '/documents/igcse/edexcel/Chemistry/Full Revision/IGCSE CHEMICAL TESTS (FRED_LOL09).pdf' }],
    quizzes: [
      {
        id: 'q1',
        questionFile: '/Questions/igcse/edexcel/chemistry/Full Revision/IAL Chem CAQ (P2).pdf',
        title: 'p2 Commonly Asked Questions'
      },
      {
        id: 'q2',
        questionFile: '/Questions/igcse/edexcel/chemistry/Full Revision/IAL Chem CAQ (P1).pdf',
        title: ' p1 Commonly Asked Questions'
      }
    ],



  }




};

// Merge topic data with metadata from curriculumData
// If metadata exists, it overrides any existing title/description/subject/curriculum
type TopicVideo = {
  id: string;
  title: string;
  description?: string;
  englishUrl?: string;
  arabicUrl?: string;
};

type TopicResource = {
  id: string;
  title: string;
  url: string;
  description?: string;
};

type TopicQuiz = {
  id?: string;
  title: string;
  description?: string;
  questionFile?: string;
  markSchemeFile?: string;
  folderPath?: string;
};

type TopicTag = {
  name?: string;
  color?: string;
};

type TopicDataEntry = {
  key: string;
  title: string;
  subject: string;
  curriculum?: string;
  description?: string;
  videos: TopicVideo[];
  resources: TopicResource[];
  quizzes: TopicQuiz[];
  color?: string;
  group?: string;
  tags?: TopicTag[];
};

type PageMeta = {
  title?: string;
  description?: string;
  keywords?: string;
  url?: string;
};

// eslint-disable-next-line react-refresh/only-export-components
export const topicData: Record<string, TopicDataEntry> = {};
for (const [topicId, topic] of Object.entries(topicDataRaw)) {
  const metadata = getTopicMetadata(topicId);
  if (metadata) {
    // Merge: use metadata for title, description, subject, curriculum, color
    // but keep videos, resources, quizzes from topicDataRaw
    topicData[topicId] = {
      key: topicId,
      title: metadata.title ?? topic.title ?? '',
      subject: metadata.subject ?? topic.subject ?? '',
      curriculum: metadata.curriculum ?? topic.curriculum,
      description: metadata.description ?? topic.description,
      videos: topic.videos ?? [],
      resources: topic.resources ?? [],
      quizzes: topic.quizzes ?? [],
      color: topic.color || metadata.color,
      group: metadata.group,
      tags: metadata.tags,
    };
  } else {
    topicData[topicId] = {
      key: topicId,
      title: topic.title ?? '',
      subject: topic.subject ?? '',
      curriculum: topic.curriculum,
      description: topic.description,
      resources: topic.resources ?? [],
      videos: topic.videos ?? [],
      quizzes: topic.quizzes ?? [],
      color: topic.color,
      group: topic.group,
    };
  }
}


