import slugify from './slugify.ts';

// Shared curriculum data structure
export type BoardKey = 'cambridge' | 'edexcel';

export type Tag = {
  name: string;
  color: string; // e.g., "bg-orange-600", "bg-blue-400", "bg-green-600", etc.
};

export type Topic = {
  id: string;
  title: string;
  description: string;
  subject: string;
  color?: string;
  group?: string;
  tags?: Tag[];
};

export type Curriculum = {
  title: string;
  fullName: string;
  description: string;
  boards: Record<BoardKey, { topics: Topic[] }>;
};

export const curriculumData: Record<string, Curriculum> = {
  'igcse': {
    title: 'IGCSE',
    fullName: 'International General Certificate of Secondary Education',
    description: 'Master your IGCSE subjects with our comprehensive collection of video lessons, resources, and interactive quizzes.',
    boards: {
      cambridge: {
        topics: [
          { id: 'chemistry-1', title: 'States of matter', description: 'Explore the fundamental concepts of states of matter, including solid, liquid, and gas phases.', subject: 'Chemistry', tags: [{ name: 'Topic 1', color: 'bg-orange-600' }] },
          { id: 'chemistry-2', title: 'Atoms, elements and compounds', description: 'Explore the fundamental concepts of atoms, elements, and compounds, including atomic structure and chemical bonding.', subject: 'Chemistry', tags: [{ name: 'Topic 2', color: 'bg-orange-600' }] },
          { id: 'chemistry-3', title: 'Stoichiometry', description: 'Learn about stoichiometry, including mole calculations, empirical and molecular formulas, and balancing chemical equations.', subject: 'Chemistry', tags: [{ name: 'Topic 3', color: 'bg-orange-600' }] },
          { id: 'chemistry-4', title: 'Electrochemistry', description: 'Explore the principles of electrochemistry, including redox reactions and Hydrogen fuel cells.', subject: 'Chemistry', tags: [{ name: 'Topic 4', color: 'bg-orange-600' }] },
          { id: 'chemistry-5', title: 'Chemical energetics', description: 'Explore the principles of chemical energetics, including enthalpy changes and reaction spontaneity.', subject: 'Chemistry', tags: [{ name: 'Topic 5', color: 'bg-orange-600' }] },
          { id: 'chemistry-6', title: 'Chemical reactions', description: 'Explore the principles of chemical reactions, including redox reactions and Hydrogen fuel cells.', subject: 'Chemistry', tags: [{ name: 'Topic 6', color: 'bg-orange-600' }] },
          { id: 'chemistry-7', title: 'Acids, bases and salts', description: 'Explore the principles of acids, bases and salts, including pH, neutralization and titration.', subject: 'Chemistry', tags: [{ name: 'Topic 7', color: 'bg-orange-600' }] },
          { id: 'chemistry-8', title: 'The periodic table', description: 'Explore the principles of the periodic table, including group properties and periodic trends.', subject: 'Chemistry', tags: [{ name: 'Topic 8', color: 'bg-orange-600' }] },
          { id: 'chemistry-9', title: 'Metals', description: 'Explore the principles of metals and their extraction, including reactivity series and extraction methods.', subject: 'Chemistry', tags: [{ name: 'Topic 9', color: 'bg-orange-600' }] },
          { id: 'chemistry-10', title: 'Chemistry of the environment', description: 'Explore the principles of air and water, including composition, pollution and treatment methods.', subject: 'Chemistry', tags: [{ name: 'Topic 10', color: 'bg-orange-600' }] },
          { id: 'chemistry-11', title: 'Organic chemistry', description: 'Explore the principles of organic chemistry, including hydrocarbons, functional groups and polymers.', subject: 'Chemistry', tags: [{ name: 'Topic 11', color: 'bg-orange-600' }] },
          { id: 'chemistry-12', title: 'Experimental techniques and chemical analysis', description: 'Learn about experimental techniques, safety procedures, and methods for chemical analysis and testing.', subject: 'Chemistry', tags: [{ name: 'Topic 12', color: 'bg-orange-600' }] },
          { id: 'chemistry-paper-6', title: 'Paper 6 (Alternative to Practical)', description: 'Learn about experimental techniques, safety procedures, and methods for chemical analysis and testing.', subject: 'Chemistry', color: 'from-orange-600 to-orange-500 dark:from-orange-700 dark:to-orange-800' },
          { id: 'chemistry-full-revision', title: 'Full Chemistry Revision', description: 'Comprehensive revision of all IGCSE Chemistry topics to prepare for exams.', subject: 'Chemistry', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', tags: [{ name: 'Revision', color: 'bg-purple-600' }] },

          { id: 'physics-1', title: 'Motion, forces and energy', description: 'Explore the fundamental principles of physics, including motion, forces, energy, and waves.', subject: 'Physics', tags: [{ name: 'Topic 1', color: 'bg-orange-600' }] },
          { id: 'physics-2', title: 'Thermal physics', description: 'Explore the concepts of heat, temperature, and the behavior of gases.', subject: 'Physics', tags: [{ name: 'Topic 2', color: 'bg-orange-600' }] },
          { id: 'physics-3', title: 'Waves', description: 'Study the properties and behavior of waves, including reflection, refraction, and diffraction.', subject: 'Physics', tags: [{ name: 'Topic 3', color: 'bg-orange-600' }] },
          { id: 'physics-4', title: 'Electricity and magnetism', description: 'Explore electric circuits, electric fields, magnetic fields, and electromagnetic induction.', subject: 'Physics', tags: [{ name: 'Topic 4', color: 'bg-orange-600' }] },
          { id: 'physics-5', title: 'Nuclear physics', description: 'Learn about the structure of atoms, radioactivity, and nuclear reactions.', subject: 'Physics', tags: [{ name: 'Topic 5', color: 'bg-orange-600' }] },
          { id: 'physics-6', title: 'Space physics', description: 'Understand astrophysical phenomena and the structure of the universe.', subject: 'Physics', tags: [{ name: 'Topic 6', color: 'bg-orange-600' }] },
          { id: 'physics-paper-6', title: 'Paper 6 (Alternative to Practical)', description: 'Explore experimental skills and techniques in physics.', subject: 'Physics', color: 'from-orange-600 to-orange-500 dark:from-orange-700 dark:to-orange-800' },
          { id: 'physics-full-revision', title: 'Full Physics Revision', description: 'Comprehensive revision of all IGCSE Physics topics to prepare for exams.', subject: 'Physics', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', tags: [{ name: 'Revision', color: 'bg-purple-600' }] },





          { id: 'biology-1', title: 'Characteristics and Classifications of living organisms', description: 'Explore the characteristics and classifications of living organisms, including the five kingdoms and their features.', subject: 'Biology', group: 'The Foundations of Life', tags: [{ name: 'Topic 1', color: 'bg-orange-600' }] },
          { id: 'biology-2', title: 'Organisation of the organism', description: 'Explore the organization of cells, tissues, organs, and systems in living organisms.', subject: 'Biology', group: 'The Foundations of Life', tags: [{ name: 'Topic 2', color: 'bg-orange-600' }] },
          { id: 'biology-3', title: 'Movement in and out of cells', description: 'Examine the processes of diffusion, osmosis, and active transport in cellular function.', subject: 'Biology', group: 'The Foundations of Life', tags: [{ name: 'Topic 3', color: 'bg-orange-600' }] },
          { id: 'biology-4', title: 'Biological Molecules', description: 'Discover the key biological molecules, including carbohydrates, proteins, lipids. And testing for them.', subject: 'Biology', group: 'The Foundations of Life', tags: [{ name: 'Topic 4', color: 'bg-orange-600' }] },
          { id: 'biology-5', title: 'Enzymes', description: 'Explore the role of enzymes in biological processes, including their structure, function, and factors affecting enzyme activity.', subject: 'Biology', group: 'The Foundations of Life', tags: [{ name: 'Topic 5', color: 'bg-orange-600' }] },
          { id: 'biology-6', title: 'Plant Nutrition', description: 'Investigate the process of photosynthesis and the factors affecting plant growth and nutrition.', subject: 'Biology', group: 'Life Support Systems ', tags: [{ name: 'Topic 6', color: 'bg-orange-600' }] },
          { id: 'biology-7', title: 'Human Nutrition', description: 'Examine the components of a balanced diet and the role of nutrients in human health.', subject: 'Biology', group: 'Life Support Systems ', tags: [{ name: 'Topic 7', color: 'bg-orange-600' }] },
          { id: 'biology-8', title: 'Transport in Plants', description: 'Explore the process of transport in plants, including xylem and phloem.', subject: 'Biology', group: 'Life Support Systems ', tags: [{ name: 'Topic 8', color: 'bg-orange-600' }] },
          { id: 'biology-9', title: 'Transport in Animals', description: 'Examine the circulatory system in animals, including the heart, blood vessels, and blood components.', subject: 'Biology', group: 'Life Support Systems ', tags: [{ name: 'Topic 9', color: 'bg-orange-600' }] },
          { id: 'biology-10', title: 'Disease and Immunity', description: 'Understand the causes and effects of diseases in humans, including the immune response and vaccination.', subject: 'Biology', group: 'Health, Disease & Control', tags: [{ name: 'Topic 10', color: 'bg-orange-600' }] },
          { id: 'biology-11', title: 'Gas Exchange in Animals', description: 'Understand the mechanisms of gas exchange in animals, focusing on the human respiratory system.', subject: 'Biology', group: 'Health, Disease & Control', tags: [{ name: 'Topic 11', color: 'bg-orange-600' }] },
          { id: 'biology-12', title: 'Respiration', description: 'Understand the process of cellular respiration, including aerobic and anaerobic respiration and energy production.', subject: 'Biology', group: 'Health, Disease & Control', tags: [{ name: 'Topic 12', color: 'bg-orange-600' }] },
          { id: 'biology-13', title: 'Excretion in humans', description: 'Learn about the excretory system in humans, including the structure and role of the kidneys and urine formation.', subject: 'Biology', group: 'Health, Disease & Control', tags: [{ name: 'Topic 13', color: 'bg-orange-600' }] },
          { id: 'biology-14', title: 'Coordination and Response', description: 'Study the nervous and hormonal systems in humans and plants, including responses to stimuli and homeostasis.', subject: 'Biology', group: 'Health, Disease & Control', tags: [{ name: 'Topic 14', color: 'bg-orange-600' }] },
          { id: 'biology-15', title: 'Drugs', description: 'Understand the use of drugs and their effects on the human body.', subject: 'Biology', group: 'Health, Disease & Control', tags: [{ name: 'Topic 15', color: 'bg-orange-600' }] },
          { id: 'biology-16', title: 'Reproduction', description: 'Explore the reproductive systems in humans and plants, including sexual and asexual reproduction.', subject: 'Biology', group: 'Reproduction and Continuity', tags: [{ name: 'Topic 16', color: 'bg-orange-600' }] },
          { id: 'biology-17', title: 'Inheritance', description: 'Understand the principles of inheritance, including genes, chromosomes, and patterns of inheritance.', subject: 'Biology', group: 'Reproduction and Continuity', tags: [{ name: 'Topic 17', color: 'bg-orange-600' }] },
          { id: 'biology-18', title: 'Variation and Selection', description: 'Examine the concepts of variation and evolution, including natural selection and speciation.', subject: 'Biology', group: 'Reproduction and Continuity', tags: [{ name: 'Topic 18', color: 'bg-orange-600' }] },
          { id: 'biology-19', title: 'Organisms and their Environment', description: 'Explore ecosystems, energy flow, and the impact of human activities on the environment.', subject: 'Biology', group: 'Ecology and the Environment', tags: [{ name: 'Topic 19', color: 'bg-orange-600' }] },
          { id: 'biology-20', title: 'Human Influences on Ecosystems', description: 'Investigate human activities that affect ecosystems, including pollution, deforestation, and conservation efforts.', subject: 'Biology', group: 'Ecology and the Environment', tags: [{ name: 'Topic 20', color: 'bg-orange-600' }] },
          { id: 'biology-21', title: 'Biotechnology and genetic modification', description: 'Learn about biotechnology techniques and the applications and implications of genetic modification.', subject: 'Biology', tags: [{ name: 'Topic 21', color: 'bg-orange-600' }] },
          { id: 'biology-paper-6', title: 'Paper 6 (Alternative to Practical)', description: 'Explore the alternative to practical assessment for biology.', subject: 'Biology', color: 'from-orange-600 to-orange-500 dark:from-orange-700 dark:to-orange-800' },
          { id: 'biology-full-revision', title: 'Full Biology Revision', description: 'Comprehensive revision of all IGCSE Biology topics to prepare for exams.', subject: 'Biology', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', tags: [{ name: 'Revision', color: 'bg-purple-600' }] },




          { id: 'maths-1', title: 'Number', description: 'Explore the fundamental concepts of numbers, including operations, fractions, decimals, and percentages.', subject: 'Mathematics', tags: [{ name: 'Topic 1', color: 'bg-orange-600' }] },
          { id: 'maths-2', title: 'Algebra and Graphs', description: 'Study algebraic expressions, equations, inequalities, and graphing techniques.', subject: 'Mathematics', tags: [{ name: 'Topic 2', color: 'bg-orange-600' }] },
          { id: 'maths-3', title: 'Coordinate Geometry', description: 'Learn about coordinate systems, equations of lines, and geometric properties in the coordinate plane.', subject: 'Mathematics', tags: [{ name: 'Topic 3', color: 'bg-orange-600' }] },
          { id: 'maths-4', title: 'Geometry', description: 'Explore geometric shapes, properties, theorems, and constructions.', subject: 'Mathematics', tags: [{ name: 'Topic 4', color: 'bg-orange-600' }] },
          { id: 'maths-5', title: 'Mensuration', description: 'Study the measurement of geometric figures, including areas, volumes, and surface areas.', subject: 'Mathematics', tags: [{ name: 'Topic 5', color: 'bg-orange-600' }] },
          { id: 'maths-6', title: 'Trigonometry', description: 'Learn about trigonometric ratios, identities, and applications in solving problems.', subject: 'Mathematics', tags: [{ name: 'Topic 6', color: 'bg-orange-600' }] },
          { id: 'maths-7', title: 'Transformations and Vectors', description: 'Explore geometric transformations, including translations, rotations, reflections, and vector operations.', subject: 'Mathematics', tags: [{ name: 'Topic 7', color: 'bg-orange-600' }] },
          { id: 'maths-8', title: 'Probability', description: 'Understand the principles of probability, including theoretical and experimental probability, and probability distributions.', subject: 'Mathematics', tags: [{ name: 'Topic 8', color: 'bg-orange-600' }] },
          { id: 'maths-9', title: 'Statistics', description: 'Learn about data collection, representation, analysis, and interpretation in statistics.', subject: 'Mathematics', tags: [{ name: 'Topic 9', color: 'bg-orange-600' }] },
          { id: 'maths-full-revision', title: 'Full Mathematics Revision', description: 'Comprehensive revision of all IGCSE Mathematics topics to prepare for exams.', subject: 'Mathematics', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', tags: [{ name: 'Revision', color: 'bg-purple-600' }] }
        ]
      },

      edexcel: {
        topics: [
          { id: 'chemistry-L1', title: 'Priciples of chemistry (Edexcel)', description: 'Explore atomic structure, the periodic table, bonding, and quantitative chemical calculations.', subject: 'Chemistry' },
          { id: 'chemistry-L2', title: 'Inorganic chemistry (Edexcel)', description: 'Study the properties, preparation, and chemical tests of acids, bases, and salts.', subject: 'Chemistry' },
          { id: 'chemistry-L3', title: 'Physical chemistry (Edexcel)', description: 'Explore the principles of physical chemistry, including the periodic table, chemical bonding, and chemical reactions.', subject: 'Chemistry' },
          { id: 'chemistry-L4', title: 'Organic Chemistry (Edexcel)', description: 'Investigate hydrocarbons, alcohols, acids, and polymers derived from crude oil.', subject: 'Chemistry' },
          { id: 'chemistry(edexcel)-full-revision', title: 'Full Chemistry Revision (Edexcel)', description: 'Comprehensive revision of all IGCSE Chemistry topics to prepare for exams.', subject: 'Chemistry', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', tags: [{ name: 'Revision', color: 'bg-purple-600' }] }
        ]
      }
    }
  },
  'a-level': {
    title: 'A-Level',
    fullName: 'Advanced Level',
    description: 'Excel in your A-Level studies with advanced content designed for university preparation.',
    boards: {
      cambridge: {
        topics: [
          //------------------------------------------------------------(Chemistry)------------------------------------------------------------ 
          { id: 'chemistry-CH1', title: 'Atomic Structure', description: 'Understand atomic models, electronic structure, isotopes, and trends across the periodic table.', subject: 'Chemistry', group: 'Physical chemistry (AS)', tags: [{ name: 'Topic 1', color: 'bg-orange-600' }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH2', title: 'Atoms, molecules and stoichiometry', description: 'Understand the concepts of atoms, molecules, and stoichiometry in chemical reactions.', subject: 'Chemistry', group: 'Physical chemistry (AS)', tags: [{ name: 'Topic 2', color: 'bg-orange-600', }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH3', title: 'Chemical bonding', description: 'Explore the different types of chemical bonds, including ionic, covalent, and metallic bonds, and their properties.', subject: 'Chemistry', group: 'Physical chemistry (AS)', tags: [{ name: 'Topic 3', color: 'bg-orange-600' }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH4', title: 'States of matter', description: 'Understand the properties of solids, liquids, and gases, and the changes between these states.', subject: 'Chemistry', group: 'Physical chemistry (AS)', tags: [{ name: 'Topic 4', color: 'bg-orange-600' }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH5', title: 'Chemical energetics', description: 'Learn about energy changes in chemical reactions, including exothermic and endothermic processes.', subject: 'Chemistry', group: 'Physical chemistry (AS)', tags: [{ name: 'Topic 5', color: 'bg-orange-600' }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH6', title: 'Electrochemistry', description: 'Study the principles of electrochemistry, including redox reactions, electrochemical cells, and applications in industry.', subject: 'Chemistry', group: 'Physical chemistry (AS)', tags: [{ name: 'Topic 6', color: 'bg-orange-600' }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH7', title: 'Equilibria', description: 'Explore the principles of chemical equilibria, including Le Chatelier\'s principle and equilibrium constants.', subject: 'Chemistry', group: 'Physical chemistry (AS)', tags: [{ name: 'Topic 7', color: 'bg-orange-600', }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH8', title: 'Reaction kinetics', description: 'Understand reaction rates, collision theory, and the factors affecting reaction rates.', subject: 'Chemistry', group: 'Physical chemistry (AS)', tags: [{ name: 'Topic 8', color: 'bg-orange-600', }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH9', title: 'The Periodic Table: chemical periodicity', description: 'Explore the trends and patterns in the periodic table, including atomic radius, ionization energy, and electronegativity.', subject: 'Chemistry', group: 'Inorganic chemistry (AS)', tags: [{ name: 'Topic 9', color: 'bg-orange-600', }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH10', title: 'Group 2', description: 'Explore the properties and reactions of Group 2 elements, including trends in reactivity and their compounds.', subject: 'Chemistry', group: 'Inorganic chemistry (AS)', tags: [{ name: 'Topic 10', color: 'bg-orange-600', }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH11', title: 'Group 17', description: 'Study the properties and reactions of Group 17 elements (halogens), including trends in reactivity and their compounds.', subject: 'Chemistry', group: 'Inorganic chemistry (AS)', tags: [{ name: 'Topic 11', color: 'bg-orange-600', }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH12', title: 'Nitrogen and sulfur', description: 'Explore the properties and reactions of nitrogen and sulfur, including their compounds and industrial applications.', subject: 'Chemistry', group: 'Inorganic chemistry (AS)', tags: [{ name: 'Topic 12', color: 'bg-orange-600', }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH13', title: 'An introduction to AS Level organic chemistry', description: 'Introduce fundamental concepts in organic chemistry.', subject: 'Chemistry', group: 'Organic chemistry (AS)', tags: [{ name: 'Topic 13', color: 'bg-orange-600', }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH14', title: 'Hydrocarbons', description: 'Study the properties and reactions of hydrocarbons.', subject: 'Chemistry', group: 'Organic chemistry (AS)', tags: [{ name: 'Topic 14', color: 'bg-orange-600', }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH15', title: 'Halogen compounds', description: 'Explore the properties and reactions of halogen-containing compounds.', subject: 'Chemistry', group: 'Organic chemistry (AS)', tags: [{ name: 'Topic 15', color: 'bg-orange-600', }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH16', title: 'Hydroxy compounds', description: 'Study the properties and reactions of hydroxy-containing compounds.', subject: 'Chemistry', group: 'Organic chemistry (AS)', tags: [{ name: 'Topic 16', color: 'bg-orange-600', }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH17', title: 'Carbonyl compounds', description: 'Explore the properties and reactions of carbonyl-containing compounds.', subject: 'Chemistry', group: 'Organic chemistry (AS)', tags: [{ name: 'Topic 17', color: 'bg-orange-600', }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH18', title: 'Carboxylic acids and derivatives', description: 'Study the properties and reactions of carboxylic acids and their derivatives.', subject: 'Chemistry', group: 'Organic chemistry (AS)', tags: [{ name: 'Topic 18', color: 'bg-orange-600', }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH19', title: 'Nitrogen compounds', description: 'Explore the properties and reactions of nitrogen-containing compounds.', subject: 'Chemistry', group: 'Organic chemistry (AS)', tags: [{ name: 'Topic 19', color: 'bg-orange-600', }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH20', title: 'Polymerisation', description: 'Learn about polymerisation processes, including addition and condensation polymerisation.', subject: 'Chemistry', group: 'Organic chemistry (AS)', tags: [{ name: 'Topic 20', color: 'bg-orange-600', }, { name: 'AS', color: 'bg-blue-900' }] },
          { id: 'chemistry-AS-revision', title: 'AS Chemistry Revision', description: 'Comprehensive revision of all AS Chemistry topics to prepare for exams.', subject: 'Chemistry', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', tags: [{ name: 'Revision', color: 'bg-purple-600', }, { name: 'AS', color: 'bg-blue-900' }] },

          { id: 'chemistry-CH23', title: 'Chemical energetics', description: 'Advanced study of energy changes in chemical reactions, including lattice energy, Born-Haber cycles, and entropy changes.', subject: 'Chemistry', group: 'Physical chemistry (A2)', tags: [{ name: 'Topic 23', color: 'bg-orange-600' }, { name: 'A2', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH24', title: 'Electrochemistry', description: 'Advanced electrochemistry including electrode potentials, standard cells, and electrolysis principles.', subject: 'Chemistry', group: 'Physical chemistry (A2)', tags: [{ name: 'Topic 24', color: 'bg-orange-600' }, { name: 'A2', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH25', title: 'Equilibria', description: 'Advanced chemical equilibria including acid-base equilibria, pH calculations, and solubility products.', subject: 'Chemistry', group: 'Physical chemistry (A2)', tags: [{ name: 'Topic 25', color: 'bg-orange-600' }, { name: 'A2', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH26', title: 'Reaction kinetics', description: 'Advanced reaction kinetics including rate equations, reaction mechanisms, and activation energy.', subject: 'Chemistry', group: 'Physical chemistry (A2)', tags: [{ name: 'Topic 26', color: 'bg-orange-600' }, { name: 'A2', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH27', title: 'Group 2', description: 'Advanced study of Group 2 elements including trends in properties, reactions, and complex ion formation.', subject: 'Chemistry', group: 'Inorganic chemistry (A2)', tags: [{ name: 'Topic 27', color: 'bg-orange-600' }, { name: 'A2', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH28', title: 'Chemistry of transition elements', description: 'Explore transition elements including electron configurations, complex ions, catalysis, and redox reactions.', subject: 'Chemistry', group: 'Inorganic chemistry (A2)', tags: [{ name: 'Topic 28', color: 'bg-orange-600' }, { name: 'A2', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH29', title: 'An introduction to A Level organic chemistry', description: 'Advanced introduction to organic chemistry concepts, mechanisms, and synthetic pathways.', subject: 'Chemistry', group: 'Organic chemistry (A2)', tags: [{ name: 'Topic 29', color: 'bg-orange-600' }, { name: 'A2', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH30', title: 'Hydrocarbons', description: 'Advanced study of hydrocarbons including aromatic compounds, benzene structure, and electrophilic substitution.', subject: 'Chemistry', group: 'Organic chemistry (A2)', tags: [{ name: 'Topic 30', color: 'bg-orange-600' }, { name: 'A2', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH31', title: 'Halogen compounds', description: 'Advanced halogen chemistry including nucleophilic substitution, elimination reactions, and reaction mechanisms.', subject: 'Chemistry', group: 'Organic chemistry (A2)', tags: [{ name: 'Topic 31', color: 'bg-orange-600' }, { name: 'A2', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH32', title: 'Hydroxy compounds', description: 'Advanced study of alcohols and phenols including synthesis, reactions, and acidity trends.', subject: 'Chemistry', group: 'Organic chemistry (A2)', tags: [{ name: 'Topic 32', color: 'bg-orange-600' }, { name: 'A2', color: 'bg-blue-900' }] },
          { id: 'chemistry-CH33', title: 'Carboxylic acids and derivatives', description: 'Advanced carboxylic acid chemistry including acyl chlorides, esters, amides, and reaction mechanisms.', subject: 'Chemistry', group: 'Organic chemistry (A2)', tags: [{ name: 'Topic 33', color: 'bg-orange-600' }, { name: 'A2', color: 'bg-blue-800' }] },
          { id: 'chemistry-CH34', title: 'Nitrogen compounds', description: 'Advanced nitrogen chemistry including amines, amides, amino acids, and their reactions.', subject: 'Chemistry', group: 'Organic chemistry (A2)', tags: [{ name: 'Topic 34', color: 'bg-orange-600' }, { name: 'A2', color: 'bg-blue-800' }] },
          { id: 'chemistry-CH35', title: 'Polymerisation', description: 'Advanced polymerisation including addition and condensation polymers, biopolymers, and polymer properties.', subject: 'Chemistry', group: 'Organic chemistry (A2)', tags: [{ name: 'Topic 35', color: 'bg-orange-600' }, { name: 'A2', color: 'bg-blue-800' }] },
          { id: 'chemistry-CH36', title: 'Organic synthesis', description: 'Advanced organic synthesis including multi-step syntheses, retrosynthesis, and analytical techniques.', subject: 'Chemistry', group: 'Organic chemistry (A2)', tags: [{ name: 'Topic 36', color: 'bg-orange-600' }, { name: 'A2', color: 'bg-blue-900' }] },
          { id: 'Chemistry-Practical(A2)', title: 'Practical Skills (A2)', description: 'f', subject: 'Chemistry', color: 'from-orange-600 to-orange-500 dark:from-orange-700 dark:to-orange-800' },

          { id: 'chemistry-A2-revision', title: 'A2 Chemistry Revision', description: 'Comprehensive revision of all A2 Chemistry topics to prepare for exams.', subject: 'Chemistry', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', tags: [{ name: 'Revision', color: 'bg-purple-600', }, { name: 'A2', color: 'bg-blue-900' }] },

          //------------------------------------------------------------(Physics)------------------------------------------------------------ 
          { id: 'Physics-CH1', title: 'Physical Quantities and Units (AS)', description: 'Learn about the fundamental physical quantities and their units, including SI units and unit conversions.', subject: 'Physics', group: 'AS' },
          { id: 'Physics-CH2', title: 'Kinematics', description: 'Explore the principles of motion, including displacement, velocity, acceleration, and equations of motion.', subject: 'Physics', group: 'AS' },
          { id: 'Physics-CH3', title: 'Dynamics', description: 'Understand the concepts of force, mass, and acceleration, and their relationships in Newton\'s laws of motion, and momentum.', subject: 'Physics', group: 'AS' },
          { id: 'Physics-CH4', title: 'Forces,density and pressure', description: 'Study the concepts of forces, density, and pressure in fluids and solids.', subject: 'Physics', group: 'AS' },
          { id: 'Physics-CH5', title: 'Work, energy and power', description: 'Understand the principles of work, energy, and power, including kinetic and potential energy.', subject: 'Physics', group: 'AS' },
          { id: 'Physics-CH6', title: 'Deformation of solids', description: 'Explore the behavior of solids under stress, including elasticity, plasticity, and Hooke\'s law.', subject: 'Physics', group: 'AS' },
          { id: 'Physics-CH7', title: 'Waves', description: 'Learn about wave properties, behavior, and applications, including reflection, refraction, and diffraction.', subject: 'Physics', group: 'AS' },
          { id: 'Physics-CH8', title: 'Superposition', description: 'Understand the principle of superposition and its applications in wave interference and diffraction.', subject: 'Physics', group: 'AS' },
          { id: 'Physics-CH9', title: 'Electricity', description: 'Study electric current, resistance, and Ohm\'s law, including series and parallel circuits.', subject: 'Physics', group: 'AS' },
          { id: 'Physics-CH10', title: 'D.C. circuits', description: 'Explore the components and behavior of electric circuits, including Kirchhoff\'s laws and circuit analysis.', subject: 'Physics', group: 'AS' },
          { id: 'Physics-CH11', title: 'Particle physics', description: 'Learn about the fundamental particles and forces in the universe, including the Standard Model and particle interactions.', subject: 'Physics', group: 'AS' },
          { id: 'Physics-Practical(AS)', title: 'Practical Skills (AS)', description: 'mastering error analysis, data measurement & processing, graphing, and critical evaluation of practical work.', subject: 'Physics', color: 'from-orange-600 to-orange-500 dark:from-orange-700 dark:to-orange-800', group: 'AS' },
          { id: 'Physics-AS-revision', title: 'AS Physics Revision', description: 'Comprehensive revision of all AS Physics topics to prepare for exams.', subject: 'Physics', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', tags: [{ name: 'Revision', color: 'bg-purple-600' }], group: 'AS' },


          { id: 'Physics-CH12', title: 'Motion in a circle', description: 'Study circular motion, centripetal force, and the relationship between linear and angular quantities.', subject: 'Physics', group: 'A2' },
          { id: 'Physics-CH13', title: 'Gravitational fields', description: 'Understand the concepts of gravitational fields, gravitational potential, and orbital motion.', subject: 'Physics', group: 'A2' },
          { id: 'Physics-CH14', title: 'Tempreture', description: 'Explore the concepts of temperature, heat transfer, and the kinetic theory of gases.', subject: 'Physics', group: 'A2' },
          { id: 'Physics-CH15', title: 'Ideal gases', description: 'Study the behavior of ideal gases, including the gas laws and the ideal gas equation.', subject: 'Physics', group: 'A2' },
          { id: 'Physics-CH16', title: 'Thermodynamics', description: 'Learn about the principles of thermodynamics, including the laws of thermodynamics and heat engines.', subject: 'Physics', group: 'A2' },
          { id: 'Physics-CH17', title: 'Oscillations', description: 'Understand oscillatory motion, simple harmonic motion, and their applications.', subject: 'Physics', group: 'A2' },
          { id: 'Physics-CH18', title: 'Electric fields', description: 'Explore electric fields, electric potential, and capacitance.', subject: 'Physics', group: 'A2' },
          { id: 'Physics-CH19', title: 'Capacitance', description: 'Study the concept of capacitance, capacitors in circuits, and energy storage in electric fields.', subject: 'Physics', group: 'A2' },
          { id: 'Physics-CH20', title: 'Magnetic fields', description: 'Learn about magnetic fields, magnetic forces, and electromagnetic induction.', subject: 'Physics', group: 'A2' },
          { id: 'Physics-CH21', title: 'Alternating current', description: 'Understand the principles of alternating current, including AC circuits and transformers.', subject: 'Physics', group: 'A2' },
          { id: 'Physics-CH22', title: 'Quantum physics', description: 'Explore the concepts of quantum physics, including wave-particle duality and the photoelectric effect.', subject: 'Physics', group: 'A2' },
          { id: 'Physics-CH23', title: 'Nuclear physics', description: 'Study the structure of the nucleus, radioactivity, and nuclear reactions.', subject: 'Physics', group: 'A2' },
          { id: 'Physics-CH24', title: 'Medical Physics', description: 'Learn about the applications of physics in medicine, including medical imaging and radiation therapy.', subject: 'Physics', group: 'A2' },
          { id: 'Physics-CH25', title: 'Astronomy and cosmology', description: 'Understand astrophysical phenomena and the structure and evolution of the universe.', subject: 'Physics', group: 'A2' },
          { id: 'Physics-Practical(A2)', title: 'Practical Skills (A2)', description: 'planning investigations, using logarithmic methods, and performing sophisticated error propagation and graphical analysis.', subject: 'Physics', color: 'from-orange-600 to-orange-500 dark:from-orange-700 dark:to-orange-800', group: 'A2' },


          { id: 'Physics-A2-revision', title: 'A2 Physics Revision', description: 'Comprehensive revision of all A2 Physics topics to prepare for exams.', subject: 'Physics', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', tags: [{ name: 'Revision', color: 'bg-purple-600' }], group: 'A2' },


          //------------------------------------------------------------(Biology)------------------------------------------------------------ 
          { id: 'Biology-CH1', title: 'Cell structure', description: 'Cell structure and ultrastructure, microscopy and cell specialisation.', subject: 'Biology', group: 'AS', tags: [{ name: 'Topic 1', color: 'bg-orange-600' }] },
          { id: 'Biology-CH2', title: 'Biological molecules', description: 'Structure and function of carbohydrates, lipids, proteins and water.', subject: 'Biology', group: 'AS', tags: [{ name: 'Topic 2', color: 'bg-orange-600' }] },
          { id: 'Biology-CH3', title: 'Enzymes', description: 'Enzyme structure, mechanism and factors affecting enzyme activity.', subject: 'Biology', group: 'AS', tags: [{ name: 'Topic 3', color: 'bg-orange-600' }] },
          { id: 'Biology-CH4', title: 'Cell membranes and transport', description: 'Membrane structure, diffusion, osmosis and active transport.', subject: 'Biology', group: 'AS', tags: [{ name: 'Topic 4', color: 'bg-orange-600' }] },
          { id: 'Biology-CH5', title: 'The mitotic cell cycle', description: 'Cell division, mitosis, cell cycle regulation and cancer.', subject: 'Biology', group: 'AS', tags: [{ name: 'Topic 5', color: 'bg-orange-600' }] },
          { id: 'Biology-CH6', title: 'Nucleic acids and protein synthesis', description: 'DNA, RNA, replication, transcription and translation.', subject: 'Biology', group: 'AS', tags: [{ name: 'Topic 6', color: 'bg-orange-600' }] },
          { id: 'Biology-CH7', title: 'Transport in plants', description: 'Xylem, phloem and mechanisms of transport in plants.', subject: 'Biology', group: 'AS', tags: [{ name: 'Topic 7', color: 'bg-orange-600' }] },
          { id: 'Biology-CH8', title: 'Transport in mammals', description: 'Circulatory system, blood composition and transport mechanisms.', subject: 'Biology', group: 'AS', tags: [{ name: 'Topic 8', color: 'bg-orange-600' }] },
          { id: 'Biology-CH9', title: 'Gas exchange', description: 'Gas exchange systems and respiratory physiology.', subject: 'Biology', group: 'AS', tags: [{ name: 'Topic 9', color: 'bg-orange-600' }] },
          { id: 'Biology-CH10', title: 'Infectious diseases', description: 'Pathogens, transmission, disease mechanisms and prevention.', subject: 'Biology', group: 'AS', tags: [{ name: 'Topic 10', color: 'bg-orange-600' }] },
          { id: 'Biology-CH11', title: 'Immunity', description: 'Innate and adaptive immunity, vaccines and immune system disorders.', subject: 'Biology', group: 'AS', tags: [{ name: 'Topic 11', color: 'bg-orange-600' }] },
          { id: 'Biology-AS-revision', title: 'AS Biology Revision', description: 'Comprehensive revision of all AS Biology topics to prepare for exams.', subject: 'Biology', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', group: 'AS', tags: [{ name: 'Revision', color: 'bg-purple-600' }] },

          { id: 'Biology-CH12', title: 'Energy and respiration', description: 'Cellular respiration, ATP production and energy metabolism.', subject: 'Biology', group: 'A2', tags: [{ name: 'Topic 12', color: 'bg-orange-600' }] },
          { id: 'Biology-CH13', title: 'Photosynthesis', description: 'Light and dark reactions, chloroplast structure and factors affecting photosynthesis.', subject: 'Biology', group: 'A2', tags: [{ name: 'Topic 13', color: 'bg-orange-600' }] },
          { id: 'Biology-CH14', title: 'Homeostasis', description: 'Homeostatic control systems, endocrine and nervous system coordination.', subject: 'Biology', group: 'A2', tags: [{ name: 'Topic 14', color: 'bg-orange-600' }] },
          { id: 'Biology-CH15', title: 'Control and coordination', description: 'Neuronal and hormonal control, sensory systems and effectors.', subject: 'Biology', group: 'A2', tags: [{ name: 'Topic 15', color: 'bg-orange-600' }] },
          { id: 'Biology-CH16', title: 'Inheritance', description: 'Genetics, chromosome behaviour, pedigree analysis and gene expression.', subject: 'Biology', group: 'A2', tags: [{ name: 'Topic 16', color: 'bg-orange-600' }] },
          { id: 'Biology-CH17', title: 'Selection and evolution', description: 'Natural selection, speciation and evolutionary evidence.', subject: 'Biology', group: 'A2', tags: [{ name: 'Topic 17', color: 'bg-orange-600' }] },
          { id: 'Biology-CH18', title: 'Classification, biodiversity and conservation', description: 'Classification systems, biodiversity measures and conservation strategies.', subject: 'Biology', group: 'A2', tags: [{ name: 'Topic 18', color: 'bg-orange-600' }] },
          { id: 'Biology-CH19', title: 'Genetic technology', description: 'Genetic engineering, biotechnology techniques and their applications.', subject: 'Biology', group: 'A2', tags: [{ name: 'Topic 19', color: 'bg-orange-600' }] },
          { id: 'Biology-Paper5', title: 'Paper 5 (Practical/Structured)', description: 'Practical techniques, data analysis and structured question practice for Paper 5.', subject: 'Biology', color: 'from-orange-600 to-orange-500 dark:from-orange-700 dark:to-orange-800', group: 'A2' },
          { id: 'Biology-A2-revision', title: 'A2 Biology Revision', description: 'Comprehensive revision of all A2 Biology topics to prepare for exams.', subject: 'Biology', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', group: 'A2', tags: [{ name: 'Revision', color: 'bg-purple-600' }] },



          {
            "id": "P1-CH1",
            "title": "Quadratics",
            "description": "Master completing the square to find vertices and sketch graphs, use the discriminant to determine the nature of roots, solve quadratic equations and inequalities, tackle simultaneous equations (one linear, one quadratic), and solve equations that are quadratic in form.",
            "subject": "Mathematics",
            "group": 'Pure 1',
            tags: [{ name: 'Topic 1', color: 'bg-orange-600' }]
          },
          {
            "id": "P1-CH2",
            "title": "Functions",
            "description": "Understand domain, range, one-one functions, inverse functions, and composition. Learn to find ranges, determine if a function is one-one, find inverse functions, relate them graphically using y=x, and apply graph transformations (translations, reflections, stretches).",
            "subject": "Mathematics",
            "group": 'Pure 1',
            tags: [{ name: 'Topic 2', color: 'bg-orange-600' }]
          },
          {
            "id": "P1-CH3",
            "title": "Coordinate Geometry",
            "description": "Find equations of straight lines using various forms, interpret gradients for parallel and perpendicular lines, and solve problems involving distances and midpoints. Explore the equation of a circle in both forms and use algebraic and geometric properties to solve problems involving lines and circles.",
            "subject": "Mathematics",
            "group": 'Pure 1',
            tags: [{ name: 'Topic 3', color: 'bg-orange-600' }]
          },
          {
            "id": "P1-CH4",
            "title": "Circular Measure",
            "description": "Understand the radian definition, convert between radians and degrees, and apply the arc length (s = rθ) and sector area (A = ½ r²θ) formulas to solve geometric problems involving circles and triangles.",
            "subject": "Mathematics",
            "group": 'Pure 1',
            tags: [{ name: '  Topic 4', color: 'bg-orange-600' }]
          },
          {
            "id": "P1-CH5",
            "title": "Trigonometry",
            "description": "Sketch and use graphs of sine, cosine, and tangent functions. Use exact values for key angles, understand inverse trigonometric notations, prove identities using tanθ = sinθ/cosθ and sin²θ + cos²θ = 1, and solve trigonometric equations within a specified interval.",
            "subject": "Mathematics",
            "group": 'Pure 1',
            tags: [{ name: 'Topic 5', color: 'bg-orange-600' }]
          },
          {
            "id": "P1-CH6",
            "title": "Series",
            "description": "Expand (a + b)ⁿ for positive integer n using binomial coefficients. Recognize arithmetic and geometric progressions, use formulas for the nth term and sum of the first n terms, and apply the condition for convergence to find the sum to infinity of a geometric progression.",
            "subject": "Mathematics",
            "group": 'Pure 1',
            tags: [{ name: 'Topic 6', color: 'bg-orange-600' }]
          },
          {
            "id": "P1-CH7",
            "title": "Differentiation",
            "description": "Understand gradient as a limit, use derivative notations, and differentiate xⁿ (rational n), composites using the chain rule, and sums/differences. Apply differentiation to find gradients, tangents, normals, rates of change, and to locate and determine the nature of stationary points.",
            "subject": "Mathematics",
            "group": 'Pure 1',
            tags: [{ name: 'Topic 7', color: 'bg-orange-600' }]
          },
          {
            "id": "P1-CH8",
            "title": "Integration",
            "description": "Understand integration as the reverse of differentiation, integrate (ax + b)ⁿ, and solve problems involving a constant of integration. Evaluate definite integrals and use them to find areas between curves and lines, and volumes of revolution about the x- or y-axis.",
            "subject": "Mathematics",
            "group": 'Pure 1',
            tags: [{ name: 'Topic 8', color: 'bg-orange-600' }]
          },
          { id: 'P1-revision', title: 'Pure math 1 Revision', description: 'Comprehensive revision of all Pure math 1 topics to prepare for exams.', subject: 'Mathematics', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', tags: [{ name: 'Revision', color: 'bg-purple-600' }], group: 'Pure 1' },





          { id: 'P3-CH1', title: 'Algebra', description: 'Explore absolute value equations, master polynomial division, understand factor theorem, decompose partial fractions, and expand binomials with rational powers.', subject: 'Mathematics', group: 'Pure 3', tags: [{ name: 'Topic 1', color: 'bg-orange-600' }] },
          { id: 'P3-CH2', title: 'Logarithmic & exponential functions', description: 'Discover inverse functions eˣ and ln x, apply logarithm laws, solve exponential equations, and transform relationships to linear form.', subject: 'Mathematics', group: 'Pure 3', tags: [{ name: 'Topic 2', color: 'bg-orange-600' }] },
          { id: 'P3-CH3', title: 'Trigonometry', description: 'Understand secant, cosecant and cotangent, master compound and double angle identities, and learn to express a sin θ + b cos θ in R-form.', subject: 'Mathematics', group: 'Pure 3', tags: [{ name: 'Topic 3', color: 'bg-orange-600' }] },
          { id: 'P3-CH4', title: 'Differentiation', description: 'Master product, quotient and chain rules; explore parametric and implicit differentiation; learn to find tangents and normals.', subject: 'Mathematics', group: 'Pure 3', tags: [{ name: 'Topic 4', color: 'bg-orange-600' }] },
          { id: 'P3-CH5', title: 'Integration', description: "Practice reverse differentiation, master trigonometric integrals, apply partial fractions, recognise f'(x)/f(x) form, and learn integration by parts with substitution.", subject: 'Mathematics', group: 'Pure 3', tags: [{ name: 'Topic 5', color: 'bg-orange-600' }] },
          { id: 'P3-CH6', title: 'Numerical methods', description: 'Discover how to locate roots by sign change, understand iterative formulas xₙ₊₁ = F(xₙ), and solve equations to required accuracy.', subject: 'Mathematics', group: 'Pure 3', tags: [{ name: 'Topic 6', color: 'bg-orange-600' }] },
          { id: 'P3-CH7', title: 'Vectors', description: 'Learn vector operations, understand equations of lines, apply scalar product, find angles between lines, and solve geometric problems in 2D and 3D.', subject: 'Mathematics', group: 'Pure 3', tags: [{ name: 'Topic 7', color: 'bg-orange-600' }] },
          { id: 'P3-CH8', title: 'Differential equations', description: 'Explore forming differential equations from rate problems, master separating variables, and discover how to find general and particular solutions.', subject: 'Mathematics', group: 'Pure 3', tags: [{ name: 'Topic 8', color: 'bg-orange-600' }] },
          { id: 'P3-CH9', title: 'Complex numbers', description: 'Understand Cartesian form, explore modulus and argument, visualise on Argand diagrams, master polar form, find square roots, and discover loci (circles, perpendicular bisectors, half-lines).', subject: 'Mathematics', group: 'Pure 3', tags: [{ name: 'Topic 9', color: 'bg-orange-600' }] },

          {
            "id": "S1-CH1",
            "title": "Representation of Data",
            "description": "Present raw data using stem-and-leaf, box-and-whisker, histograms and cumulative frequency graphs. Calculate mean, median, mode, range, interquartile range and standard deviation, and estimate values from cumulative frequency graphs.",
            "subject": "Mathematics",
            "group": 'Probability & Statistics 1',
            tags: [{ name: 'Topic 1', color: 'bg-orange-600' }]
          },
          {
            "id": "S1-CH2",
            "title": "Permutations and Combinations",
            "description": "Understand permutations and combinations, solve problems involving arrangements of objects in a line, including cases with repetition and restrictions (e.g., items that must or must not be adjacent).",
            "subject": "Mathematics",
            "group": 'Probability & Statistics 1',
            tags: [{ name: 'Topic 2', color: 'bg-orange-600' }]
          },
          {
            "id": "S1-CH3",
            "title": "Probability",
            "description": "Evaluate probabilities using enumeration, permutations or combinations. Apply addition and multiplication rules, understand exclusive and independent events, and calculate conditional probabilities using tree diagrams or sample spaces.",
            "subject": "Mathematics",
            "group": 'Probability & Statistics 1',
            tags: [{ name: 'Topic 3', color: 'bg-orange-600' }]
          },
          {
            "id": "S1-CH4",
            "title": "Discrete Random Variables",
            "description": "Construct probability distribution tables for discrete random variables, calculate E(X) and Var(X). Use binomial and geometric distributions as models, applying formulas for expectation and variance.",
            "subject": "Mathematics",
            "group": 'Probability & Statistics 1',
            tags: [{ name: 'Topic 4', color: 'bg-orange-600' }]
          },
          {
            "id": "S1-CH5",
            "title": "The Normal Distribution",
            "description": "Model continuous data with the normal distribution, use tables to find probabilities, standardise variables, and apply the normal approximation to the binomial distribution with continuity correction.",
            "subject": "Mathematics",
            "group": 'Probability & Statistics 1',
            tags: [{ name: 'Topic 5', color: 'bg-orange-600' }]
          },
          { id: 'S1-revision', title: 'Probability & Statistics 1 Revision', description: 'Comprehensive revision of Probability & Statistics 1 to prepare for exams.', subject: 'Mathematics', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', tags: [{ name: 'Revision', color: 'bg-purple-600' }], group: 'Probability & Statistics 1' },



          { id: 'S2-CH1', title: 'The Poisson distribution', description: ' Learn to calculate probabilities using Po(m), understand mean = variance, model random events, and explore approximations to binomial and normal distributions.', subject: 'Mathematics', group: 'Probability & Statistics 2', tags: [{ name: 'Topic 1', color: 'bg-orange-600' }] },
          { id: 'S2-CH2', title: 'Linear combinations of random variables', description: 'Discover how to combine random variables, master expectation and variance rules, and understand when sums follow normal or Poisson distributions.', subject: 'Mathematics', group: 'Probability & Statistics 2', tags: [{ name: 'Topic 2', color: 'bg-orange-600' }] },
          { id: 'S2-CH3', title: 'Continuous random variables', description: 'Explore probability density functions, learn to calculate probabilities, and find mean, variance, median and percentiles.', subject: 'Mathematics', group: 'Probability & Statistics 2', tags: [{ name: 'Topic 3', color: 'bg-orange-600' }] },
          { id: 'S2-CH4', title: 'Sampling and estimation', description: 'Understand samples vs populations, discover the Central Limit Theorem, calculate unbiased estimates, and learn to determine confidence intervals for means and proportions', subject: 'Mathematics', group: 'Probability & Statistics 2', tags: [{ name: 'Topic 4', color: 'bg-orange-600' }] },
          { id: 'S2-CH5', title: 'Hypothesis tests', description: 'Master null and alternative hypotheses, conduct tests for binomial, Poisson and normal distributions, understand one/two-tailed tests, and explore Type I and Type II errors.', subject: 'Mathematics', group: 'Probability & Statistics 2', tags: [{ name: 'Topic 5', color: 'bg-orange-600' }] }


        ]
      },
      edexcel: {
        topics: [
          { id: 'chemistry-T1', title: 'Formulae, Equations and Amount of Substance', description: 'Understand chemical formulae, writing and balancing equations, and the mole concept for quantitative chemistry.', subject: 'Chemistry', group: 'U1' },
          { id: 'chemistry-T2', title: 'Atomic Structure and the Periodic Table', description: 'Explore atomic models, electronic structure, isotopes, and trends across the periodic table.', subject: 'Chemistry', group: 'U1' },
          { id: 'chemistry-T3', title: 'Bonding and Structure', description: 'Learn ionic, covalent and metallic bonding, molecular shapes, and how bonding relates to properties.', subject: 'Chemistry', group: 'U1' },
          { id: 'chemistry-T4', title: 'Introductory Organic Chemistry and Alkanes', description: 'Introduction to organic nomenclature, structure and properties of alkanes and simple reaction types.', subject: 'Chemistry', group: 'U1' },
          { id: 'chemistry-T5', title: 'Alkenes', description: 'Study structure, reactions and mechanisms of alkenes including addition reactions and polymerisation.', subject: 'Chemistry', group: 'U1' },

          { id: 'chemistry-Unit-1', title: 'Unit 1 Revision', description: 'Comprehensive revision of the first unit covering formulae, atomic structure, bonding and introductory organic chemistry.', subject: 'Chemistry', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', group: 'U1', tags: [{ name: 'Revision', color: 'bg-purple-600' }] },

          { id: 'chemistry-T6', title: 'Energetics', description: 'Covers energy changes in reactions, group trends, and the chemistry of halogenoalkanes and alcohols.', subject: 'Chemistry', group: 'U2' },
          { id: 'chemistry-T7', title: 'Intermolecular Forces', description: 'Examine van der Waals, dipole-dipole and hydrogen bonding and their effect on physical properties.', subject: 'Chemistry', group: 'U2' },
          { id: 'chemistry-T8', title: 'Redox Chemistry and Groups 1, 2 and 7', description: 'Learn oxidation states, redox reactions and the chemistry of key periodic groups.', subject: 'Chemistry', group: 'U2' },
          { id: 'chemistry-T9', title: 'Introduction to Kinetics and Equilibria', description: 'Understand reaction rates, collision theory and the principles of chemical equilibrium.', subject: 'Chemistry', group: 'U2' },
          { id: 'chemistry-T10', title: 'Organic Chemistry: Halogenoalkanes, Alcohols and Spectra', description: 'Explore reaction mechanisms, spectroscopic identification and the behaviour of halogenoalkanes and alcohols.', subject: 'Chemistry', group: 'U2' },

          { id: 'chemistry-Unit-2', title: 'Unit 2 Revision', description: 'Comprehensive revision of the second unit covering energetics, intermolecular forces, and redox chemistry.', subject: 'Chemistry', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', group: 'U2', tags: [{ name: 'Revision', color: 'bg-purple-600' }] },

          { id: 'chemistry-Unit-3', title: 'Unit 3 Practical Skills in Chemistry I', description: 'Third unit covering practical skills in chemistry.', subject: 'Chemistry', color: 'from-green-600 to-green-500 dark:from-green-700 dark:to-green-800', tags: [{ name: 'U3', color: 'bg-blue-900' }] },

          { id: 'chemistry-T11', title: 'Rates, Equilibria and Further Organic Chemistry', description: 'Advanced kinetics and equilibria topics plus extended organic chemistry concepts for A-level study.', subject: 'Chemistry', group: 'U4' },
          { id: 'chemistry-T12', title: 'Entropy and Energetics', description: 'Thermodynamics topics including enthalpy, entropy and spontaneity of reactions.', subject: 'Chemistry', group: 'U4' },
          { id: 'chemistry-T13', title: 'Chemical Equilibria', description: 'In-depth study of equilibrium constants, Le Chatelier\'s principle and calculations involving equilibria.', subject: 'Chemistry', group: 'U4' },
          { id: 'chemistry-T14', title: 'Acid-base Equilibria', description: 'Acid-base theories, pH calculations, buffers and titration curves for weak/strong acids and bases.', subject: 'Chemistry', group: 'U4' },
          { id: 'chemistry-T15', title: 'Organic Chemistry: Carbonyls, Carboxylic Acids and Chirality', description: 'Study carbonyl compounds, carboxylic acids, derivatives and stereochemistry.', subject: 'Chemistry', group: 'U4' },

          { id: 'chemistry-Unit-4', title: 'Unit 4 Revision', description: 'Comprehensive revision of the fourth unit covering acid-base equilibria, organic chemistry and transition metals.', subject: 'Chemistry', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', group: 'U4', tags: [{ name: 'Revision', color: 'bg-purple-600' }] },

          { id: 'chemistry-T16', title: 'Transition Metals and Organic Nitrogen Chemistry', description: 'Explore the chemistry of transition metals and nitrogen-containing organic molecules.', subject: 'Chemistry', group: 'U5' },
          { id: 'chemistry-T17', title: 'Transition Metals and their Chemistry', description: 'Key properties, complex formation and reactions of transition metals.', subject: 'Chemistry', group: 'U5' },
          { id: 'chemistry-T18', title: 'Organic Chemistry – Arenes', description: 'Aromatic chemistry including electrophilic substitution and properties of arenes.', subject: 'Chemistry', group: 'U5' },
          { id: 'chemistry-T19', title: 'Organic Nitrogen Compounds: Amines, Amides, Amino Acids and Proteins', description: 'Structure, properties and reactions of amines, amides and biologically relevant nitrogen compounds.', subject: 'Chemistry', group: 'U5' },
          { id: 'chemistry-T20', title: 'Organic Synthesis', description: 'Strategies and mechanisms for multi-step organic synthesis and functional group interconversions.', subject: 'Chemistry', group: 'U5' },

          { id: 'chemistry-Unit-5', title: 'Unit 5 Revision', description: 'Comprehensive revision of the fifth unit covering organic nitrogen compounds and synthesis.', subject: 'Chemistry', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', group: 'U5', tags: [{ name: 'Revision', color: 'bg-purple-600' }] },

          { id: 'chemistry-Unit-6', title: 'Unit 6 Practical Skills in Chemistry II', description: 'Sixth unit covering practical skills in chemistry.', subject: 'Chemistry', color: 'from-green-600 to-green-500 dark:from-green-700 dark:to-green-800', tags: [{ name: 'U6', color: 'bg-blue-900' }] },
          //------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


          { id: 'Physics-T1', title: 'Mechanics', description: 'Explore the principles of mechanics including motion, forces and energy.', subject: 'Physics', group: 'U1' },
          { id: 'Physics-T2', title: 'Materials', description: 'Understand Materials and their properties.', subject: 'Physics', group: 'U1' },
          { id: 'Physics-Unit-1', title: 'Unit 1 Revision', description: 'Revision ', subject: 'Physics', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', group: 'U1', tags: [{ name: 'Revision', color: 'bg-purple-600' }] },

          { id: 'Physics-T3', title: 'Waves and Particle Nature of Light', description: 'Understand wave properties, behaviour and applications.', subject: 'Physics', group: 'U2' },
          { id: 'Physics-T4', title: 'Electric Circuits', description: 'Learn about electric circuits, current, voltage, and resistance.', subject: 'Physics', group: 'U2' },

          { id: 'Physics-Unit-2', title: 'Unit 2 Revision', description: '', subject: 'Physics', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', group: 'U2', tags: [{ name: 'Revision', color: 'bg-purple-600' }] },
          { id: 'Physics-Unit-3', title: 'Unit 3 Practical Skills in Physics I', description: 'Practical skills in physics. (AS)', subject: 'Physics', color: 'from-green-600 to-green-500 dark:from-green-700 dark:to-green-800', tags: [{ name: 'U3', color: 'bg-blue-900' }] },

          { id: 'Physics-T5', title: 'Further Mechanics', description: 'Understand advanced mechanics concepts including circular motion, oscillations, and gravitation.', subject: 'Physics', group: 'U4' },
          { id: 'Physics-T6', title: 'Electric and Magnetic Fields', description: 'Explore electric and magnetic fields, forces, and electromagnetic induction.', subject: 'Physics', group: 'U4' },
          { id: 'Physics-T7', title: 'Nuclear and Particle Physics', description: 'Study the structure of the nucleus, radioactivity, and nuclear reactions.', subject: 'Physics', group: 'U4' },
          { id: 'Physics-Unit-4', title: 'Unit 4 Revision', description: '', subject: 'Physics', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', group: 'U4', tags: [{ name: 'Revision', color: 'bg-purple-600' }] },

          { id: 'Physics-T8', title: 'Thermodynamics', description: 'Understand the principles of thermal physics, including temperature, heat transfer, and the kinetic theory of gases.', subject: 'Physics', group: 'U5' },
          { id: 'Physics-T9', title: 'Nuclear Decay', description: 'Learn about different types of nuclear decay, half-life, and radioactive decay processes.', subject: 'Physics', group: 'U5' },
          { id: 'Physics-T10', title: 'Oscillations', description: 'Explore oscillatory motion, simple harmonic motion, and their applications.', subject: 'Physics', group: 'U5' },
          { id: 'Physics-T11', title: 'Astrophysics and Cosmology', description: 'Understand astrophysical phenomena and the structure and evolution of the universe.', subject: 'Physics', group: 'U5' },
          { id: 'Physics-Unit-5', title: 'Unit 5 Revision', description: '', subject: 'Physics', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', group: 'U5', tags: [{ name: 'Revision', color: 'bg-purple-600' }] },
          { id: 'Physics-Unit-6', title: 'Unit 6 Practical Skills in Physics II', description: 'Practical skills in physics. (A2)', subject: 'Physics', color: 'from-green-600 to-green-500 dark:from-green-700 dark:to-green-800', tags: [{ name: 'U6', color: 'bg-blue-900' }] },
          //------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

          { id: 'Biology-T1', title: 'Molecules, Transport and Health', description: 'Study biological molecules, transport systems in organisms, and factors affecting health.', subject: 'Biology', group: 'U1' },
          { id: 'Biology-T2', title: 'Membranes, Proteins, DNA and Gene Expression', description: 'Explore cell structure, function, and the mechanisms of cellular control and communication.', subject: 'Biology', group: 'U1' },

          { id: 'Biology-Unit-1', title: 'Unit 1 Revision', description: 'Comprehensive revision of the first unit covering biological molecules, diet, transport systems and health factors.', subject: 'Biology', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', group: 'U1', tags: [{ name: 'Revision', color: 'bg-purple-600' }] },

          { id: 'Biology-T3', title: 'Cell Structure, Reproduction and Development', description: 'Understand energy transfer in biological systems, homeostatic mechanisms, and ecological principles.', subject: 'Biology', group: 'U2' },
          { id: 'Biology-T4', title: 'Plant Structure and Function, Biodiversity', description: 'Learn about genetics, evolution, and the interactions within ecosystems.', subject: 'Biology', group: 'U2' },

          { id: 'Biology-Unit-2', title: 'Unit 2 Revision', description: 'Comprehensive revision of the second unit covering cell structure, development, biodiversity and conservation.', subject: 'Biology', color: 'from-purple-600 to-purple-500 dark:from-purple-700 dark:to-purple-800', group: 'U2', tags: [{ name: 'Revision', color: 'bg-purple-600' }] },

          { id: 'Biology-Unit-3', title: 'Unit 3 Practical Skills in Biology', description: 'Third unit covering practical skills in biology.', subject: 'Biology', color: 'from-green-600 to-green-500 dark:from-green-700 dark:to-green-800', tags: [{ name: 'U3', color: 'bg-blue-900' }] },

          { id: 'Biology-T5', title: 'Energy Flow, Ecosystems and the Environment', description: 'Understand energy transfer in biological systems, homeostatic mechanisms, and ecological principles.', subject: 'Biology', group: 'U4' },
          { id: 'Biology-T6', title: 'Microbiology, Immunity and Forensics', description: 'Learn about microbiology, immunity, and forensics in biological systems.', subject: 'Biology', group: 'U4' },



          { id: 'Biology-T7', title: 'Respiration, Muscles and the Internal Environment', description: 'Study genetics, evolution, and biodiversity in biological systems.', subject: 'Biology', group: 'U5' },
          { id: 'Biology-T8', title: 'Coordination, Response and Gene Technology', description: 'Understand human physiology, including the structure and function of organ systems.', subject: 'Biology', group: 'U5' },
          { id: 'Biology-Unit-6', title: 'Unit 6 Practical Skills in Biology', description: 'Sixth unit covering practical skills in biology.', subject: 'Biology', color: 'from-green-600 to-green-500 dark:from-green-700 dark:to-green-800', tags: [{ name: 'U6', color: 'bg-blue-900' }] },

          //------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
          { id: 'P1-Math-T1', title: 'Algebra and functions', description: 'Laws of indices, surds, quadratic functions, completing the square, solving equations/inequalities.', subject: 'Pure Mathematics', group: 'Pure 1' },
          { id: 'P1-Math-T2', title: 'Coordinate Geometry', description: 'Equations of straight lines, parallel/perpendicular conditions, and basic geometric interpretations in the (x,y) plane.', subject: 'Pure Mathematics', group: 'Pure 1' },
          { id: 'P1-Math-T3', title: 'Trigonometry', description: 'Sine and cosine rules, area of a triangle, radian measure, arc length & sector area, and graphs of sine, cosine, and tangent functions.', subject: 'Pure Mathematics', group: 'Pure 1' },
          { id: 'P1-Math-T4', title: 'Differentiation', description: 'Introduction to derivatives as gradient and rate of change; differentiation of polynomials; finding tangents and normals.', subject: 'Pure Mathematics', group: 'Pure 1' },
          { id: 'P1-Math-T5', title: 'Integration', description: 'Indefinite integration as reverse differentiation, integrating polynomials, and finding equations of curves from derivatives.', subject: 'Pure Mathematics', group: 'Pure 1' },

          { id: 'P2-Math-T1', title: 'Proof', description: 'Structure of mathematical proof, proof by exhaustion, and disproof by counterexample.', subject: 'Pure Mathematics', group: 'Pure 2' },
          { id: 'P2-Math-T2', title: 'Algebra and functions', description: 'Polynomial division, Factor Theorem, Remainder Theorem, and factorising cubics.', subject: 'Pure Mathematics', group: 'Pure 2' },
          { id: 'P2-Math-T3', title: 'Coordinate Geometry (Circles)', description: 'Equations of circles and circle properties (angle in a semicircle, chord bisection, radius‑tangent perpendicularity).', subject: 'Pure Mathematics', group: 'Pure 2' },
          { id: 'P2-Math-T4', title: 'Sequences and Series', description: 'Arithmetic and geometric sequences/series, sum formulas and Binomial expansion for positive integer powers.', subject: 'Pure Mathematics', group: 'Pure 2' },
          { id: 'P2-Math-T5', title: 'Exponentials and Logarithms', description: 'Graphs of exponential functions, laws of logarithms, and solving exponential equations.', subject: 'Pure Mathematics', group: 'Pure 2' },
          { id: 'P2-Math-T6', title: 'Trigonometry', description: 'Using identities and solving trigonometric equations in given intervals (e.g., tanθ = sinθ/cosθ, sin²+cos²=1).', subject: 'Pure Mathematics', group: 'Pure 2' },
          { id: 'P2-Math-T7', title: 'Differentiation', description: 'Finding maxima/minima, stationary points, and curve sketching.', subject: 'Pure Mathematics', group: 'Pure 2' },
          { id: 'P2-Math-T8', title: 'Integration', description: 'Definite integrals, area under a curve, area between curves, and the trapezium rule.', subject: 'Pure Mathematics', group: 'Pure 2' },

          { id: 'P3-Math-T1', title: 'Algebra and functions', description: "Simplification of rational expressions including factorising and cancelling, and algebraic division, and dealing with function, combinations like composition and inverses' range a .", subject: 'Pure Mathematics', group: 'Pure 3' },
          { id: 'P3-Math-T3', title: 'Trigonometry', description: ' Introduces sec, cosec, cot and their inverse functions. Solves equations using identities and compound angle formulas.', subject: 'Pure Mathematics', group: 'Pure 3' },
          { id: 'P3-Math-T4', title: 'Exponentials and Logarithms', description: 'Focus on e^x and ln⁡x. Solves related equations and uses log graphs to find parameters in models like y=ax^n.', subject: 'Pure Mathematics', group: 'Pure 3' },
          { id: 'P3-Math-T5', title: 'Differentiation', description: 'Rules for differentiating e^kx, ln⁡kx, sin⁡kx, etc., using product, quotient, and chain rules. Applies to exponential growth/decay.', subject: 'Pure Mathematics', group: 'Pure 3' },
          { id: 'P3-Math-T6', title: 'Integration', description: 'Integrating e^kx, 1/x, trig functions. Uses recognition and identities (e.g., ∫f′(x)/f(x)dx = ln⁡∣f(x)∣+c).', subject: 'Pure Mathematics', group: 'Pure 3' },
          { id: 'P3-Math-T7', title: 'Numerical Methods', description: 'Finding roots by sign change and using given iterative formulas xn+1=f(xn) for approximate solutions.', subject: 'Pure Mathematics', group: 'Pure 3' },

          { id: 'P4-Math-T1', title: 'Proof by Contradiction', description: 'Proof by contradiction including classic examples (e.g., irrationality of √2, infinity of primes).', subject: 'Pure Mathematics', group: 'Pure 4' },
          { id: 'P4-Math-T2', title: 'Algebra and functions (Partial Fractions)', description: 'Decomposing rational functions into partial fractions with linear denominators.', subject: 'Pure Mathematics', group: 'Pure 4' },
          { id: 'P4-Math-T3', title: 'Coordinate Geometry (Parametric)', description: 'Converting between Cartesian and parametric forms of curves and analysing parametric motion.', subject: 'Pure Mathematics', group: 'Pure 4' },
          { id: 'P4-Math-T4', title: 'Binomial Expansion (any rational n)', description: 'Binomial series for integer and certain rational n; expanding expressions like (ax + b)^n.', subject: 'Pure Mathematics', group: 'Pure 4' },
          { id: 'P4-Math-T5', title: 'Differentiation (Implicit & Parametric)', description: 'Differentiating implicitly and parametrically defined functions; forming simple differential equations.', subject: 'Pure Mathematics', group: 'Pure 4' },
          { id: 'P4-Math-T6', title: 'Integration (Advanced Methods)', description: 'Volume of revolution, integration by substitution & parts, partial fraction integration, separable differential equations, and parametric curve areas.', subject: 'Pure Mathematics', group: 'Pure 4' },
          { id: 'P4-Math-T7', title: 'Vectors', description: 'Vectors in 2D & 3D: magnitude, scalar product, equations of lines, and angles between vectors.', subject: 'Pure Mathematics', group: 'Pure 4' },




        ]
      }
    }
  }
};

/**
 * Look up topic metadata by ID from curriculum data
 * Returns null if topic not found
 */
export function getTopicMetadata(topicId: string): { title: string; description: string; subject: string; curriculum: string; color?: string; group?: string; tags?: Tag[] } | null {
  // Search through all curriculum levels and boards
  for (const [curriculumKey, curriculum] of Object.entries(curriculumData)) {
    for (const boardData of Object.values(curriculum.boards)) {
      const topic = boardData.topics.find(t => t.id === topicId);
      if (topic) {
        // Normalize curriculum name: 'a-level' -> 'A-Level', 'igcse' -> 'IGCSE'
        const curriculumName = curriculumKey === 'a-level' ? 'A-Level' : curriculumKey.toUpperCase();
        return {
          title: topic.title,
          description: topic.description,
          subject: topic.subject,
          curriculum: curriculumName,
          color: topic.color,
          group: topic.group,
          tags: topic.tags
        };
      }
    }
  }
  return null;
}

/**
 * Generate a URL slug for a topic, including the group if present
 */
export function getTopicSlug(topic: { title: string; group?: string }): string {
  const baseSlug = slugify(topic.title);
  if (topic.group) {
    return `${baseSlug}-(${slugify(topic.group)})`;
  }
  return baseSlug;
}

/**
 * Get all available levels (IGCSE, A-Level, etc.)
 */
export function getAvailableLevels(): string[] {
  return Object.keys(curriculumData).map(key => {
    const level = curriculumData[key];
    return level.title; // e.g., "IGCSE", "A-Level"
  });
}

/**
 * Get available boards for a specific level
 */
export function getAvailableBoardsForLevel(levelTitle: string): { id: BoardKey; name: string }[] {
  // Find the curriculum that matches the level title
  const curriculumKey = Object.entries(curriculumData).find(
    ([, curriculum]) => curriculum.title === levelTitle
  )?.[0];

  if (!curriculumKey) return [];

  const curriculum = curriculumData[curriculumKey as keyof typeof curriculumData];

  // Map board keys to friendly names
  const boardNames: Record<BoardKey, string> = {
    cambridge: 'Cambridge',
    edexcel: 'Edexcel'
  };

  return Object.keys(curriculum.boards).map(boardKey => ({
    id: boardKey as BoardKey,
    name: boardNames[boardKey as BoardKey] || boardKey
  }));
}

/**
 * Get available subjects for a specific level and board
 */
export function getAvailableSubjectsForLevelAndBoard(
  levelTitle: string,
  boardId: BoardKey
): string[] {
  // Find the curriculum that matches the level title
  const curriculumKey = Object.entries(curriculumData).find(
    ([, curriculum]) => curriculum.title === levelTitle
  )?.[0];

  if (!curriculumKey) return [];

  const curriculum = curriculumData[curriculumKey as keyof typeof curriculumData];
  const boardTopics = curriculum.boards[boardId]?.topics || [];

  // Extract unique subjects from topics
  const uniqueSubjects = new Set<string>();
  boardTopics.forEach(topic => {
    uniqueSubjects.add(topic.subject);
  });

  // Sort alphabetically for consistency
  return Array.from(uniqueSubjects).sort();
}

