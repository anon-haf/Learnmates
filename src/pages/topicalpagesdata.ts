import { SubjectConfig } from '../utils/topicalConfig';

// A code-defined list of configurations for topical pages.  Edit this file to add new
// subjects/boards/levels/units/topics.  The UI on TopicalPages.tsx will automatically
// build dropdown options from the data present here.

export const topicalConfigs: SubjectConfig[] = [

  {
    "subject": "Pure Mathematics",
    "board": "edexcel",
    "level": "a-level",
    "units": [
      {
        "unit": "Pure 1",
        "topics": [
          {
            "topic": "1 Algebra & Functions",
            "subtopics": [
              { "subtopic": "1.1 Algebra (Indices & Surds)", "search": "1.1 Algebra (Indices & Surds)" },
              { "subtopic": "1.2 Quadratics", "search": "1.2 Quadratics" },
              { "subtopic": "1.3 Simultaneous Equations and Inequalities", "search": "1.3 Simultaneous Equations and Inequalities" },
              { "subtopic": "1.4 Functions and Graphs", "search": "1.4 Functions and Graphs" }
            ]
          },
          {
            "topic": "2 Coordinate Geometry", "subtopics": [
              { "subtopic": "2 Straight Lines", "search": "2 Straight Lines" }
            ]
          },
          {
            "topic": "3 Trigonometry",
            "subtopics": [
              { "subtopic": "3.1 Trigonometry", "search": "3.1 Trigonometry" },
              { "subtopic": "3.2 Radians", "search": "3.2 Radians" }
            ]
          },
          {
            "topic": "4 Differentiation", "subtopics": [
              { "subtopic": "4 Differentiation", "search": "4 Differentiation" }
            ]
          },
          {
            "topic": "5 Integration", "subtopics": [
              { "subtopic": "5 Integration", "search": "5 Integration" }
            ]
          }
        ]
      },
      {
        "unit": "Pure 2",
        "topics": [
          {
            "topic": "1 Proof", "subtopics": [
              { "subtopic": "1 Proof by Exhaustion & Counter-Example", "search": "1 Proof by Exhaustion & Counter-Example" }
            ]
          },
          {
            "topic": "2 Algebra & Functions",
            "subtopics": [
              { "subtopic": "2 Algebraic Methods (Polynomial Division, Factor Theorem, Remainder Theorem)", "search": "2 Algebraic Methods (Polynomial Division, Factor Theorem, Remainder Theorem)" }
            ]
          },
          {
            "topic": "3 Coordinate Geometry", "subtopics": [
              { "subtopic": "3 Equation of a Circle and Circle Properties", "search": "3 Equation of a Circle and Circle Properties" }
            ]
          },
          {
            "topic": "4 Sequences & Series",
            "subtopics": [
              { "subtopic": "4.1 Sequences and Series", "search": "4.1 Sequences and Series" },
              { "subtopic": "4.2 Sum to Infinity", "search": "4.2 Sum to Infinity" },
              { "subtopic": "4.3 Binomial Expansion", "search": "4.3 Binomial Expansion" }
            ]
          },
          {
            "topic": "5 Exponentials & Logarithms", "subtopics": [
              { "subtopic": "5 Exponentials & Logarithms", "search": "5 Exponentials & Logarithms" }
            ]
          },
          {
            "topic": "6 Trigonometry", "subtopics": [
              { "subtopic": "6 Trigonometry", "search": "6 Trigonometry" }
            ]
          },
          {
            "topic": "7 Differentiation", "subtopics": [
              { "subtopic": "7 Differentiation", "search": "7 Differentiation" }
            ]
          },
          {
            "topic": "8 Integration",
            "subtopics": [
              { "subtopic": "8.1 Definite Integrals (Area under & between two curves)", "search": "8.1 Definite Integrals (Area under & between two curves)" },
              { "subtopic": "8.2 Trapezium Rule", "search": "8.2 Trapezium Rule" }
            ]
          }
        ]
      },
      {
        "unit": "Pure 3",
        "topics": [
          {
            "topic": "1 Algebra & Functions",
            "subtopics": [
              { "subtopic": "1.1 Rational Expressions", "search": "1.1 Rational Expressions" },
              { "subtopic": "1.2 Functions and Transformations (Modulus)", "search": "1.2 Functions and Transformations (Modulus)" }
            ]
          },
          {
            "topic": "2 Trigonometry",
            "subtopics": [
              { "subtopic": "2.1 Trigonometric Functions (Sec, Cosec, Cot, Inverse)", "search": "2.1 Trigonometric Functions (Sec, Cosec, Cot, Inverse)" },
              { "subtopic": "2.2 Trigonometric Identities", "search": "2.2 Trigonometric Identities" },
              { "subtopic": "2.3 Harmonic Form (a cos θ + b sin θ)", "search": "2.3 Harmonic Form (a cos θ + b sin θ)" }
            ]
          },
          {
            "topic": "3 Exponentials & Logarithms", "subtopics": [
              { "subtopic": "3 Exponential and Logarithmic Functions", "search": "3 Exponential and Logarithmic Functions" }
            ]
          },
          {
            "topic": "4 Differentiation",
            "subtopics": [
              { "subtopic": "4.1 Differentiation (Trigonometric Functions)", "search": "4.1 Differentiation (Trigonometric Functions)" },
              { "subtopic": "4.2 Differentiation Rules (Chain, Product, Quotient)", "search": "4.2 Differentiation Rules (Chain, Product, Quotient)" },
              { "subtopic": "4.3 Exponential Growth and Decay", "search": "4.3 Exponential Growth and Decay" }
            ]
          },
          {
            "topic": "5 Integration",
            "subtopics": [
              { "subtopic": "5.1 Integration (Trig, identities, other functions)", "search": "5.1 Integration (Trig, identities, other functions)" },
              { "subtopic": "5.2 Reverse Chain Rule", "search": "5.2 Reverse Chain Rule" }
            ]
          },
          {
            "topic": "6 Numerical Methods",
            "subtopics": [
              { "subtopic": "6.1 Location of Roots (change of sign)", "search": "6.1 Location of Roots (change of sign)" },
              { "subtopic": "6.2 Iterative Methods (recurrence relations xₙ₊₁ = f(xₙ))", "search": "6.2 Iterative Methods (recurrence relations xₙ₊₁ = f(xₙ))" }
            ]
          }
        ]
      },
      {
        "unit": "Pure 4",
        "topics": [
          {
            "topic": "1 Proof", "subtopics": [
              { "subtopic": "1 Proof by Contradiction", "search": "1 Proof by Contradiction" }
            ]
          },
          {
            "topic": "2 Algebra & Functions", "subtopics": [
              { "subtopic": "2 Partial Fractions", "search": "2 Partial Fractions" }
            ]
          },
          {
            "topic": "3 Coordinate Geometry", "subtopics": [
              { "subtopic": "3 Parametric Equations", "search": "3 Parametric Equations" }
            ]
          },
          {
            "topic": "4 Binomial Expansion", "subtopics": [
              { "subtopic": "4 Binomial Series for Rational n", "search": "4 Binomial Series for Rational n" }
            ]
          },
          {
            "topic": "5 Differentiation",
            "subtopics": [
              { "subtopic": "5.1 Parametric and Implicit Differentiation", "search": "5.1 Parametric and Implicit Differentiation" },
              { "subtopic": "5.2 Rates of Change", "search": "5.2 Rates of Change" }
            ]
          },
          {
            "topic": "6 Integration",
            "subtopics": [
              { "subtopic": "6.1 Area Under Parametric Curves", "search": "6.1 Area Under Parametric Curves" },
              { "subtopic": "6.2 Volumes of Revolution", "search": "6.2 Volumes of Revolution" },
              { "subtopic": "6.3 Integration by Substitution", "search": "6.3 Integration by Substitution" },
              { "subtopic": "6.4 Integration by Parts", "search": "6.4 Integration by Parts" },
              { "subtopic": "6.5 Integration Using Partial Fractions", "search": "6.5 Integration Using Partial Fractions" },
              { "subtopic": "6.6 Separable First-Order Differential Equations", "search": "6.6 Separable First-Order Differential Equations" }
            ]
          },
          {
            "topic": "7 Vectors",
            "subtopics": [
              { "subtopic": "7.1 Vectors in 2D and 3D (magnitude, unit vectors, position vectors, distances)", "search": "7.1 Vectors in 2D and 3D (magnitude, unit vectors, position vectors, distances)" },
              { "subtopic": "7.2 Vector Equations of Lines", "search": "7.2 Vector Equations of Lines" },
              { "subtopic": "7.3 Scalar Product and Angles Between Lines", "search": "7.3 Scalar Product and Angles Between Lines" }
            ]
          }
        ]
      }
    ]
  }
  ,
  {
    "subject": "Chemistry",

    "board": "edexcel",
    "level": "a-level",
    "units": [
      {
        "unit": "U1",

        "topics": [
          { "topic": "1 Formulae, Equations and Amount of Substance", "search": "Formulae, Equations and Amount of Substance" },
          { "topic": "2 Atomic Structure and the Periodic Table", "search": "Atomic Structure and the Periodic Table" },
          {
            "topic": "3 Bonding and strucutre",
            "subtopics": [
              { "subtopic": "3A Ionic Bonding", "search": "Ionic Bonding" },
              { "subtopic": "3B Covalent Bonding", "search": "Covalent Bonding" },
              { "subtopic": "3C Metallic Bonding", "search": "Metallic Bonding" },
              { "subtopic": "3D Shapes of Molecules", "search": "Shapes of Molecules" },
            ]
          },
          {
            "topic": "4 Introductory Organic Chemistry and Alkanes", "subtopics": [
              { "subtopic": "4A Organic General Principles", "search": "Organic General Principles" },
              { "subtopic": "4B Alkanes", "search": "Alkanes" },
            ]

          },
          { "topic": "5 Alkenes", "search": "Alkenes" }
        ]
      },
      {
        "unit": "U2",

        "topics": [
          { "topic": "6 Energetics", "search": "Energetics" },
          { "topic": "7 Intermolecular Forces", "search": "Intermolecular Forces" },
          {
            "topic": "8 Bonding and strucutre",
            "subtopics": [
              { "subtopic": "8A Redox chemistry", "search": "Redox chemistry" },
              { "subtopic": "8B Groups 1 and 2", "search": "Groups 1 and 2" },
              { "subtopic": "8C Inorganic chemistry of Group 7", "search": "Group 7" }
            ]
          },
          {
            "topic": "9 Introduction to Kinetics and Equilibria", "subtopics": [
              { "subtopic": "9A Kinetics", "search": "Kinetics" },
              { "subtopic": "9B Equilibria", "search": "Equilibria" }
            ]
          },
          {
            "topic": "10 Organic Chemistry: Halogenoalkanes, Alcohols and Spectra", "subtopics": [
              { "subtopic": "10A Halogenoalkanes", "search": "Halogenoalkanes" },
              { "subtopic": "10B Alcohols", "search": "Alcohols" },
              { "subtopic": "10C Mass spectra and IR", "search": "Mass spectra and IR" }
            ]
          }
        ]

      },
      {
        "unit": "U4",

        "topics": [
          { "topic": "11 Kinetics", "search": "11 Kinetics" },
          {
            "topic": "12 Entropy and Energetics",
            "subtopics": [
              { "subtopic": "12A Entropy", "search": "12A Entropy" },
              { "subtopic": "12B Lattice energy", "search": "12B Lattice energy" }
            ]
          },
          { "topic": "13 Chemical Equilibria", "search": "13 Chemical Equilibria" },
          { "topic": "14 Acid-base Equilibria", "search": "14 Acid-base Equilibria" },

          {
            "topic": "15 Organic Chemistry: Carbonyls, Carboxylic Acids and Chirality", "subtopics": [
              { "subtopic": "15A Chirality", "search": "15A Chirality" },
              { "subtopic": "15B Carbonyl compounds", "search": "15B Carbonyl compounds" },
              { "subtopic": "15C Carboxylic acids", "search": "15C Carboxylic acids" },
              { "subtopic": "15D Carboxylic acid derivatives", "search": "15D Carboxylic acid derivatives" },
              { "subtopic": "15E Spectroscopy and chromatography", "search": "15E Spectroscopy and chromatography" },
            ]
          },

        ]

      },
      {
        "unit": "U5",

        "topics": [
          { "topic": "16 Redox Equilibria", "search": "16 Redox Equilibria" },
          { "topic": "17 Transition Metals and their Chemistry", "search": "17 Transition Metals and their Chemistry" },
          { "topic": "18 Organic Chemistry – Arenes", "search": "18 Organic Chemistry – Arenes" },
          { "topic": "19 Organic Nitrogen Compounds: Amines, Amides, Amino Acids and Proteins", "search": "19 Organic Nitrogen Compounds: Amines, Amides, Amino Acids and Proteins" },
          { "topic": "20 Organic Synthesis", "search": "20 Organic Synthesis" }
        ]
      },

    ]
  },





  {
    "subject": "Biology",

    "board": "edexcel",
    "level": "a-level",
    "units": [
      {
        "unit": "U1",

        "topics": [
          {
            "topic": "1 Molecules, Transport and Health",
            "subtopics": [
              { "subtopic": "1A chemistry for biologists", "search": "1A chemistry for biologists" },
              { "subtopic": "1B mammalian transport systems", "search": "1B mammalian transport systems" },
              { "subtopic": "1C cardiovascular health and risk", "search": "1C cardiovascular health and risk" },
            ]
          },
          {
            "topic": "2 Membranes, Proteins, DNA and Gene Expression", "subtopics": [
              { "subtopic": "2A membranes and transport", "search": "2A membranes and transport" },
              { "subtopic": "2B proteins and dna", "search": "2B proteins and dna" },
              { "subtopic": "2C gene expressions and genetics", "search": "2C gene expressions and genetics" },
            ]

          },
        ]
      },
      {
        "unit": "U2",

        "topics": [
          {
            "topic": "3 Cell Structure, Reproduction and Development",
            "subtopics": [
              { "subtopic": "3A cell structure", "search": "3A cell structure" },
              { "subtopic": "3B mitosis, meiosis and reproduction", "search": "3B mitosis, meiosis and reproduction" },
              { "subtopic": "3C development of organisms", "search": "3C development of organisms" },
            ]
          },
          {
            "topic": "4 Plant Structure and Function, Biodiversity and Conservation", "subtopics": [
              { "subtopic": "4A plant structure and function", "search": "4A plant structure and function" },
              { "subtopic": "4B classification", "search": "4B classification" },
              { "subtopic": "4C biodiversity and conservation", "search": "4C biodiversity and conservation" },
            ]

          },
        ]
      },
      {
        "unit": "U4",

        "topics": [
          {
            "topic": "5 Energy Flow, Ecosystems and the Environment",
            "subtopics": [
              { "subtopic": "5A Photosynthesis", "search": "5A Photosynthesis" },
              { "subtopic": "5B Ecology", "search": "5B Ecology" },
              { "subtopic": "5C Environment and Climate Change", "search": "5C Environment and Climate Change" },
            ]
          },
          {
            "topic": "6 Microbiology, Immunity and Forensics",
            "subtopics": [
              { "subtopic": "6A Microbiology", "search": "6A Microbiology" },
              { "subtopic": "6B Immunity", "search": "6B Immunity" },
              { "subtopic": "6C Decomposition and Forensics", "search": "6C Decomposition and Forensics" },
            ]
          }

        ]



      },
    ]
  },




  {
    "subject": "Physics",

    "board": "edexcel",
    "level": "a-level",
    "units": [
      {
        "unit": "U1",

        "topics": [
          {
            "topic": "1 Mechanics",
            "subtopics": [
              { "subtopic": "1A motion", "search": "1A motion" },
              { "subtopic": "1B energy", "search": "1B energy" },
              { "subtopic": "1C momentum", "search": "1C momentum" },
            ]
          },
          {
            "topic": "2 Materials", "subtopics": [
              { "subtopic": "2A fluids", "search": "2A fluids" },
              { "subtopic": "2B solid material properties", "search": "2B solid material properties" },
            ]

          },
        ]
      },
      {
        "unit": "U2",

        "topics": [
          {
            "topic": "3 Waves and Particle Nature of Light",
            "subtopics": [
              { "subtopic": "3A Basic Waves", "search": "3A Basic Waves" },
              { "subtopic": "3B The Behaviour of Waves", "search": "3B The Behaviour of Waves" },
              { "subtopic": "3C Wave Properties of Light", "search": "3C Wave Properties of Light" },
              { "subtopic": "3D Quantum Physics", "search": "3D Quantum Physics" },

            ]
          },
          {
            "topic": "4 Electric Circuits", "subtopics": [
              { "subtopic": "4A Electrical Quantities", "search": "4A Electrical Quantities" },
              { "subtopic": "4B Complete Electrical Circuits", "search": "4B Complete Electrical Circuits" },
            ]

          },
        ]
      },
      {
        "unit": "U4",

        "topics": [
          {
            "topic": "5 Further Mechanics",
            "subtopics": [
              { "subtopic": "5A Further Momentum", "search": "5A Further Momentum" },
              { "subtopic": "5B Circular Motion", "search": "5B Circular Motion" },
            ]
          },
          {
            "topic": "6 Electric and Magnetic Fields", "subtopics": [
              { "subtopic": "6A Electric Fields", "search": "6A Electric Fields" },
              { "subtopic": "6B Capacitors", "search": "6B Capacitors" },
              { "subtopic": "6C Electromagnetic Effects", "search": "6C Electromagnetic Effects" },
            ]

          },
          {
            "topic": "7 Nuclear and Particle Physics", "subtopics": [
              { "subtopic": "7A Probing Matter", "search": "7A Probing Matter" },
              { "subtopic": "7B Particle Accelerators and Detectors", "search": "7B Particle Accelerators and Detectors" },
              { "subtopic": "7C The Particle Zoo", "search": "7C The Particle Zoo" },
            ]
          },
        ]
      },
      {
        "unit": "U5",

        "topics": [
          {
            "topic": "8 Thermodynamics", "search": "8 Heat and Temperature"

          },
          { "topic": "9 Nuclear Decay", "search": "9 Radioactivity" },

          {
            "topic": "10 Oscillations", "search": "10 Oscillations"

          },
          {
            "topic": "11 Astrophysics and Cosmology", "subtopics": [
              { "subtopic": "11A Gravitational Fields", "search": "11A Gravitational Fields" },
              { "subtopic": "11B Space", "search": "11B Space" },
            ]

          },
        ]
      },

    ]
  },






  {
    "subject": "Physics",

    "board": "cambridge",
    "level": "igcse",

    "units": [
      {
        "unit": "Physics",

        "topics": [
          {
            "topic": "1 Motion, forces and energy",
            "subtopics": [
              { "subtopic": "1.1 Physical quantities and measurement techniques", "search": "1.1 Physical quantities and measurement techniques" },
              { "subtopic": "1.2 Motion", "search": "1.2 Motion" },
              { "subtopic": "1.3 Mass and weight", "search": "1.3 Mass and weight" },
              { "subtopic": "1.4 Density", "search": "1.4 Density" },
              { "subtopic": "1.5 Forces", "search": "1.5 Forces" },
              { "subtopic": "1.6 Momentum", "search": "1.6 Momentum" },
              { "subtopic": "1.7 Energy, work and power", "search": "1.7 Energy, work and power" },
              { "subtopic": "1.8 Pressure", "search": "1.8 Pressure" }
            ]
          },
          {
            "topic": "2 Thermal physics",
            "subtopics": [
              { "subtopic": "2.1 Kinetic particle model of matter", "search": "2.1 Kinetic particle model of matter" },
              { "subtopic": "2.2 Thermal properties and temperature", "search": "2.2 Thermal properties and temperature" },
              { "subtopic": "2.3 Transfer of thermal energy", "search": "2.3 Transfer of thermal energy" }
            ]
          },
          {
            "topic": "3 Waves",
            "subtopics": [
              { "subtopic": "3.1 General properties of waves", "search": "3.1 General properties of waves" },
              { "subtopic": "3.2 Light", "search": "3.2 Light" },
              { "subtopic": "3.3 Electromagnetic spectrum", "search": "3.3 Electromagnetic spectrum" },
              { "subtopic": "3.4 Sound", "search": "3.4 Sound" }
            ]
          },
          {
            "topic": "4 Electricity and magnetism",
            "subtopics": [
              { "subtopic": "4.1 Simple phenomena of magnetism", "search": "4.1 Simple phenomena of magnetism" },
              { "subtopic": "4.2 Electrical quantities", "search": "4.2 Electrical quantities" },
              { "subtopic": "4.3 Electric circuits", "search": "4.3 Electric circuits" },
              { "subtopic": "4.4 Electrical safety", "search": "4.4 Electrical safety" },
              { "subtopic": "4.5 Electromagnetic effects", "search": "4.5 Electromagnetic effects" }
            ]
          },
          {
            "topic": "5 Nuclear physics",
            "subtopics": [
              { "subtopic": "5.1 The nuclear model of the atom", "search": "5.1 The nuclear model of the atom" },
              { "subtopic": "5.2 Radioactivity", "search": "5.2 Radioactivity" }
            ]
          },
          {
            "topic": "6 Space physics",
            "subtopics": [
              { "subtopic": "6.1 The Earth and the Solar System", "search": "6.1 The Earth and the Solar System" },
              { "subtopic": "6.2 Stars and the Universe", "search": "6.2 Stars and the Universe" }
            ]
          }
        ]
      }]
  },


  {
    "subject": "Biology",

    "board": "cambridge",
    "level": "igcse",

    "units": [
      {
        "unit": "Biology",
        "topics": [
          {
            "topic": "1 Characteristics and classification of living organisms",
            "subtopics": [
              { "subtopic": "1.1 Characteristics of living organisms", "search": "1.1 Characteristics of living organisms" },
              { "subtopic": "1.2 Concept and uses of classification systems", "search": "1.2 Concept and uses of classification systems" },
              { "subtopic": "1.3 Features of organisms", "search": "1.3 Features of organisms" }
            ]
          },
          {
            "topic": "2 Organisation of the organism",
            "subtopics": [
              { "subtopic": "2.1 Cell structure", "search": "2.1 Cell structure" },
              { "subtopic": "2.2 Size of specimens", "search": "2.2 Size of specimens" }
            ]
          },
          {
            "topic": "3 Movement into and out of cells",
            "subtopics": [
              { "subtopic": "3.1 Diffusion", "search": "3.1 Diffusion" },
              { "subtopic": "3.2 Osmosis", "search": "3.2 Osmosis" },
              { "subtopic": "3.3 Active transport", "search": "3.3 Active transport" }
            ]
          },
          {
            "topic": "4 Biological molecules",
            "subtopics": [
              { "subtopic": "4.1 Biological molecules", "search": "4.1 Biological molecules" }
            ]
          },
          {
            "topic": "5 Enzymes",
            "subtopics": [
              { "subtopic": "5.1 Enzymes", "search": "5.1 Enzymes" }
            ]
          },
          {
            "topic": "6 Plant nutrition",
            "subtopics": [
              { "subtopic": "6.1 Photosynthesis", "search": "6.1 Photosynthesis" },
              { "subtopic": "6.2 Leaf structure", "search": "6.2 Leaf structure" }
            ]
          },
          {
            "topic": "7 Human nutrition",
            "subtopics": [
              { "subtopic": "7.1 Diet", "search": "7.1 Diet" },
              { "subtopic": "7.2 Digestive system", "search": "7.2 Digestive system" },
              { "subtopic": "7.3 Physical digestion", "search": "7.3 Physical digestion" },
              { "subtopic": "7.4 Chemical digestion", "search": "7.4 Chemical digestion" },
              { "subtopic": "7.5 Absorption", "search": "7.5 Absorption" }
            ]
          },
          {
            "topic": "8 Transport in plants",
            "subtopics": [
              { "subtopic": "8.1 Xylem and phloem", "search": "8.1 Xylem and phloem" },
              { "subtopic": "8.2 Water uptake", "search": "8.2 Water uptake" },
              { "subtopic": "8.3 Transpiration", "search": "8.3 Transpiration" },
              { "subtopic": "8.4 Translocation", "search": "8.4 Translocation" }
            ]
          },
          {
            "topic": "9 Transport in animals",
            "subtopics": [
              { "subtopic": "9.1 Circulatory systems", "search": "9.1 Circulatory systems" },
              { "subtopic": "9.2 Heart", "search": "9.2 Heart" },
              { "subtopic": "9.3 Blood vessels", "search": "9.3 Blood vessels" },
              { "subtopic": "9.4 Blood", "search": "9.4 Blood" }
            ]
          },
          {
            "topic": "10 Diseases and immunity",
            "subtopics": [
              { "subtopic": "10.1 Diseases and immunity", "search": "10.1 Diseases and immunity" }
            ]
          },
          {
            "topic": "11 Gas exchange in humans",
            "subtopics": [
              { "subtopic": "11.1 Gas exchange in humans", "search": "11.1 Gas exchange in humans" }
            ]
          },
          {
            "topic": "12 Respiration",
            "subtopics": [
              { "subtopic": "12.1 Respiration", "search": "12.1 Respiration" },
              { "subtopic": "12.2 Aerobic respiration", "search": "12.2 Aerobic respiration" },
              { "subtopic": "12.3 Anaerobic respiration", "search": "12.3 Anaerobic respiration" }
            ]
          },
          {
            "topic": "13 Excretion in humans",
            "subtopics": [
              { "subtopic": "13.1 Excretion in humans", "search": "13.1 Excretion in humans" }
            ]
          },
          {
            "topic": "14 Coordination and response",
            "subtopics": [
              { "subtopic": "14.1 Coordination and response", "search": "14.1 Coordination and response" },
              { "subtopic": "14.2 Sense organs", "search": "14.2 Sense organs" },
              { "subtopic": "14.3 Hormones", "search": "14.3 Hormones" },
              { "subtopic": "14.4 Homeostasis", "search": "14.4 Homeostasis" },
              { "subtopic": "14.5 Tropic responses", "search": "14.5 Tropic responses" }
            ]
          },
          {
            "topic": "15 Drugs",
            "subtopics": [
              { "subtopic": "15.1 Drugs", "search": "15.1 Drugs" }
            ]
          },
          {
            "topic": "16 Reproduction",
            "subtopics": [
              { "subtopic": "16.1 Asexual reproduction", "search": "16.1 Asexual reproduction" },
              { "subtopic": "16.2 Sexual reproduction", "search": "16.2 Sexual reproduction" },
              { "subtopic": "16.3 Sexual reproduction in plants", "search": "16.3 Sexual reproduction in plants" },
              { "subtopic": "16.4 Sexual reproduction in humans", "search": "16.4 Sexual reproduction in humans" },
              { "subtopic": "16.5 Sex hormones in humans", "search": "16.5 Sex hormones in humans" },
              { "subtopic": "16.6 Sexually transmitted infections", "search": "16.6 Sexually transmitted infections" }
            ]
          },
          {
            "topic": "17 Inheritance",
            "subtopics": [
              { "subtopic": "17.1 Chromosomes, genes and proteins", "search": "17.1 Chromosomes, genes and proteins" },
              { "subtopic": "17.2 Mitosis", "search": "17.2 Mitosis" },
              { "subtopic": "17.3 Meiosis", "search": "17.3 Meiosis" },
              { "subtopic": "17.4 Monohybrid inheritance", "search": "17.4 Monohybrid inheritance" }
            ]
          },
          {
            "topic": "18 Variation and selection",
            "subtopics": [
              { "subtopic": "18.1 Variation", "search": "18.1 Variation" },
              { "subtopic": "18.2 Adaptive features", "search": "18.2 Adaptive features" },
              { "subtopic": "18.3 Selection", "search": "18.3 Selection" }
            ]
          },
          {
            "topic": "19 Organisms and their environment",
            "subtopics": [
              { "subtopic": "19.1 Energy flow", "search": "19.1 Energy flow" },
              { "subtopic": "19.2 Food chains and food webs", "search": "19.2 Food chains and food webs" },
              { "subtopic": "19.3 Nutrient cycles", "search": "19.3 Nutrient cycles" },
              { "subtopic": "19.4 Populations", "search": "19.4 Populations" }
            ]
          },
          {
            "topic": "20 Human influences on ecosystems",
            "subtopics": [
              { "subtopic": "20.1 Food supply", "search": "20.1 Food supply" },
              { "subtopic": "20.2 Habitat destruction", "search": "20.2 Habitat destruction" },
              { "subtopic": "20.3 Pollution", "search": "20.3 Pollution" },
              { "subtopic": "20.4 Conservation", "search": "20.4 Conservation" }
            ]
          },
          {
            "topic": "21 Biotechnology and genetic modification",
            "subtopics": [
              { "subtopic": "21.1 Biotechnology and genetic modification", "search": "21.1 Biotechnology and genetic modification" },
              { "subtopic": "21.2 Biotechnology", "search": "21.2 Biotechnology" },
              { "subtopic": "21.3 Genetic modification", "search": "21.3 Genetic modification" }
            ]
          }
        ]
      }]
  }
  ,

  {
    "subject": "Chemistry",

    "board": "cambridge",
    "level": "igcse",

    "units": [
      {
        "unit": "Chemistry",

        "topics": [
          {
            "topic": "1 States of matter",
            "subtopics": [
              { "subtopic": "1.1 Solids, liquids and gases", "search": "1.1 Solids, liquids and gases" },
              { "subtopic": "1.2 Diffusion", "search": "1.2 Diffusion" }
            ]
          },
          {
            "topic": "2 Atoms, elements and compounds",
            "subtopics": [
              { "subtopic": "2.1 Elements, compounds and mixtures", "search": "2.1 Elements, compounds and mixtures" },
              { "subtopic": "2.2 Atomic structure and the Periodic Table", "search": "2.2 Atomic structure and the Periodic Table" },
              { "subtopic": "2.3 Isotopes", "search": "2.3 Isotopes" },
              { "subtopic": "2.4 Ions and ionic bonds", "search": "2.4 Ions and ionic bonds" },
              { "subtopic": "2.5 Simple molecules and covalent bonds", "search": "2.5 Simple molecules and covalent bonds" },
              { "subtopic": "2.6 Giant covalent structures", "search": "2.6 Giant covalent structures" },
              { "subtopic": "2.7 Metallic bonding", "search": "2.7 Metallic bonding" }
            ]
          },
          {
            "topic": "3 Stoichiometry",
            "subtopics": [
              { "subtopic": "3.1 Formulae", "search": "3.1 Formulae" },
              { "subtopic": "3.2 Relative masses of atoms and molecules", "search": "3.2 Relative masses of atoms and molecules" },
              { "subtopic": "3.3 The mole and the Avogadro constant", "search": "3.3 The mole and the Avogadro constant" }
            ]
          },
          {
            "topic": "4 Electrochemistry",
            "subtopics": [
              { "subtopic": "4.1 Electrolysis", "search": "4.1 Electrolysis" },
              { "subtopic": "4.2 Hydrogen-oxygen fuel cells", "search": "4.2 Hydrogen-oxygen fuel cells" }
            ]
          },
          {
            "topic": "5 Chemical energetics",
            "subtopics": [
              { "subtopic": "5.1 Exothermic and endothermic reactions", "search": "5.1 Exothermic and endothermic reactions" }
            ]
          },
          {
            "topic": "6 Chemical reactions",
            "subtopics": [
              { "subtopic": "6.1 Physical and chemical changes", "search": "6.1 Physical and chemical changes" },
              { "subtopic": "6.2 Rate of reaction", "search": "6.2 Rate of reaction" },
              { "subtopic": "6.3 Reversible reactions and equilibrium", "search": "6.3 Reversible reactions and equilibrium" },
              { "subtopic": "6.4 Redox", "search": "6.4 Redox" }
            ]
          },
          {
            "topic": "7 Acids, bases and salts",
            "subtopics": [
              { "subtopic": "7.1 The characteristic properties of acids and bases", "search": "7.1 The characteristic properties of acids and bases" },
              { "subtopic": "7.2 Oxides", "search": "7.2 Oxides" },
              { "subtopic": "7.3 Preparation of salts", "search": "7.3 Preparation of salts" }
            ]
          },
          {
            "topic": "8 The Periodic Table",
            "subtopics": [
              { "subtopic": "8.1 Arrangement of elements", "search": "8.1 Arrangement of elements" },
              { "subtopic": "8.2 Group I properties", "search": "8.2 Group I properties" },
              { "subtopic": "8.3 Group VII properties", "search": "8.3 Group VII properties" },
              { "subtopic": "8.4 Transition elements", "search": "8.4 Transition elements" },
              { "subtopic": "8.5 Noble gases", "search": "8.5 Noble gases" }
            ]
          },
          {
            "topic": "9 Metals",
            "subtopics": [
              { "subtopic": "9.1 Properties of metals", "search": "9.1 Properties of metals" },
              { "subtopic": "9.2 Uses of metals", "search": "9.2 Uses of metals" },
              { "subtopic": "9.3 Alloys and their properties", "search": "9.3 Alloys and their properties" },
              { "subtopic": "9.4 Reactivity series", "search": "9.4 Reactivity series" },
              { "subtopic": "9.5 Corrosion of metals", "search": "9.5 Corrosion of metals" },
              { "subtopic": "9.6 Extraction of metals", "search": "9.6 Extraction of metals" }
            ]
          },
          {
            "topic": "10 Chemistry of the environment",
            "subtopics": [
              { "subtopic": "10.1 Water", "search": "10.1 Water" },
              { "subtopic": "10.2 Fertilisers", "search": "10.2 Fertilisers" },
              { "subtopic": "10.3 Air quality and climate", "search": "10.3 Air quality and climate" }
            ]
          },
          {
            "topic": "11 Organic chemistry",
            "subtopics": [
              { "subtopic": "11.1 Formulae, functional groups and terminology", "search": "11.1 Formulae, functional groups and terminology" },
              { "subtopic": "11.2 Naming organic compounds", "search": "11.2 Naming organic compounds" },
              { "subtopic": "11.3 Fuels", "search": "11.3 Fuels" },
              { "subtopic": "11.4 Alkanes", "search": "11.4 Alkanes" },
              { "subtopic": "11.5 Alkenes", "search": "11.5 Alkenes" },
              { "subtopic": "11.6 Alcohols", "search": "11.6 Alcohols" },
              { "subtopic": "11.7 Carboxylic acids", "search": "11.7 Carboxylic acids" },
              { "subtopic": "11.8 Polymers", "search": "11.8 Polymers" }
            ]
          },
          {
            "topic": "12 Experimental techniques and chemical analysis",
            "subtopics": [
              { "subtopic": "12.1 Experimental design", "search": "12.1 Experimental design" },
              { "subtopic": "12.2 Acid-base titrations", "search": "12.2 Acid-base titrations" },
              { "subtopic": "12.3 Chromatography", "search": "12.3 Chromatography" },
              { "subtopic": "12.4 Separation and purification", "search": "12.4 Separation and purification" },
              { "subtopic": "12.5 Identification of ions and gases", "search": "12.5 Identification of ions and gases" }
            ]
          }
        ]
      }]
  },

  {
    "subject": "Chemistry",

    "board": "cambridge",
    "level": "a-level",

    "units": [
      {
        "unit": "AS",

        "topics": [
          {
            "topic": "1 Atomic Structure",
            "subtopics": [
              { "subtopic": "1.1 Particles in the atom and atomic radius", "search": "1.1 Particles in the atom and atomic radius" },
              { "subtopic": "1.2 Isotopes", "search": "1.2 Isotopes" },
              { "subtopic": "1.3 Electrons, energy levels and atomic orbitals", "search": "1.3 Electrons, energy levels and atomic orbitals" },
              { "subtopic": "1.4 Ionisation energy", "search": "1.4 Ionisation energy" }
            ]
          },
          {
            "topic": "2 Atoms, Molecules and Stoichiometry",
            "subtopics": [
              { "subtopic": "2.1 Relative masses of atoms and molecules", "search": "2.1 Relative masses of atoms and molecules" },
              { "subtopic": "2.2 The mole and the Avogadro constant", "search": "2.2 The mole and the Avogadro constant" },
              { "subtopic": "2.3 Formulas", "search": "2.3 Formulas" },
              { "subtopic": "2.4 Reacting masses and volumes (of solutions and gases)", "search": "2.4 Reacting masses and volumes (of solutions and gases)" }
            ]
          },
          {
            "topic": "3 Chemical Bonding",
            "subtopics": [
              { "subtopic": "3.1 Electronegativity and bonding", "search": "3.1 Electronegativity and bonding" },
              { "subtopic": "3.2 Ionic bonding", "search": "3.2 Ionic bonding" },
              { "subtopic": "3.3 Metallic bonding", "search": "3.3 Metallic bonding" },
              { "subtopic": "3.4 Covalent bonding and coordinate (dative covalent) bonding", "search": "3.4 Covalent bonding and coordinate (dative covalent) bonding" },
              { "subtopic": "3.5 Shapes of molecules", "search": "3.5 Shapes of molecules" },
              { "subtopic": "3.6 Intermolecular forces, electronegativity and bond properties", "search": "3.6 Intermolecular forces, electronegativity and bond properties" },
              { "subtopic": "3.7 Dot-and-cross diagrams", "search": "3.7 Dot-and-cross diagrams" }
            ]
          },
          {
            "topic": "4 States of Matter",
            "subtopics": [
              { "subtopic": "4.1 The gaseous state: ideal and real gases and pV = nRT", "search": "4.1 The gaseous state: ideal and real gases and pV = nRT" },
              { "subtopic": "4.2 Bonding and structure", "search": "4.2 Bonding and structure" }
            ]
          },
          {
            "topic": "5 Chemical Energetics",
            "subtopics": [
              { "subtopic": "5.1 Enthalpy change, ΔH", "search": "5.1 Enthalpy change, ΔH" },
              { "subtopic": "5.2 Hess's law", "search": "5.2 Hess's law" }
            ]
          },
          {
            "topic": "6 Electrochemistry",
            "subtopics": [
              { "subtopic": "6.1 Redox processes: electron transfer and changes in oxidation number (oxidation state)", "search": "6.1 Redox processes: electron transfer and changes in oxidation number (oxidation state)" }
            ]
          },
          {
            "topic": "7 Equilibria",
            "subtopics": [
              { "subtopic": "7.1 Chemical equilibria: reversible reactions, dynamic equilibrium", "search": "7.1 Chemical equilibria: reversible reactions, dynamic equilibrium" },
              { "subtopic": "7.2 Brønsted-Lowry theory of acids and bases", "search": "7.2 Brønsted-Lowry theory of acids and bases" }
            ]
          },
          {
            "topic": "8 Reaction Kinetics",
            "subtopics": [
              { "subtopic": "8.1 Rate of reaction", "search": "8.1 Rate of reaction" },
              { "subtopic": "8.2 Effect of temperature on reaction rates and the concept of activation energy", "search": "8.2 Effect of temperature on reaction rates and the concept of activation energy" },
              { "subtopic": "8.3 Homogeneous and heterogeneous catalysts", "search": "8.3 Homogeneous and heterogeneous catalysts" }
            ]
          },
          {
            "topic": "9 The Periodic Table: Chemical Periodicity",
            "subtopics": [
              { "subtopic": "9.1 Periodicity of physical properties of the elements in Period 3", "search": "9.1 Periodicity of physical properties of the elements in Period 3" },
              { "subtopic": "9.2 Periodicity of chemical properties of the elements in Period 3", "search": "9.2 Periodicity of chemical properties of the elements in Period 3" },
              { "subtopic": "9.3 Chemical periodicity of other elements", "search": "9.3 Chemical periodicity of other elements" }
            ]
          },
          {
            "topic": "10 Group 2",
            "subtopics": [
              { "subtopic": "10.1 Similarities and trends in the properties of the Group 2 metals, magnesium to barium, and their compounds", "search": "10.1 Similarities and trends in the properties of the Group 2 metals, magnesium to barium, and their compounds" }
            ]
          },
          {
            "topic": "11 Group 17",
            "subtopics": [
              { "subtopic": "11.1 Physical properties of the Group 17 elements", "search": "11.1 Physical properties of the Group 17 elements" },
              { "subtopic": "11.2 The chemical properties of the halogen elements and the hydrogen halides", "search": "11.2 The chemical properties of the halogen elements and the hydrogen halides" },
              { "subtopic": "11.3 Some reactions of the halide ions", "search": "11.3 Some reactions of the halide ions" },
              { "subtopic": "11.4 The reactions of chlorine", "search": "11.4 The reactions of chlorine" }
            ]
          },
          {
            "topic": "12 Nitrogen and Sulfur",
            "subtopics": [
              { "subtopic": "12.1 Nitrogen and sulfur", "search": "12.1 Nitrogen and sulfur" }
            ]
          },
          {
            "topic": "13 An Introduction to Organic Chemistry",
            "subtopics": [
              { "subtopic": "13.1 Formulas, functional groups and the naming of organic compounds", "search": "13.1 Formulas, functional groups and the naming of organic compounds" },
              { "subtopic": "13.2 Characteristic organic reactions", "search": "13.2 Characteristic organic reactions" },
              { "subtopic": "13.3 Shapes of organic molecules; σ and π bonds", "search": "13.3 Shapes of organic molecules; σ and π bonds" },
              { "subtopic": "13.4 Isomerism: structural isomerism and stereoisomerism", "search": "13.4 Isomerism: structural isomerism and stereoisomerism" }
            ]
          },
          {
            "topic": "14 Hydrocarbons",
            "subtopics": [
              { "subtopic": "14.1 Alkanes", "search": "14.1 Alkanes" },
              { "subtopic": "14.2 Alkenes", "search": "14.2 Alkenes" }
            ]
          },
          {
            "topic": "15 Halogen Compounds",
            "subtopics": [
              { "subtopic": "15.1 Halogenoalkanes", "search": "15.1 Halogenoalkanes" }
            ]
          },
          {
            "topic": "16 Hydroxy Compounds",
            "subtopics": [
              { "subtopic": "16.1 Alcohols", "search": "16.1 Alcohols" }
            ]
          },
          {
            "topic": "17 Carbonyl Compounds",
            "subtopics": [
              { "subtopic": "17.1 Aldehydes and ketones", "search": "17.1 Aldehydes and ketones" }
            ]
          },
          {
            "topic": "18 Carboxylic Acids and Derivatives",
            "subtopics": [
              { "subtopic": "18.1 Carboxylic acids", "search": "18.1 Carboxylic acids" },
              { "subtopic": "18.2 Esters", "search": "18.2 Esters" }
            ]
          },
          {
            "topic": "19 Nitrogen Compounds",
            "subtopics": [
              { "subtopic": "19.1 Primary amines", "search": "19.1 Primary amines" },
              { "subtopic": "19.2 Nitriles and hydroxynitriles", "search": "19.2 Nitriles and hydroxynitriles" }
            ]
          },
          {
            "topic": "20 Polymerisation",
            "subtopics": [
              { "subtopic": "20.1 Addition polymerisation", "search": "20.1 Addition polymerisation" }
            ]
          },
          {
            "topic": "21 Organic Synthesis",
            "subtopics": [
              { "subtopic": "21.1 Organic synthesis", "search": "21.1 Organic synthesis" }
            ]
          }, {
            "topic": "22 Analytical Techniques",
            "subtopics": [
              { "subtopic": "22.1 Infrared spectroscopy", "search": "22.1 Infrared spectroscopy" },
              { "subtopic": "22.2 Mass spectrometry", "search": "22.2 Mass spectrometry" }
            ]
          },]
      },
      {
        "unit": "A2",
        "topics": [

          {
            "topic": "23 Chemical Energetics",
            "subtopics": [
              { "subtopic": "23.1 Lattice energy and Born-Haber cycles", "search": "23.1 Lattice energy and Born-Haber cycles" },
              { "subtopic": "23.2 Enthalpies of solution and hydration", "search": "23.2 Enthalpies of solution and hydration" },
              { "subtopic": "23.3 Entropy change", "search": "23.3 Entropy change" },
              { "subtopic": "23.4 Gibbs free energy change", "search": "23.4 Gibbs free energy change" }
            ]
          },
          {
            "topic": "24 Electrochemistry",
            "subtopics": [
              { "subtopic": "24.1 Electrolysis", "search": "24.1 Electrolysis" },
              { "subtopic": "24.2 Standard electrode potentials, standard cell potentials and the Nernst equation", "search": "24.2 Standard electrode potentials, standard cell potentials and the Nernst equation" }
            ]
          },
          {
            "topic": "25 Equilibria",
            "subtopics": [
              { "subtopic": "25.1 Acids and bases", "search": "25.1 Acids and bases" },
              { "subtopic": "25.2 Partition coefficients", "search": "25.2 Partition coefficients" }
            ]
          },
          {
            "topic": "26 Reaction Kinetics",
            "subtopics": [
              { "subtopic": "26.1 Simple rate equations, orders of reaction and rate constants", "search": "26.1 Simple rate equations, orders of reaction and rate constants" },
              { "subtopic": "26.2 Homogeneous and heterogeneous catalysts", "search": "26.2 Homogeneous and heterogeneous catalysts" }
            ]
          },
          {
            "topic": "27 Group 2",
            "subtopics": [
              { "subtopic": "27.1 Similarities and trends in the properties of the Group 2 metals, magnesium to barium, and their compounds", "search": "27.1 Similarities and trends in the properties of the Group 2 metals, magnesium to barium, and their compounds" }
            ]
          },
          {
            "topic": "28 Chemistry of Transition Elements",
            "subtopics": [
              { "subtopic": "28.1 General physical and chemical properties of the first row of transition elements, titanium to copper", "search": "28.1 General physical and chemical properties of the first row of transition elements, titanium to copper" },
              { "subtopic": "28.2 General characteristic chemical properties of the first set of transition elements, titanium to copper", "search": "28.2 General characteristic chemical properties of the first set of transition elements, titanium to copper" },
              { "subtopic": "28.3 Colour of complexes", "search": "28.3 Colour of complexes" },
              { "subtopic": "28.4 Stereoisomerism in transition element complexes", "search": "28.4 Stereoisomerism in transition element complexes" },
              { "subtopic": "28.5 Stability constants", "search": "28.5 Stability constants" }
            ]
          },
          {
            "topic": "29 Organic Chemistry",
            "subtopics": [
              { "subtopic": "29.1 Formulas, functional groups and the naming of organic compounds", "search": "29.1 Formulas, functional groups and the naming of organic compounds" },
              { "subtopic": "29.2 Characteristic organic reactions", "search": "29.2 Characteristic organic reactions" },
              { "subtopic": "29.3 Shapes of aromatic organic molecules", "search": "29.3 Shapes of aromatic organic molecules" },
              { "subtopic": "29.4 Isomerism: optical", "search": "29.4 Isomerism: optical" }
            ]
          },
          {
            "topic": "30 Hydrocarbons",
            "subtopics": [
              { "subtopic": "30.1 Arenes", "search": "30.1 Arenes" }
            ]
          },
          {
            "topic": "31 Halogen Compounds",
            "subtopics": [
              { "subtopic": "31.1 Halogen compounds", "search": "31.1 Halogen compounds" }
            ]
          },
          {
            "topic": "32 Hydroxy Compounds",
            "subtopics": [
              { "subtopic": "32.1 Alcohols", "search": "32.1 Alcohols" },
              { "subtopic": "32.2 Phenol", "search": "32.2 Phenol" }
            ]
          },
          {
            "topic": "33 Carboxylic Acids and Derivatives",
            "subtopics": [
              { "subtopic": "33.1 Carboxylic acids", "search": "33.1 Carboxylic acids" },
              { "subtopic": "33.2 Esters", "search": "33.2 Esters" },
              { "subtopic": "33.3 Acyl chlorides", "search": "33.3 Acyl chlorides" }
            ]
          },
          {
            "topic": "34 Nitrogen Compounds",
            "subtopics": [
              { "subtopic": "34.1 Primary and secondary amines", "search": "34.1 Primary and secondary amines" },
              { "subtopic": "34.2 Phenylamine and azo compounds", "search": "34.2 Phenylamine and azo compounds" },
              { "subtopic": "34.3 Amides", "search": "34.3 Amides" },
              { "subtopic": "34.4 Amino acids", "search": "34.4 Amino acids" }
            ]
          },
          {
            "topic": "35 Polymerisation",
            "subtopics": [
              { "subtopic": "35.1 Condensation polymerisation", "search": "35.1 Condensation polymerisation" },
              { "subtopic": "35.2 Predicting polymerisation type", "search": "35.2 Predicting polymerisation type" },
              { "subtopic": "35.3 Degradable polymers", "search": "35.3 Degradable polymers" }
            ]
          },
          {
            "topic": "36 Organic Synthesis",
            "subtopics": [
              { "subtopic": "36.1 Organic synthesis", "search": "36.1 Organic synthesis" }
            ]
          },
          {
            "topic": "37 Analytical Techniques",
            "subtopics": [
              { "subtopic": "37.1 Thin-layer chromatography", "search": "37.1 Thin-layer chromatography" },
              { "subtopic": "37.2 Gas-liquid chromatography", "search": "37.2 Gas-liquid chromatography" },
              { "subtopic": "37.3 Carbon-13 NMR spectroscopy", "search": "37.3 Carbon-13 NMR spectroscopy" },
              { "subtopic": "37.4 Proton NMR spectroscopy", "search": "37.4 Proton NMR spectroscopy" }
            ]
          }
        ]
      }]
  },


  {
    "subject": "Physics",
    "board": "cambridge",
    "level": "a-level",
    "units": [
      {
        "unit": "AS",
        "topics": [
          {
            "topic": "1 Physical quantities and units",
            "subtopics": [
              { "subtopic": "1.1 Physical quantities", "search": "1.1 Physical quantities" },
              { "subtopic": "1.2 SI units", "search": "1.2 SI units" },
              { "subtopic": "1.3 Errors and uncertainties", "search": "1.3 Errors and uncertainties" },
              { "subtopic": "1.4 Scalars and vectors", "search": "1.4 Scalars and vectors" }
            ]
          },
          {
            "topic": "2 Kinematics",
            "subtopics": [
              { "subtopic": "2.1 Equations of motion", "search": "2.1 Equations of motion" }
            ]
          },
          {
            "topic": "3 Dynamics",
            "subtopics": [
              { "subtopic": "3.1 Momentum and Newton's laws of motion", "search": "3.1 Momentum and Newton's laws of motion" },
              { "subtopic": "3.2 Non-uniform motion", "search": "3.2 Non-uniform motion" },
              { "subtopic": "3.3 Linear momentum and its conservation", "search": "3.3 Linear momentum and its conservation" }
            ]
          },
          {
            "topic": "4 Forces, density and pressure",
            "subtopics": [
              { "subtopic": "4.1 Turning effects of forces", "search": "4.1 Turning effects of forces" },
              { "subtopic": "4.2 Equilibrium of forces", "search": "4.2 Equilibrium of forces" },
              { "subtopic": "4.3 Density and pressure", "search": "4.3 Density and pressure" }
            ]
          },
          {
            "topic": "5 Work, energy and power",
            "subtopics": [
              { "subtopic": "5.1 Energy conservation", "search": "5.1 Energy conservation" },
              { "subtopic": "5.2 Gravitational potential energy and kinetic energy", "search": "5.2 Gravitational potential energy and kinetic energy" }
            ]
          },
          {
            "topic": "6 Deformation of solids",
            "subtopics": [
              { "subtopic": "6.1 Stress and strain", "search": "6.1 Stress and strain" },
              { "subtopic": "6.2 Elastic and plastic behaviour", "search": "6.2 Elastic and plastic behaviour" }
            ]
          },
          {
            "topic": "7 Waves",
            "subtopics": [
              { "subtopic": "7.1 Progressive waves", "search": "7.1 Progressive waves" },
              { "subtopic": "7.2 Transverse and longitudinal waves", "search": "7.2 Transverse and longitudinal waves" },
              { "subtopic": "7.3 Doppler effect for sound waves", "search": "7.3 Doppler effect for sound waves" },
              { "subtopic": "7.4 Electromagnetic spectrum", "search": "7.4 Electromagnetic spectrum" },
              { "subtopic": "7.5 Polarisation", "search": "7.5 Polarisation" }
            ]
          },
          {
            "topic": "8 Superposition",
            "subtopics": [
              { "subtopic": "8.1 Stationary waves", "search": "8.1 Stationary waves" },
              { "subtopic": "8.2 Diffraction", "search": "8.2 Diffraction" },
              { "subtopic": "8.3 Interference", "search": "8.3 Interference" },
              { "subtopic": "8.4 The diffraction grating", "search": "8.4 The diffraction grating" }
            ]
          },
          {
            "topic": "9 Electricity",
            "subtopics": [
              { "subtopic": "9.1 Electric current", "search": "9.1 Electric current" },
              { "subtopic": "9.2 Potential difference and power", "search": "9.2 Potential difference and power" },
              { "subtopic": "9.3 Resistance and resistivity", "search": "9.3 Resistance and resistivity" }
            ]
          },
          {
            "topic": "10 D.C. circuits",
            "subtopics": [
              { "subtopic": "10.1 Practical circuits", "search": "10.1 Practical circuits" },
              { "subtopic": "10.2 Kirchhoff's laws", "search": "10.2 Kirchhoff's laws" },
              { "subtopic": "10.3 Potential dividers", "search": "10.3 Potential dividers" }
            ]
          },
          {
            "topic": "11 Particle physics",
            "subtopics": [
              { "subtopic": "11.1 Atoms, nuclei and radiation", "search": "11.1 Atoms, nuclei and radiation" },
              { "subtopic": "11.2 Fundamental particles", "search": "11.2 Fundamental particles" }
            ]
          }]
      },
      {
        "unit": "A2",
        "topics": [
          {
            "topic": "12 Motion in a circle",
            "subtopics": [
              { "subtopic": "12.1 Kinematics of uniform circular motion", "search": "12.1 Kinematics of uniform circular motion" },
              { "subtopic": "12.2 Centripetal acceleration", "search": "12.2 Centripetal acceleration" }
            ]
          },
          {
            "topic": "13 Gravitational fields",
            "subtopics": [
              { "subtopic": "13.1 Gravitational field", "search": "13.1 Gravitational field" },
              { "subtopic": "13.2 Gravitational force between point masses", "search": "13.2 Gravitational force between point masses" },
              { "subtopic": "13.3 Gravitational field of a point mass", "search": "13.3 Gravitational field of a point mass" },
              { "subtopic": "13.4 Gravitational potential", "search": "13.4 Gravitational potential" }
            ]
          },
          {
            "topic": "14 Temperature",
            "subtopics": [
              { "subtopic": "14.1 Thermal equilibrium", "search": "14.1 Thermal equilibrium" },
              { "subtopic": "14.2 Temperature scales", "search": "14.2 Temperature scales" },
              { "subtopic": "14.3 Specific heat capacity and specific latent heat", "search": "14.3 Specific heat capacity and specific latent heat" }
            ]
          },
          {
            "topic": "15 Ideal gases",
            "subtopics": [
              { "subtopic": "15.1 The mole", "search": "15.1 The mole" },
              { "subtopic": "15.2 Equation of state", "search": "15.2 Equation of state" },
              { "subtopic": "15.3 Kinetic theory of gases", "search": "15.3 Kinetic theory of gases" }
            ]
          },
          {
            "topic": "16 Thermodynamics",
            "subtopics": [
              { "subtopic": "16.1 Internal energy", "search": "16.1 Internal energy" },
              { "subtopic": "16.2 The first law of thermodynamics", "search": "16.2 The first law of thermodynamics" }
            ]
          },
          {
            "topic": "17 Oscillations",
            "subtopics": [
              { "subtopic": "17.1 Simple harmonic oscillations", "search": "17.1 Simple harmonic oscillations" },
              { "subtopic": "17.2 Energy in simple harmonic motion", "search": "17.2 Energy in simple harmonic motion" },
              { "subtopic": "17.3 Damped and forced oscillations, resonance", "search": "17.3 Damped and forced oscillations, resonance" }
            ]
          },
          {
            "topic": "18 Electric fields",
            "subtopics": [
              { "subtopic": "18.1 Electric fields and field lines", "search": "18.1 Electric fields and field lines" },
              { "subtopic": "18.2 Uniform electric fields", "search": "18.2 Uniform electric fields" },
              { "subtopic": "18.3 Electric force between point charges", "search": "18.3 Electric force between point charges" },
              { "subtopic": "18.4 Electric field of a point charge", "search": "18.4 Electric field of a point charge" },
              { "subtopic": "18.5 Electric potential", "search": "18.5 Electric potential" }
            ]
          },
          {
            "topic": "19 Capacitance",
            "subtopics": [
              { "subtopic": "19.1 Capacitors and capacitance", "search": "19.1 Capacitors and capacitance" },
              { "subtopic": "19.2 Energy stored in a capacitor", "search": "19.2 Energy stored in a capacitor" },
              { "subtopic": "19.3 Discharging a capacitor", "search": "19.3 Discharging a capacitor" }
            ]
          },
          {
            "topic": "20 Magnetic fields",
            "subtopics": [
              { "subtopic": "20.1 Concept of a magnetic field", "search": "20.1 Concept of a magnetic field" },
              { "subtopic": "20.2 Force on a current-carrying conductor", "search": "20.2 Force on a current-carrying conductor" },
              { "subtopic": "20.3 Force on a moving charge", "search": "20.3 Force on a moving charge" },
              { "subtopic": "20.4 Magnetic fields due to currents", "search": "20.4 Magnetic fields due to currents" },
              { "subtopic": "20.5 Electromagnetic induction", "search": "20.5 Electromagnetic induction" }
            ]
          },
          {
            "topic": "21 Alternating currents",
            "subtopics": [
              { "subtopic": "21.1 Characteristics of alternating currents", "search": "21.1 Characteristics of alternating currents" },
              { "subtopic": "21.2 Rectification and smoothing", "search": "21.2 Rectification and smoothing" }
            ]
          },
          {
            "topic": "22 Quantum physics",
            "subtopics": [
              { "subtopic": "22.1 Energy and momentum of a photon", "search": "22.1 Energy and momentum of a photon" },
              { "subtopic": "22.2 Photoelectric effect", "search": "22.2 Photoelectric effect" },
              { "subtopic": "22.3 Wave-particle duality", "search": "22.3 Wave-particle duality" },
              { "subtopic": "22.4 Energy levels in atoms and line spectra", "search": "22.4 Energy levels in atoms and line spectra" }
            ]
          },
          {
            "topic": "23 Nuclear physics",
            "subtopics": [
              { "subtopic": "23.1 Mass defect and nuclear binding energy", "search": "23.1 Mass defect and nuclear binding energy" },
              { "subtopic": "23.2 Radioactive decay", "search": "23.2 Radioactive decay" }
            ]
          },
          {
            "topic": "24 Medical physics",
            "subtopics": [
              { "subtopic": "24.1 Production and use of ultrasound", "search": "24.1 Production and use of ultrasound" },
              { "subtopic": "24.2 Production and use of X-rays", "search": "24.2 Production and use of X-rays" },
              { "subtopic": "24.3 PET scanning", "search": "24.3 PET scanning" }
            ]
          },
          {
            "topic": "25 Astronomy and cosmology",
            "subtopics": [
              { "subtopic": "25.1 Standard candles", "search": "25.1 Standard candles" },
              { "subtopic": "25.2 Stellar radii", "search": "25.2 Stellar radii" },
              { "subtopic": "25.3 Hubble's law and the Big Bang theory", "search": "25.3 Hubble's law and the Big Bang theory" }
            ]
          }
        ]
      }
    ]
  },
  {
    "subject": "Biology",
    "board": "cambridge",
    "level": "a-level",
    "units": [
      {
        "unit": "AS",
        "topics": [
          {
            "topic": "1 Cell structure",
            "subtopics": [
              { "subtopic": "1.1 The microscope in cell studies", "search": "1.1 The microscope in cell studies" },
              { "subtopic": "1.2 Cells as the basic units of living organisms", "search": "1.2 Cells as the basic units of living organisms" }
            ]
          },
          {
            "topic": "2 Biological molecules",
            "subtopics": [
              { "subtopic": "2.1 Testing for biological molecules", "search": "2.1 Testing for biological molecules" },
              { "subtopic": "2.2 Carbohydrates and lipids", "search": "2.2 Carbohydrates and lipids" },
              { "subtopic": "2.3 Proteins", "search": "2.3 Proteins" },
              { "subtopic": "2.4 Water", "search": "2.4 Water" }
            ]
          },
          {
            "topic": "3 Enzymes",
            "subtopics": [
              { "subtopic": "3.1 Mode of action of enzymes", "search": "3.1 Mode of action of enzymes" },
              { "subtopic": "3.2 Factors that affect enzyme action", "search": "3.2 Factors that affect enzyme action" }
            ]
          },
          {
            "topic": "4 Cell membranes and transport",
            "subtopics": [
              { "subtopic": "4.1 Fluid mosaic membranes", "search": "4.1 Fluid mosaic membranes" },
              { "subtopic": "4.2 Movement into and out of cells", "search": "4.2 Movement into and out of cells" }
            ]
          },
          {
            "topic": "5 The mitotic cell cycle",
            "subtopics": [
              { "subtopic": "5.1 Replication and division of nuclei and cells", "search": "5.1 Replication and division of nuclei and cells" },
              { "subtopic": "5.2 Chromosome behaviour in mitosis", "search": "5.2 Chromosome behaviour in mitosis" }
            ]
          },
          {
            "topic": "6 Nucleic acids and protein synthesis",
            "subtopics": [
              { "subtopic": "6.1 Structure of nucleic acids and replication of DNA", "search": "6.1 Structure of nucleic acids and replication of DNA" },
              { "subtopic": "6.2 Protein synthesis", "search": "6.2 Protein synthesis" }
            ]
          },
          {
            "topic": "7 Transport in plants",
            "subtopics": [
              { "subtopic": "7.1 Structure of transport tissues", "search": "7.1 Structure of transport tissues" },
              { "subtopic": "7.2 Transport mechanisms", "search": "7.2 Transport mechanisms" }
            ]
          },
          {
            "topic": "8 Transport in mammals",
            "subtopics": [
              { "subtopic": "8.1 The circulatory system", "search": "8.1 The circulatory system" },
              { "subtopic": "8.2 Transport of oxygen and carbon dioxide", "search": "8.2 Transport of oxygen and carbon dioxide" },
              { "subtopic": "8.3 The heart", "search": "8.3 The heart" }
            ]
          },
          {
            "topic": "9 Gas exchange",
            "subtopics": [
              { "subtopic": "9.1 The gas exchange system", "search": "9.1 The gas exchange system" }
            ]
          },
          {
            "topic": "10 Infectious diseases",
            "subtopics": [
              { "subtopic": "10.1 Infectious diseases", "search": "10.1 Infectious diseases" },
              { "subtopic": "10.2 Antibiotics", "search": "10.2 Antibiotics" }
            ]
          },
          {
            "topic": "11 Immunity",
            "subtopics": [
              { "subtopic": "11.1 The immune system", "search": "11.1 The immune system" },
              { "subtopic": "11.2 Antibodies and vaccination", "search": "11.2 Antibodies and vaccination" }
            ]
          },
          {
            "topic": "12 Energy and respiration",
            "subtopics": [
              { "subtopic": "12.1 Energy", "search": "12.1 Energy" },
              { "subtopic": "12.2 Respiration", "search": "12.2 Respiration" }
            ]
          }]
      },
      {
        "unit": "A2",
        "topics": [
          {
            "topic": "13 Photosynthesis",
            "subtopics": [
              { "subtopic": "13.1 Photosynthesis as an energy transfer process", "search": "13.1 Photosynthesis as an energy transfer process" },
              { "subtopic": "13.2 Investigation of limiting factors", "search": "13.2 Investigation of limiting factors" }
            ]
          },
          {
            "topic": "14 Homeostasis",
            "subtopics": [
              { "subtopic": "14.1 Homeostasis in mammals", "search": "14.1 Homeostasis in mammals" },
              { "subtopic": "14.2 Homeostasis in plants", "search": "14.2 Homeostasis in plants" }
            ]
          },
          {
            "topic": "15 Control and coordination",
            "subtopics": [
              { "subtopic": "15.1 Control and coordination in mammals", "search": "15.1 Control and coordination in mammals" },
              { "subtopic": "15.2 Control and coordination in plants", "search": "15.2 Control and coordination in plants" }
            ]
          },
          {
            "topic": "16 Inheritance",
            "subtopics": [
              { "subtopic": "16.1 Passage of information from parents to offspring", "search": "16.1 Passage of information from parents to offspring" },
              { "subtopic": "16.2 The roles of genes in determining the phenotype", "search": "16.2 The roles of genes in determining the phenotype" },
              { "subtopic": "16.3 Gene control", "search": "16.3 Gene control" }
            ]
          },
          {
            "topic": "17 Selection and evolution",
            "subtopics": [
              { "subtopic": "17.1 Variation", "search": "17.1 Variation" },
              { "subtopic": "17.2 Natural and artificial selection", "search": "17.2 Natural and artificial selection" },
              { "subtopic": "17.3 Evolution", "search": "17.3 Evolution" }
            ]
          },
          {
            "topic": "18 Classification, biodiversity and conservation",
            "subtopics": [
              { "subtopic": "18.1 Classification", "search": "18.1 Classification" },
              { "subtopic": "18.2 Biodiversity", "search": "18.2 Biodiversity" },
              { "subtopic": "18.3 Conservation", "search": "18.3 Conservation" }
            ]
          },
          {
            "topic": "19 Genetic technology",
            "subtopics": [
              { "subtopic": "19.1 Principles of genetic technology", "search": "19.1 Principles of genetic technology" },
              { "subtopic": "19.2 Genetic technology applied to medicine", "search": "19.2 Genetic technology applied to medicine" },
              { "subtopic": "19.3 Genetically modified organisms in agriculture", "search": "19.3 Genetically modified organisms in agriculture" }
            ]
          }
        ]
      }
    ]
  },


  {
    "subject": "Mathematics",
    "board": "cambridge",
    "level": "igcse",
    "units": [
      {
        "unit": "Mathematics",

        "topics": [
          {
            "topic": "1 Number",
            "subtopics": [
              { "subtopic": "1.1 Types of number", "search": "1.1 Types of number" },
              { "subtopic": "1.2 Sets", "search": "1.2 Sets" },
              { "subtopic": "1.3 Powers and roots", "search": "1.3 Powers and roots" },
              { "subtopic": "1.4 Fractions, decimals and percentages", "search": "1.4 Fractions, decimals and percentages" },
              { "subtopic": "1.5 Ordering", "search": "1.5 Ordering" },
              { "subtopic": "1.6 The four operations", "search": "1.6 The four operations" },
              { "subtopic": "1.7 Indices I", "search": "1.7 Indices I" },
              { "subtopic": "1.8 Standard form", "search": "1.8 Standard form" },
              { "subtopic": "1.9 Estimation", "search": "1.9 Estimation" },
              { "subtopic": "1.10 Limits of accuracy", "search": "1.10 Limits of accuracy" },
              { "subtopic": "1.11 Ratio and proportion", "search": "1.11 Ratio and proportion" },
              { "subtopic": "1.12 Rates", "search": "1.12 Rates" },
              { "subtopic": "1.13 Percentages", "search": "1.13 Percentages" },
              { "subtopic": "1.14 Using a calculator", "search": "1.14 Using a calculator" },
              { "subtopic": "1.15 Time", "search": "1.15 Time" },
              { "subtopic": "1.16 Money", "search": "1.16 Money" },
              { "subtopic": "1.17 Exponential growth and decay", "search": "1.17 Exponential growth and decay" },
              { "subtopic": "1.18 Surds", "search": "1.18 Surds" }
            ]
          },
          {
            "topic": "2 Algebra and graphs",
            "subtopics": [
              { "subtopic": "2.1 Introduction to algebra", "search": "2.1 Introduction to algebra" },
              { "subtopic": "2.2 Algebraic manipulation", "search": "2.2 Algebraic manipulation" },
              { "subtopic": "2.3 Algebraic fractions", "search": "2.3 Algebraic fractions" },
              { "subtopic": "2.4 Indices II", "search": "2.4 Indices II" },
              { "subtopic": "2.5 Equations", "search": "2.5 Equations" },
              { "subtopic": "2.6 Inequalities", "search": "2.6 Inequalities" },
              { "subtopic": "2.7 Sequences", "search": "2.7 Sequences" },
              { "subtopic": "2.8 Proportion", "search": "2.8 Proportion" },
              { "subtopic": "2.9 Graphs in practical situations", "search": "2.9 Graphs in practical situations" },
              { "subtopic": "2.10 Graphs of functions", "search": "2.10 Graphs of functions" },
              { "subtopic": "2.11 Sketching curves", "search": "2.11 Sketching curves" },
              { "subtopic": "2.12 Differentiation", "search": "2.12 Differentiation" },
              { "subtopic": "2.13 Functions", "search": "2.13 Functions" }
            ]
          },
          {
            "topic": "3 Coordinate geometry",
            "subtopics": [
              { "subtopic": "3.1 Coordinates", "search": "3.1 Coordinates" },
              { "subtopic": "3.2 Drawing linear graphs", "search": "3.2 Drawing linear graphs" },
              { "subtopic": "3.3 Gradient of linear graphs", "search": "3.3 Gradient of linear graphs" },
              { "subtopic": "3.4 Length and midpoint", "search": "3.4 Length and midpoint" },
              { "subtopic": "3.5 Equations of linear graphs", "search": "3.5 Equations of linear graphs" },
              { "subtopic": "3.6 Parallel lines", "search": "3.6 Parallel lines" },
              { "subtopic": "3.7 Perpendicular lines", "search": "3.7 Perpendicular lines" }
            ]
          },
          {
            "topic": "4 Geometry",
            "subtopics": [
              { "subtopic": "4.1 Geometrical terms", "search": "4.1 Geometrical terms" },
              { "subtopic": "4.2 Geometrical constructions", "search": "4.2 Geometrical constructions" },
              { "subtopic": "4.3 Scale drawings", "search": "4.3 Scale drawings" },
              { "subtopic": "4.4 Similarity", "search": "4.4 Similarity" },
              { "subtopic": "4.5 Symmetry", "search": "4.5 Symmetry" },
              { "subtopic": "4.6 Angles", "search": "4.6 Angles" },
              { "subtopic": "4.7 Circle theorems I", "search": "4.7 Circle theorems I" },
              { "subtopic": "4.8 Circle theorems II", "search": "4.8 Circle theorems II" }
            ]
          },
          {
            "topic": "5 Mensuration",
            "subtopics": [
              { "subtopic": "5.1 Units of measure", "search": "5.1 Units of measure" },
              { "subtopic": "5.2 Area and perimeter", "search": "5.2 Area and perimeter" },
              { "subtopic": "5.3 Circles, arcs and sectors", "search": "5.3 Circles, arcs and sectors" },
              { "subtopic": "5.4 Surface area and volume", "search": "5.4 Surface area and volume" },
              { "subtopic": "5.5 Compound shapes and parts of shapes", "search": "5.5 Compound shapes and parts of shapes" }
            ]
          },
          {
            "topic": "6 Trigonometry",
            "subtopics": [
              { "subtopic": "6.1 Pythagoras' theorem", "search": "6.1 Pythagoras' theorem" },
              { "subtopic": "6.2 Right-angled triangles", "search": "6.2 Right-angled triangles" },
              { "subtopic": "6.3 Exact trigonometric values", "search": "6.3 Exact trigonometric values" },
              { "subtopic": "6.4 Trigonometric functions", "search": "6.4 Trigonometric functions" },
              { "subtopic": "6.5 Non-right-angled triangles", "search": "6.5 Non-right-angled triangles" },
              { "subtopic": "6.6 Pythagoras' theorem and trigonometry in 3D", "search": "6.6 Pythagoras' theorem and trigonometry in 3D" }
            ]
          },
          {
            "topic": "7 Transformations and vectors",
            "subtopics": [
              { "subtopic": "7.1 Transformations", "search": "7.1 Transformations" },
              { "subtopic": "7.2 Vectors in two dimensions", "search": "7.2 Vectors in two dimensions" },
              { "subtopic": "7.3 Magnitude of a vector", "search": "7.3 Magnitude of a vector" },
              { "subtopic": "7.4 Vector geometry", "search": "7.4 Vector geometry" }
            ]
          },
          {
            "topic": "8 Probability",
            "subtopics": [
              { "subtopic": "8.1 Introduction to probability", "search": "8.1 Introduction to probability" },
              { "subtopic": "8.2 Relative and expected frequencies", "search": "8.2 Relative and expected frequencies" },
              { "subtopic": "8.3 Probability of combined events", "search": "8.3 Probability of combined events" },
              { "subtopic": "8.4 Conditional probability", "search": "8.4 Conditional probability" }
            ]
          },
          {
            "topic": "9 Statistics",
            "subtopics": [
              { "subtopic": "9.1 Classifying statistical data", "search": "9.1 Classifying statistical data" },
              { "subtopic": "9.2 Interpreting statistical data", "search": "9.2 Interpreting statistical data" },
              { "subtopic": "9.3 Averages and measures of spread", "search": "9.3 Averages and measures of spread" },
              { "subtopic": "9.4 Statistical charts and diagrams", "search": "9.4 Statistical charts and diagrams" },
              { "subtopic": "9.5 Scatter diagrams", "search": "9.5 Scatter diagrams" },
              { "subtopic": "9.6 Cumulative frequency diagrams", "search": "9.6 Cumulative frequency diagrams" },
              { "subtopic": "9.7 Histograms", "search": "9.7 Histograms" }
            ]
          }
        ]
      }
    ]
  },

  {
    "subject": "Additional Mathematics",
    "board": "cambridge",
    "level": "igcse",
    "units": [
      {
        "unit": "Additional Mathematics",
        "topics": [
          {
            "topic": "1 Functions",
            "subtopics": [
              { "subtopic": "1.1 Domain, Range & Function Notation", "search": "1.1 Domain, Range & Function Notation" },
              { "subtopic": "1.2 Composite Functions & Inverse Functions", "search": "1.2 Composite Functions & Inverse Functions" },
              { "subtopic": "1.3 Graphical Relationships (Reflection in y = x)", "search": "1.3 Graphical Relationships (Reflection in y = x)" }
            ]
          },
          {
            "topic": "2 Quadratic Functions",
            "subtopics": [
              { "subtopic": "2.1 Completing the Square, Max/Min & Graphs", "search": "2.1 Completing the Square, Max/Min & Graphs" },
              { "subtopic": "2.2 Discriminant & Line/Curve Intersections", "search": "2.2 Discriminant & Line/Curve Intersections" },
              { "subtopic": "2.3 Quadratic Equations & Inequalities", "search": "2.3 Quadratic Equations & Inequalities" }
            ]
          },
          {
            "topic": "3 Factors of Polynomials",
            "subtopics": [
              { "subtopic": "3.1 Factor & Remainder Theorems", "search": "3.1 Factor & Remainder Theorems" },
              { "subtopic": "3.2 Factorising Polynomials & Solving Cubic Equations", "search": "3.2 Factorising Polynomials & Solving Cubic Equations" }
            ]
          },
          {
            "topic": "4 Equations, Inequalities and Graphs",
            "subtopics": [
              { "subtopic": "4.1 Modulus Equations & Inequalities", "search": "4.1 Modulus Equations & Inequalities" },
              { "subtopic": "4.2 Substitution to Form Quadratics", "search": "4.2 Substitution to Form Quadratics" },
              { "subtopic": "4.3 Cubic Graphs & Cubic Inequalities", "search": "4.3 Cubic Graphs & Cubic Inequalities" }
            ]
          },
          {
            "topic": "5 Simultaneous Equations",
            "subtopics": [
              { "subtopic": "5.1 Solving Linear & Non-Linear Simultaneous Equations", "search": "5.1 Solving Linear & Non-Linear Simultaneous Equations" }
            ]
          },
          {
            "topic": "6 Logarithmic and Exponential Functions",
            "subtopics": [
              { "subtopic": "6.1 Exponential & Logarithmic Graphs & Properties", "search": "6.1 Exponential & Logarithmic Graphs & Properties" },
              { "subtopic": "6.2 Laws of Logarithms & Change of Base", "search": "6.2 Laws of Logarithms & Change of Base" },
              { "subtopic": "6.3 Solving Exponential Equations (aˣ = b)", "search": "6.3 Solving Exponential Equations (aˣ = b)" }
            ]
          },
          {
            "topic": "7 Straight-Line Graphs",
            "subtopics": [
              { "subtopic": "7.1 Equations, Parallel/Perpendicular Lines & Perpendicular Bisectors", "search": "7.1 Equations, Parallel/Perpendicular Lines & Perpendicular Bisectors" },
              { "subtopic": "7.2 Transforming Non-Linear Forms to Linear Graphs", "search": "7.2 Transforming Non-Linear Forms to Linear Graphs" }
            ]
          },
          {
            "topic": "8 Coordinate Geometry of the Circle",
            "subtopics": [
              { "subtopic": "8.1 Circle Equations & Line Intersections", "search": "8.1 Circle Equations & Line Intersections" },
              { "subtopic": "8.2 Tangents, Chords & Circle Intersections", "search": "8.2 Tangents, Chords & Circle Intersections" }
            ]
          },
          {
            "topic": "9 Circular Measure",
            "subtopics": [
              { "subtopic": "9.1 Radians, Arc Length & Sector Area", "search": "9.1 Radians, Arc Length & Sector Area" }
            ]
          },
          {
            "topic": "10 Trigonometry",
            "subtopics": [
              { "subtopic": "10.1 Trigonometric Functions, Periodicity & Graphs", "search": "10.1 Trigonometric Functions, Periodicity & Graphs" },
              { "subtopic": "10.2 Trigonometric Identities & Proofs", "search": "10.2 Trigonometric Identities & Proofs" },
              { "subtopic": "10.3 Solving Trigonometric Equations", "search": "10.3 Solving Trigonometric Equations" }
            ]
          },
          {
            "topic": "11 Permutations and Combinations",
            "subtopics": [
              { "subtopic": "11.1 Permutations & Factorial Notation", "search": "11.1 Permutations & Factorial Notation" },
              { "subtopic": "11.2 Combinations", "search": "11.2 Combinations" },
              { "subtopic": "11.3 Applied Selection & Arrangement Problems", "search": "11.3 Applied Selection & Arrangement Problems" }
            ]
          },
          {
            "topic": "12 Series",
            "subtopics": [
              { "subtopic": "12.1 Binomial Theorem & General Term", "search": "12.1 Binomial Theorem & General Term" },
              { "subtopic": "12.2 Arithmetic Progressions", "search": "12.2 Arithmetic Progressions" },
              { "subtopic": "12.3 Geometric Progressions & Sum to Infinity", "search": "12.3 Geometric Progressions & Sum to Infinity" }
            ]
          },
          {
            "topic": "13 Vectors in Two Dimensions",
            "subtopics": [
              { "subtopic": "13.1 Vector Operations, Position & Unit Vectors", "search": "13.1 Vector Operations, Position & Unit Vectors" },
              { "subtopic": "13.2 Vector Geometry & Relative Velocity", "search": "13.2 Vector Geometry & Relative Velocity" }
            ]
          },
          {
            "topic": "14 Calculus",
            "subtopics": [
              { "subtopic": "14.1 Differentiation Techniques (Chain, Product & Quotient Rules)", "search": "14.1 Differentiation Techniques (Chain, Product & Quotient Rules)" },
              { "subtopic": "14.2 Applications of Differentiation (Tangents, Max/Min & Connected Rates)", "search": "14.2 Applications of Differentiation (Tangents, Max/Min & Connected Rates)" },
              { "subtopic": "14.3 Integration & Area Under/Between Curves", "search": "14.3 Integration & Area Under/Between Curves" },
              { "subtopic": "14.4 Kinematics (Motion Functions & Motion Graphs)", "search": "14.4 Kinematics (Motion Functions & Motion Graphs)" }
            ]
          }
        ]
      }
    ]
  },
  {
    "subject": "Mathematics",
    "board": "cambridge",
    "level": "a-level",
    "units": [
      {
        "unit": "Pure 1",
        "topics": [
          {
            "topic": "1 Quadratics",
            "subtopics": [
              {
                "subtopic": "1.1 Completing the square and using discriminant",
                "search": "1.1 Completing the square and using discriminant"
              },
              {
                "subtopic": "1.2 Solving quadratic equations and inequalities",
                "search": "1.2 Solving quadratic equations and inequalities"
              },
              {
                "subtopic": "1.3 Simultaneous equations (one linear, one quadratic)",
                "search": "1.3 Simultaneous equations (one linear, one quadratic)"
              }
            ]
          },
          {
            "topic": "2 Functions",
            "subtopics": [
              {
                "subtopic": "2.1 Domain, range, and composite functions",
                "search": "2.1 Domain, range, and composite functions"
              },
              {
                "subtopic": "2.2 Inverse functions (one-one functions and graphs)",
                "search": "2.2 Inverse functions (one-one functions and graphs)"
              },
              {
                "subtopic": "2.3 Transformations of graphs (f(x)+a, f(x+a), af(x), f(ax))",
                "search": "2.3 Transformations of graphs (f(x)+a, f(x+a), af(x), f(ax))"
              }
            ]
          },
          {
            "topic": "3 Coordinate Geometry",
            "subtopics": [
              {
                "subtopic": "3.1 Equation of a straight line (all forms)",
                "search": "3.1 Equation of a straight line (all forms)"
              },
              {
                "subtopic": "3.2 Circle equations (centre-radius and expanded form)",
                "search": "3.2 Circle equations (centre-radius and expanded form)"
              },
              {
                "subtopic": "3.3 Intersection problems (lines and circles)",
                "search": "3.3 Intersection problems (lines and circles)"
              }
            ]
          },
          {
            "topic": "4 Circular Measure",
            "subtopics": [
              {
                "subtopic": "4.1 Radian measure and conversions",
                "search": "4.1 Radian measure and conversions"
              },
              {
                "subtopic": "4.2 Arc length and sector area formulae",
                "search": "4.2 Arc length and sector area formulae"
              }
            ]
          },
          {
            "topic": "5 Trigonometry",
            "subtopics": [
              {
                "subtopic": "5.1 Graphs of sine, cosine, and tangent",
                "search": "5.1 Graphs of sine, cosine, and tangent"
              },
              {
                "subtopic": "5.2 Exact values and inverse trigonometric notation",
                "search": "5.2 Exact values and inverse trigonometric notation"
              },
              {
                "subtopic": "5.3 Trigonometric identities and solving equations",
                "search": "5.3 Trigonometric identities and solving equations"
              }
            ]
          },
          {
            "topic": "6 Series",
            "subtopics": [
              {
                "subtopic": "6.1 Binomial expansion (a + b)ⁿ",
                "search": "6.1 Binomial expansion (a + b)ⁿ"
              },
              {
                "subtopic": "6.2 Arithmetic progressions (nᵗʰ term, sum)",
                "search": "6.2 Arithmetic progressions (nᵗʰ term, sum)"
              },
              {
                "subtopic": "6.3 Geometric progressions (nᵗʰ term, sum, sum to infinity)",
                "search": "6.3 Geometric progressions (nᵗʰ term, sum, sum to infinity)"
              }
            ]
          },
          {
            "topic": "7 Differentiation",
            "subtopics": [
              {
                "subtopic": "7.1 Differentiation of xⁿ and chain rule",
                "search": "7.1 Differentiation of xⁿ and chain rule"
              },
              {
                "subtopic": "7.2 Tangents, normals, and rates of change",
                "search": "7.2 Tangents, normals, and rates of change"
              },
              {
                "subtopic": "7.3 Stationary points (max/min)",
                "search": "7.3 Stationary points (max/min)"
              }
            ]
          },
          {
            "topic": "8 Integration",
            "subtopics": [
              {
                "subtopic": "8.1 Reverse differentiation and constant of integration",
                "search": "8.1 Reverse differentiation and constant of integration"
              },
              {
                "subtopic": "8.2 Definite integrals and area between curves",
                "search": "8.2 Definite integrals and area between curves"
              },
              {
                "subtopic": "8.3 Volumes of revolution",
                "search": "8.3 Volumes of revolution"
              }
            ]
          }
        ]
      },
      {
        "unit": "Pure 3",
        "topics": [
          {
            "topic": "1 Algebra",
            "subtopics": [
              {
                "subtopic": "1.1 Modulus equations and inequalities",
                "search": "1.1 Modulus equations and inequalities"
              },
              {
                "subtopic": "1.2 Polynomial division and Factor/Remainder Theorem",
                "search": "1.2 Polynomial division and Factor/Remainder Theorem"
              },
              {
                "subtopic": "1.3 Partial fractions (linear, repeated, quadratic factors)",
                "search": "1.3 Partial fractions (linear, repeated, quadratic factors)"
              },
              {
                "subtopic": "1.4 Binomial expansion (rational n)",
                "search": "1.4 Binomial expansion (rational n)"
              }
            ]
          },
          {
            "topic": "2 Logarithmic and Exponential Functions",
            "subtopics": [
              {
                "subtopic": "2.1 Laws of logarithms and solving equations",
                "search": "2.1 Laws of logarithms and solving equations"
              },
              {
                "subtopic": "2.2 Graphs and transforming to linear form",
                "search": "2.2 Graphs and transforming to linear form"
              }
            ]
          },
          {
            "topic": "3 Trigonometry",
            "subtopics": [
              {
                "subtopic": "3.1 Secant, cosecant, cotangent identities",
                "search": "3.1 Secant, cosecant, cotangent identities"
              },
              {
                "subtopic": "3.2 Compound angle formulae and double angles",
                "search": "3.2 Compound angle formulae and double angles"
              },
              {
                "subtopic": "3.3 Harmonic Form (a cos θ + b sin θ)",
                "search": "3.3 Harmonic Form (a cos θ + b sin θ)"
              }
            ]
          },
          {
            "topic": "4 Differentiation",
            "subtopics": [
              {
                "subtopic": "4.1 Differentiating standard functions (including tan⁻¹)",
                "search": "4.1 Differentiating standard functions (including tan⁻¹)"
              },
              {
                "subtopic": "4.2 Product and quotient rule",
                "search": "4.2 Product and quotient rule"
              },
              {
                "subtopic": "4.3 Parametric and implicit differentiation",
                "search": "4.3 Parametric and implicit differentiation"
              }
            ]
          },
          {
            "topic": "5 Integration",
            "subtopics": [
              {
                "subtopic": "5.1 Reverse differentiation (1/(x²+a²))",
                "search": "5.1 Reverse differentiation (1/(x²+a²))"
              },
              {
                "subtopic": "5.2 Partial fractions and f'(x)/f(x) forms",
                "search": "5.2 Partial fractions and f'(x)/f(x) forms"
              },
              {
                "subtopic": "5.3 Integration by parts and substitution",
                "search": "5.3 Integration by parts and substitution"
              }
            ]
          },
          {
            "topic": "6 Numerical Solution of Equations",
            "subtopics": [
              {
                "subtopic": "6.1 Locating roots (sign change/graphical)",
                "search": "6.1 Locating roots (sign change/graphical)"
              },
              {
                "subtopic": "6.2 Iterative Methods (recurrence relations xₙ₊₁ = f(xₙ))",
                "search": "6.2 Iterative Methods (recurrence relations xₙ₊₁ = f(xₙ))"
              }
            ]
          },
          {
            "topic": "7 Vectors",
            "subtopics": [
              {
                "subtopic": "7.1 Vector operations (addition, scalar, magnitude)",
                "search": "7.1 Vector operations (addition, scalar, magnitude)"
              },
              {
                "subtopic": "7.2 Equation of a line (r = a + tb)",
                "search": "7.2 Equation of a line (r = a + tb)"
              },
              {
                "subtopic": "7.3 Scalar product and problems (angles, intersection, perpendicular)",
                "search": "7.3 Scalar product and problems (angles, intersection, perpendicular)"
              }
            ]
          },
          {
            "topic": "8 Differential Equations",
            "subtopics": [
              {
                "subtopic": "8.1 Formulating differential equations from rates of change",
                "search": "8.1 Formulating differential equations from rates of change"
              },
              {
                "subtopic": "8.2 Separable variables (general and particular solutions)",
                "search": "8.2 Separable variables (general and particular solutions)"
              }
            ]
          },
          {
            "topic": "9 Complex Numbers",
            "subtopics": [
              {
                "subtopic": "9.1 Cartesian form (operations, equality, conjugate pairs)",
                "search": "9.1 Cartesian form (operations, equality, conjugate pairs)"
              },
              {
                "subtopic": "9.2 Polar form and Argand diagrams",
                "search": "9.2 Polar form and Argand diagrams"
              },
              {
                "subtopic": "9.3 Loci in Argand diagrams",
                "search": "9.3 Loci in Argand diagrams"
              }
            ]
          }
        ]
      },
      {
        "unit": "Mechanics",
        "topics": [
          {
            "topic": "1 Forces",
            "subtopics": [
              {
                "subtopic": "1.1 Force diagrams and resolving",
                "search": "1.1 Force diagrams and resolving"
              },
              {
                "subtopic": "1.2 Equilibrium",
                "search": "1.2 Equilibrium"
              },
              {
                "subtopic": "1.3 Friction",
                "search": "1.3 Friction"
              }
            ]
          },
          {
            "topic": "2 Kinematics",
            "subtopics": [
              {
                "subtopic": "2.1 Motion graphs",
                "search": "2.1 Motion graphs"
              },
              {
                "subtopic": "2.2 Constant acceleration formulae",
                "search": "2.2 Constant acceleration formulae"
              },
              {
                "subtopic": "2.3 Calculus in kinematics",
                "search": "2.3 Calculus in kinematics"
              }
            ]
          },
          {
            "topic": "3 Momentum",
            "subtopics": [
              {
                "subtopic": "3.1 Conservation of momentum",
                "search": "3.1 Conservation of momentum"
              },
              {
                "subtopic": "3.2 Direct impact",
                "search": "3.2 Direct impact"
              }
            ]
          },
          {
            "topic": "4 Newton's Laws",
            "subtopics": [
              {
                "subtopic": "4.1 F = ma and weight",
                "search": "4.1 F = ma and weight"
              },
              {
                "subtopic": "4.2 Inclined planes",
                "search": "4.2 Inclined planes"
              },
              {
                "subtopic": "4.3 Connected particles",
                "search": "4.3 Connected particles"
              }
            ]
          },
          {
            "topic": "5 Energy and Power",
            "subtopics": [
              {
                "subtopic": "5.1 Work done",
                "search": "5.1 Work done"
              },
              {
                "subtopic": "5.2 Kinetic and potential energy",
                "search": "5.2 Kinetic and potential energy"
              },
              {
                "subtopic": "5.3 Conservation of energy and power",
                "search": "5.3 Conservation of energy and power"
              }
            ]
          }
        ]
      },
      {
        "unit": "Probability & Statistics 1",
        "topics": [
          {
            "topic": "1 Data Representation",
            "subtopics": [
              {
                "subtopic": "1.1 Graphs and diagrams (stem-and-leaf, box, histogram)",
                "search": "1.1 Graphs and diagrams (stem-and-leaf, box, histogram)"
              },
              {
                "subtopic": "1.2 Cumulative frequency",
                "search": "1.2 Cumulative frequency"
              },
              {
                "subtopic": "1.3 Mean and standard deviation",
                "search": "1.3 Mean and standard deviation"
              }
            ]
          },
          {
            "topic": "2 Permutations and Combinations",
            "subtopics": [
              {
                "subtopic": "2.1 Selections (combinations)",
                "search": "2.1 Selections (combinations)"
              },
              {
                "subtopic": "2.2 Arrangements (permutations)",
                "search": "2.2 Arrangements (permutations)"
              }
            ]
          },
          {
            "topic": "3 Probability",
            "subtopics": [
              {
                "subtopic": "3.1 Addition and multiplication rules",
                "search": "3.1 Addition and multiplication rules"
              },
              {
                "subtopic": "3.2 Independent and mutually exclusive events",
                "search": "3.2 Independent and mutually exclusive events"
              },
              {
                "subtopic": "3.3 Conditional probability",
                "search": "3.3 Conditional probability"
              }
            ]
          },
          {
            "topic": "4 Discrete Random Variables",
            "subtopics": [
              {
                "subtopic": "4.1 Probability distributions (E(X), Var(X))",
                "search": "4.1 Probability distributions (E(X), Var(X))"
              },
              {
                "subtopic": "4.2 Binomial distribution",
                "search": "4.2 Binomial distribution"
              },
              {
                "subtopic": "4.3 Geometric distribution",
                "search": "4.3 Geometric distribution"
              }
            ]
          },
          {
            "topic": "5 Normal Distribution",
            "subtopics": [
              {
                "subtopic": "5.1 Problems with N(μ, σ²)",
                "search": "5.1 Problems with N(μ, σ²)"
              },
              {
                "subtopic": "5.2 Normal approximation to binomial",
                "search": "5.2 Normal approximation to binomial"
              }
            ]
          }
        ]
      }
    ]
  },

  {
    "subject": "Further Mathematics",
    "board": "cambridge",
    "level": "a-level",
    "units": [
      {
        "unit": "Further Pure Mathematics 1",
        "topics": [
          {
            "topic": "1 Polynomial Roots",
            "subtopics": [
              { "subtopic": "1.1 Root-Coefficient Relations", "search": "1.1 Root-Coefficient Relations" },
              { "subtopic": "1.2 Substitution for Related Roots", "search": "1.2 Substitution for Related Roots" }
            ]
          },
          {
            "topic": "2 Rational Functions and Graphs",
            "subtopics": [
              { "subtopic": "2.1 Sketching Curves and Asymptotes", "search": "2.1 Sketching Curves and Asymptotes" },
              { "subtopic": "2.2 Related Graph Transformations", "search": "2.2 Related Graph Transformations" }
            ]
          },
          {
            "topic": "3 Summation of Series",
            "subtopics": [
              { "subtopic": "3.1 Standard Summation Results", "search": "3.1 Standard Summation Results" },
              { "subtopic": "3.2 Method of Differences", "search": "3.2 Method of Differences" },
              { "subtopic": "3.3 Convergence and Sum to Infinity", "search": "3.3 Convergence and Sum to Infinity" }
            ]
          },
          {
            "topic": "4 Matrices",
            "subtopics": [
              { "subtopic": "4.1 Operations, Determinants, and Inverses", "search": "4.1 Operations, Determinants, and Inverses" },
              { "subtopic": "4.2 Geometric Transformations", "search": "4.2 Geometric Transformations" },
              { "subtopic": "4.3 Invariant Points and Lines", "search": "4.3 Invariant Points and Lines" }
            ]
          },
          {
            "topic": "5 Polar Coordinates",
            "subtopics": [
              { "subtopic": "5.1 Converting Cartesian and Polar Forms", "search": "5.1 Converting Cartesian and Polar Forms" },
              { "subtopic": "5.2 Sketching Polar Curves", "search": "5.2 Sketching Polar Curves" },
              { "subtopic": "5.3 Area of a Sector", "search": "5.3 Area of a Sector" }
            ]
          },
          {
            "topic": "6 Vectors",
            "subtopics": [
              { "subtopic": "6.1 Equations of Lines and Planes", "search": "6.1 Equations of Lines and Planes" },
              { "subtopic": "6.2 Vector Product Applications", "search": "6.2 Vector Product Applications" },
              { "subtopic": "6.3 Distances, Angles, and Intersections", "search": "6.3 Distances, Angles, and Intersections" }
            ]
          },
          {
            "topic": "7 Proof by Induction",
            "subtopics": [
              { "subtopic": "7.1 Proving Given Results", "search": "7.1 Proving Given Results" },
              { "subtopic": "7.2 Conjecture then Prove", "search": "7.2 Conjecture then Prove" }
            ]
          }
        ]
      },
      {
        "unit": "Further Pure Mathematics 2",
        "topics": [
          {
            "topic": "1 Hyperbolic Functions",
            "subtopics": [
              { "subtopic": "1.1 Definitions, Graphs, and Identities", "search": "1.1 Definitions, Graphs, and Identities" },
              { "subtopic": "1.2 Inverse Hyperbolic Functions", "search": "1.2 Inverse Hyperbolic Functions" }
            ]
          },
          {
            "topic": "2 Matrices",
            "subtopics": [
              { "subtopic": "2.1 Solving Linear Systems", "search": "2.1 Solving Linear Systems" },
              { "subtopic": "2.2 Eigenvalues and Eigenvectors", "search": "2.2 Eigenvalues and Eigenvectors" },
              { "subtopic": "2.3 Diagonalisation and Powers of Matrices", "search": "2.3 Diagonalisation and Powers of Matrices" }
            ]
          },
          {
            "topic": "3 Differentiation",
            "subtopics": [
              { "subtopic": "3.1 Derivatives of Hyperbolic and Inverse Functions", "search": "3.1 Derivatives of Hyperbolic and Inverse Functions" },
              { "subtopic": "3.2 Implicit and Parametric Second Derivatives", "search": "3.2 Implicit and Parametric Second Derivatives" },
              { "subtopic": "3.3 Maclaurin Series", "search": "3.3 Maclaurin Series" }
            ]
          },
          {
            "topic": "4 Integration",
            "subtopics": [
              { "subtopic": "4.1 Standard Forms and Substitutions", "search": "4.1 Standard Forms and Substitutions" },
              { "subtopic": "4.2 Reduction Formulae", "search": "4.2 Reduction Formulae" },
              { "subtopic": "4.3 Approximating Areas with Rectangles", "search": "4.3 Approximating Areas with Rectangles" },
              { "subtopic": "4.4 Arc Length and Surface Area", "search": "4.4 Arc Length and Surface Area" }
            ]
          },
          {
            "topic": "5 Complex Numbers",
            "subtopics": [
              { "subtopic": "5.1 De Moivre's Theorem and Multiple Angles", "search": "5.1 De Moivre's Theorem and Multiple Angles" },
              { "subtopic": "5.2 Powers of Sine and Cosine", "search": "5.2 Powers of Sine and Cosine" },
              { "subtopic": "5.3 Series Summation and Roots of Unity", "search": "5.3 Series Summation and Roots of Unity" }
            ]
          },
          {
            "topic": "6 Differential Equations",
            "subtopics": [
              { "subtopic": "6.1 First Order Linear Equations", "search": "6.1 First Order Linear Equations" },
              { "subtopic": "6.2 Second Order Equations with Constant Coefficients", "search": "6.2 Second Order Equations with Constant Coefficients" },
              { "subtopic": "6.3 Reduction by Substitution", "search": "6.3 Reduction by Substitution" }
            ]
          }
        ]
      },
      {
        "unit": "Further Mechanics",
        "topics": [
          {
            "topic": "1 Motion of a Projectile",
            "subtopics": [
              { "subtopic": "1.1 Horizontal and Vertical Equations", "search": "1.1 Horizontal and Vertical Equations" },
              { "subtopic": "1.2 Trajectory Equation Problems", "search": "1.2 Trajectory Equation Problems" }
            ]
          },
          {
            "topic": "2 Equilibrium of a Rigid Body",
            "subtopics": [
              { "subtopic": "2.1 Moments and Centre of Mass", "search": "2.1 Moments and Centre of Mass" },
              { "subtopic": "2.2 Composite Body Centre of Mass", "search": "2.2 Composite Body Centre of Mass" },
              { "subtopic": "2.3 Toppling and Sliding Problems", "search": "2.3 Toppling and Sliding Problems" }
            ]
          },
          {
            "topic": "3 Circular Motion",
            "subtopics": [
              { "subtopic": "3.1 Angular Speed and Acceleration", "search": "3.1 Angular Speed and Acceleration" },
              { "subtopic": "3.2 Horizontal Circular Motion", "search": "3.2 Horizontal Circular Motion" },
              { "subtopic": "3.3 Vertical Circular Motion", "search": "3.3 Vertical Circular Motion" }
            ]
          },
          {
            "topic": "4 Hooke's Law",
            "subtopics": [
              { "subtopic": "4.1 Force, Extension, and Elastic Potential Energy", "search": "4.1 Force, Extension, and Elastic Potential Energy" },
              { "subtopic": "4.2 Work-Energy Problems with Strings and Springs", "search": "4.2 Work-Energy Problems with Strings and Springs" }
            ]
          },
          {
            "topic": "5 Linear Motion Under a Variable Force",
            "subtopics": [
              { "subtopic": "5.1 Setting Up and Solving Differential Equations", "search": "5.1 Setting Up and Solving Differential Equations" }
            ]
          },
          {
            "topic": "6 Momentum",
            "subtopics": [
              { "subtopic": "6.1 Direct Impact and Restitution", "search": "6.1 Direct Impact and Restitution" },
              { "subtopic": "6.2 Oblique Impact Problems", "search": "6.2 Oblique Impact Problems" }
            ]
          }
        ]
      },
      {
        "unit": "Further Probability & Statistics",
        "topics": [
          {
            "topic": "1 Continuous Random Variables",
            "subtopics": [
              { "subtopic": "1.1 Probability Density Functions and Expectation", "search": "1.1 Probability Density Functions and Expectation" },
              { "subtopic": "1.2 Cumulative Distribution Functions", "search": "1.2 Cumulative Distribution Functions" },
              { "subtopic": "1.3 Distributions of Related Variables", "search": "1.3 Distributions of Related Variables" }
            ]
          },
          {
            "topic": "2 Inference Using Normal and T Distributions",
            "subtopics": [
              { "subtopic": "2.1 Single Sample T Tests", "search": "2.1 Single Sample T Tests" },
              { "subtopic": "2.2 Two Sample and Paired T Tests", "search": "2.2 Two Sample and Paired T Tests" },
              { "subtopic": "2.3 Confidence Intervals for Means", "search": "2.3 Confidence Intervals for Means" }
            ]
          },
          {
            "topic": "3 Chi-Squared Tests",
            "subtopics": [
              { "subtopic": "3.1 Goodness of Fit Tests", "search": "3.1 Goodness of Fit Tests" },
              { "subtopic": "3.2 Contingency Table Tests", "search": "3.2 Contingency Table Tests" }
            ]
          },
          {
            "topic": "4 Non-Parametric Tests",
            "subtopics": [
              { "subtopic": "4.1 Single Sample Sign and Signed-Rank Tests", "search": "4.1 Single Sample Sign and Signed-Rank Tests" },
              { "subtopic": "4.2 Paired Sample Tests for Identity of Populations", "search": "4.2 Paired Sample Tests for Identity of Populations" }
            ]
          },
          {
            "topic": "5 Probability Generating Functions",
            "subtopics": [
              { "subtopic": "5.1 Constructing Generating Functions", "search": "5.1 Constructing Generating Functions" },
              { "subtopic": "5.2 Mean and Variance from Generating Functions", "search": "5.2 Mean and Variance from Generating Functions" },
              { "subtopic": "5.3 Sums of Independent Random Variables", "search": "5.3 Sums of Independent Random Variables" }
            ]
          }
        ]
      }
    ]
  },
  {
    "subject": "Mechanics",
    "board": "edexcel",
    "level": "a-level",
    "units": [
      {
        "unit": "Mechanics 1",
        "topics": [
          {
            "topic": "1 Mathematical models in mechanics",
            "subtopics": [
              { "subtopic": "1.1 Modelling assumptions", "search": "1.1 Modelling assumptions" }
            ]
          },
          {
            "topic": "2 Vectors in mechanics",
            "subtopics": [
              { "subtopic": "2.1 Magnitude and direction", "search": "2.1 Magnitude and direction" },
              { "subtopic": "2.2 Vectors for displacement, velocity, acceleration, force", "search": "2.2 Vectors for displacement, velocity, acceleration, force" }
            ]
          },
          {
            "topic": "3 Kinematics of a particle moving in a straight line",
            "subtopics": [
              { "subtopic": "3.1 Constant acceleration (suvat)", "search": "3.1 Constant acceleration (suvat)" }
            ]
          },
          {
            "topic": "4 Dynamics of a particle moving in a straight line or plane",
            "subtopics": [
              { "subtopic": "4.1 Newton's laws of motion", "search": "4.1 Newton's laws of motion" },
              { "subtopic": "4.2 Connected particles and pulleys", "search": "4.2 Connected particles and pulleys" },
              { "subtopic": "4.3 Momentum and impulse", "search": "4.3 Momentum and impulse" },
              { "subtopic": "4.4 Friction", "search": "4.4 Friction" }
            ]
          },
          {
            "topic": "5 Statics of a particle",
            "subtopics": [
              { "subtopic": "5.1 Resolving forces", "search": "5.1 Resolving forces" },
              { "subtopic": "5.2 Equilibrium of coplanar forces", "search": "5.2 Equilibrium of coplanar forces" },
              { "subtopic": "5.3 Friction", "search": "5.3 Friction" }
            ]
          },
          {
            "topic": "6 Moments",
            "subtopics": [
              { "subtopic": "6.1 Moment of a force", "search": "6.1 Moment of a force" }
            ]
          }
        ]
      },
      {
        "unit": "Mechanics 2",
        "topics": [
          {
            "topic": "1 Kinematics of a particle moving in a straight line or plane",
            "subtopics": [
              { "subtopic": "1.1 Motion under gravity and projectiles", "search": "1.1 Motion under gravity and projectiles" },
              { "subtopic": "1.2 Variable acceleration using calculus", "search": "1.2 Variable acceleration using calculus" },
              { "subtopic": "1.3 Vector differentiation and integration", "search": "1.3 Vector differentiation and integration" }
            ]
          },
          {
            "topic": "2 Centres of mass",
            "subtopics": [
              { "subtopic": "2.1 Discrete mass systems", "search": "2.1 Discrete mass systems" },
              { "subtopic": "2.2 Uniform and composite laminas", "search": "2.2 Uniform and composite laminas" },
              { "subtopic": "2.3 Equilibrium of a lamina", "search": "2.3 Equilibrium of a lamina" }
            ]
          },
          {
            "topic": "3 Work and energy",
            "subtopics": [
              { "subtopic": "3.1 Kinetic and potential energy", "search": "3.1 Kinetic and potential energy" },
              { "subtopic": "3.2 Work and power", "search": "3.2 Work and power" },
              { "subtopic": "3.3 Conservation of mechanical energy", "search": "3.3 Conservation of mechanical energy" }
            ]
          },
          {
            "topic": "4 Collisions",
            "subtopics": [
              { "subtopic": "4.1 Momentum and impulse in vector form", "search": "4.1 Momentum and impulse in vector form" },
              { "subtopic": "4.2 Newton's law of restitution", "search": "4.2 Newton's law of restitution" },
              { "subtopic": "4.3 Successive impacts", "search": "4.3 Successive impacts" }
            ]
          },
          {
            "topic": "5 Statics of rigid bodies",
            "subtopics": [
              { "subtopic": "5.1 Moments", "search": "5.1 Moments" },
              { "subtopic": "5.2 Equilibrium of rigid bodies", "search": "5.2 Equilibrium of rigid bodies" }
            ]
          }
        ]
      }
    ]
  }

  // additional config objects can be added here
];




