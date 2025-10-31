import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Play, FileText, Trophy, ArrowLeft } from 'lucide-react';
import { useUser } from '../context/UserContext';
import slugify from '../utils/slugify';
import VideoPlayer from '../components/VideoPlayer';
import Resources from '../components/Resources';
import Quiz from '../components/Quiz';
import { title, video } from 'framer-motion/client';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { y: 12, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.45 } }
};

// Clean, deduplicated topic data (chemistry T1..T20 + a test quiz)
const topicData = {
  'test-quiz': {
    title: 'Test Quiz',
    subject: 'General',
    curriculum: 'A-Level',
    description: 'A small test quiz demonstrating multi-part and written questions.',
    videos: [],
    resources: [],
    quizzes: [
      {
        id: 'demo-1',
        title: 'Demo Multi-Part Quiz',
        questions: [
          {
            id: 'mq1',
            parts: [
              { id: 'mq1-p1', type: 'mcq' as const, question: 'What is 2 + 2?', options: ['3', '4', '5'], correctAnswer: 1, explanation: '2 + 2 = 4.' },
              { id: 'mq1-p2', type: 'written' as const, question: 'Explain in one sentence why 2+2 equals 4.', explanation: 'Because adding two and two counts four units.' }
            ]
          }
        ]
      }
    ]
  },
  'biology-1': {
    title: 'Characteristics and Classifications of living organisms',
    subject: 'Biology',
    curriculum: 'igcse',
    description: 'Explore the characteristics and classifications of living organisms, including the five kingdoms and their features.',
    videos: [],
    resources: [ { id: 'r1', title: 'Characteristics and Classifications Notes', url: '/documents/Biology/Chapter 1.pdf' } ],
    quizzes: []
  },
  'biology-4': {
    title: 'Biological Molecules',
    subject: 'Biology',
    curriculum: 'igcse',
    description: 'Discover the key biological molecules, including carbohydrates, proteins, lipids. And testing for them.',
    videos: [],
    resources: [ { id: 'r1', title: 'Biological Molecules Notes', url: '/documents/Biology/Chapter 4.pdf' } ],
    quizzes: []
  },
  'biology-5': {
    title: 'Enzymes',
    subject: 'Biology',
    curriculum: 'igcse',
    description: 'Explore the role of enzymes in biological processes, including their structure, function, and factors affecting enzyme activity.',
    videos: [],
    resources: [ { id: 'r1', title: 'Enzymes Notes', url: '/documents/Biology/Chapter 5.pdf' } ],
    quizzes: []
  },
  'biology-6': {
    title: 'Plant Nutrition',
    subject: 'Biology',
    curriculum: 'igcse',
    description: 'Investigate the process of photosynthesis and the factors affecting plant growth and nutrition.',
    videos: [],
    resources: [ { id: 'r1', title: 'Plant Nutrition Notes', url: '/documents/Biology/Chapter 6.pdf' } ],
    quizzes: []
  },
  'biology-7': {
    title: 'Human Nutrition',
    subject: 'Biology',
    curriculum: 'igcse',
    description: 'Explore the principles of human nutrition, including the digestive system and dietary requirements.',
    videos: [],
    resources: [ { id: 'r1', title: 'Human Nutrition Notes', url: '/documents/Biology/Chapter 7.pdf' } ],
    quizzes: []
  },
  'biology-8': {
    title: 'Transport in Plants',
    subject: 'Biology',
    curriculum: 'igcse',
    description: 'Explore the process of transport in plants, including xylem and phloem.',
    videos: [],
    resources: [ { id: 'r1', title: 'Transport in Plants Notes', url: '/documents/Biology/Chapter 8.pdf' } ],
    quizzes: []
  },
  'biology-9': {
    title: 'Transport in Animals',
    subject: 'Biology',
    curriculum: 'igcse',
    description: 'Explore the process of transport in animals, including the circulatory system.',
    videos: [],
    resources: [ { id: 'r1', title: 'Transport in Animals Notes', url: '/documents/Biology/Chapter 9.pdf' } ],
    quizzes: []
  },
    'biology-11': {
    title: 'Gas Exchange in Animals',
    subject: 'Biology',
    curriculum: 'igcse',
    description: 'Understand the mechanisms of gas exchange in animals, focusing on the human respiratory system.',
    videos: [],
    resources: [ { id: 'r1', title: 'Gas Exchange in Animals Notes', url: '/documents/Biology/Chapter 11.pdf' } ],
    quizzes: []
  },
    'biology-12': {
    title: 'Respiration',
    subject: 'Biology',
    curriculum: 'igcse',
    description: 'Understand the process of cellular respiration, including aerobic and anaerobic respiration and energy production.',
    videos: [],
    resources: [ { id: 'r1', title: 'Respiration Notes', url: '/documents/Biology/Chapter 12.pdf' } ],
    quizzes: []
  },
   'biology-14': {
    title: 'Coordination and Response',
    subject: 'Biology',
    curriculum: 'igcse',
    description: 'Study the nervous and hormonal systems in humans and plants, including responses to stimuli and homeostasis.',
    videos: [],
    resources: [ { id: 'r1', title: 'Coordination and Response Notes', url: '/documents/Biology/Chapter 14.pdf' } ],
    quizzes: []
  },
     'biology-16': {
    title: 'Reproduction',
    subject: 'Biology',
    curriculum: 'igcse',
    description: 'Explore the reproductive systems in humans and plants, including sexual and asexual reproduction.',
    videos: [],
    resources: [ { id: 'r1', title: 'Reproduction Notes', url: '/documents/Biology/Chapter 16.pdf' } ],
    quizzes: []
  },
   'biology-17': {
    title: 'Inheritance',
    subject: 'Biology',
    curriculum: 'igcse',
    description: 'Understand the principles of inheritance, including genes, chromosomes, and patterns of inheritance.',
    videos: [],
    resources: [ { id: 'r1', title: 'Inheritance Notes', url: '/documents/Biology/Chapter 17.pdf' } ],
    quizzes: []
  },
   'biology-18': {
    title: 'Variation and Selection',
    subject: 'Biology',
    curriculum: 'igcse',
    description: 'Study the mechanisms of variation and natural selection in populations.',
    videos: [],
    resources: [ { id: 'r1', title: 'Variation and Selection Notes', url: '/documents/Biology/Chapter 18.pdf' } ],
    quizzes: []
  },
   'biology-19': {
    title: 'Organisms and their Environment',
    subject: 'Biology',
    curriculum: 'igcse',
    description: 'Study the interactions between organisms and their environment, including ecosystems and biodiversity.',
    videos: [],
    resources: [ { id: 'r1', title: 'Organisms and their Environment Notes', url: '/documents/Biology/Chapter 19.pdf' } ],
    quizzes: []
  },
   'biology-20': {
    title: 'Human Influences on Ecosystems',
    subject: 'Biology',
    curriculum: 'igcse',
    description: 'Study the impact of human activities on ecosystems, including pollution, deforestation, and conservation efforts.',
    videos: [],
    resources: [ { id: 'r1', title: 'Human Influences on Ecosystems Notes', url: '/documents/Biology/Chapter 20.pdf' } ],
    quizzes: []
  },







//------------------------------------------------------------------------------------------------------------------------------------------------------------




  'chemistry-4':{
    title: 'Electrochemistry',
    subject: 'Chemistry',
    curriculum: 'igcse',
    description: 'Explore the principles of electrochemistry, including redox reactions and Hydrogen fuel cells.',
    videos: [],
    resources: [ { id: 'r1', title: 'Electrochemistry Notes(@PISANG)', url: 'https://drive.google.com/file/d/13hqvb_BRTV5BRebRko5wwTRJ0BBhS2v6/preview' } ],
    quizzes: [{
        id: 'demo-1',
        title: 'Demo Multi-Part Quiz',
        questions: [
          {
            id: 'mq1',
            parts: [
              { id: 'mq1-p1', type: 'mcq' as const, question: 'What is 2 + 2?', options: ['3', '4', '5'], correctAnswer: 1, explanation: '2 + 2 = 4.' },
              { id: 'mq1-p2', type: 'written' as const, question: 'Explain in one sentence why 2+2 equals 4.', explanation: 'Because adding two and two counts four units.' }
            ]
          }
        ]
      }]
  },


    'chemistry-5':{
    title: 'Chemical energetics',
    subject: 'Chemistry',
    curriculum: 'igcse',
    description: 'Explore the principles of chemical energetics, including enthalpy changes and reaction spontaneity.',
    videos: [],
    resources: [ { id: 'r1', title: 'Chemical energetics Notes(@PISANG)', url: 'https://drive.google.com/file/d/1C_FxrnxnykI-CW3Z348OklCx-546O2zB/preview' } ],
    quizzes: []
  },


    'chemistry-6':{
    title: 'Chemical reactions',
    subject: 'Chemistry',
    curriculum: 'igcse',
    description: 'Explore the principles of chemical reactions, including redox reactions and Hydrogen fuel cells.',
    videos: [],
    resources: [ { id: 'r1', title: 'Chemical reaction Notes(@PISANG)', url: 'https://drive.google.com/file/d/1OyjsL-pn6BCJ2LDx9T8VihsO3gr6haYV/preview' } ],
    quizzes: []
  },

    'chemistry-7':{
    title: 'Acids, bases and salts',
    subject: 'Chemistry',
    curriculum: 'igcse',
    description: 'Explore the principles of acids, bases and salts, including pH, neutralization and titration.',
    videos: [],
    resources: [ { id: 'r1', title: 'Acid bases and salts Notes(@PISANG)', url: 'https://drive.google.com/file/d/1U5np9rc80ENHPVT_venD-wmLmr2ljXXl/preview' } ],
    quizzes: []
  },




    'chemistry-9':{
    title: 'metals',
    subject: 'Chemistry',
    curriculum: 'igcse',
    description: 'Explore the principles of metals, including reactivity series and extraction methods.',
    videos: [],
    resources: [ { id: 'r1', title: 'Metals Notes(@PISANG)', url: 'https://drive.google.com/file/d/1rBJQynX7n5yJpI0naU7gLOEaSvRUxyui/preview' } ],
    quizzes: []
  },



    'chemistry-10':{
    title: 'Chemistry of the environment',
    subject: 'Chemistry',
    curriculum: 'igcse',
    description: 'Explore the principles of air and water, including composition, pollution and treatment methods.',
    videos: [],
    resources: [ { id: 'r1', title: 'Chemistry of the environment Notes(@PISANG)', url: 'https://drive.google.com/file/d/1lYJ-8Z9xC7S729FpZYvoV09lwlJVKOaJ/preview?usp=sharing' } ],
    quizzes: []
  },

  'chemistry-11':{
    title: 'Organic chemistry',
    subject: 'Chemistry',
    curriculum: 'igcse',
    description: 'Explore the principles of organic chemistry, including hydrocarbons, polymers and fuels.',
    videos: [],
    resources: [ { id: 'r1', title: 'Organic chemistry Notes(@PISANG)', url: 'https://drive.google.com/file/d/1QFz0lRao_bjKbQG-EPtxT_jKMwXZCNp3/preview?usp=sharing' } ],
    quizzes: []
  },
  // Chemistry topics T1..T5 (U1)
  
//------------------------------------------------------------------------------------------------------------------------------------------------------------
  
  
  'chemistry-CH1':{
    title:"Atomic Structure",
    subject:"Chemistry",
    curriculum:'A-level',
    description:"Understand atomic models, electronic structure, isotopes, and trends across the periodic table.",
    videos:[],
    resources:[ { id: 'r1', title: 'Atomic Structure Notes(@Mockingbird)', url: 'https://file.notion.so/f/f/a3bdaf06-9fde-4f9d-9d4b-f367fea3e603/750ac319-e07a-40b2-9a84-76d8c38d7dfe/Unit_1.pdf?table=block&id=4290d01e-3ab7-4389-8b26-f2db5007565b&spaceId=a3bdaf06-9fde-4f9d-9d4b-f367fea3e603&expirationTimestamp=1761969600000&signature=7zCjCLRsrtNi8bWVFfG6rSdsirUaksdbH9AQgVrcyiU&downloadName=Unit+1.pdf' } ],
    quizzes:[]
  },
  'chemistry-CH2':{
    title:"Atoms, molecules and stoichiometry",
    subject:"Chemistry",
    curriculum:'A-level',
    description:"Understand the concepts of atoms, molecules, and stoichiometry in chemical reactions.",
    videos:[],
    resources:[{id:'r1', title:'Atom, molecules and stiochimetry', url:'https://file.notion.so/f/f/a3bdaf06-9fde-4f9d-9d4b-f367fea3e603/5023e2b2-a58f-4e13-9d7e-bd0711158aee/Unit_2.pdf?table=block&id=6bcc9c2b-54e0-4c51-87dc-605cfc968293&spaceId=a3bdaf06-9fde-4f9d-9d4b-f367fea3e603&expirationTimestamp=1761969600000&signature=JdFa92agDCKDAaJY83TkiromhLXUHoIIQwfQ7rzpMdk&downloadName=Unit+2.pdf'}],
    quizzes:[]
  },
  'chemistry-CH3':{
    title:"Chemical bonding",
    subject:"Chemistry",
    curriculum:'A-level',
    description:"Explore the different types of chemical bonds, including ionic, covalent, and metallic bonds, and their properties.",
    videos:[],
    resources:[ { id: 'r1', title: 'Chemical bonding Notes(@Mockingbird)', url: 'https://file.notion.so/f/f/a3bdaf06-9fde-4f9d-9d4b-f367fea3e603/04808dee-e873-44a6-98af-4b2add85c77c/Unit_3.pdf?table=block&id=1c5d58d4-06b3-4787-96f7-554db1117728&spaceId=a3bdaf06-9fde-4f9d-9d4b-f367fea3e603&expirationTimestamp=1761969600000&signature=vtMuoSp5aUGZDiyu7Qe-UqCmneZjHuljzNufCQV_ecs&downloadName=Unit+3.pdf' } ],
    quizzes:[]
  },
  'chemistry-CH4':{
    title:"States of matter",
    subject:"Chemistry",
    curriculum:'A-level',
    description:"Understand the properties of solids, liquids, and gases, and the changes between these states.",
    videos:[],
    resources:[ { id: 'r1', title: 'States of Matter Notes(@Mockingbird)', url: 'https://file.notion.so/f/f/a3bdaf06-9fde-4f9d-9d4b-f367fea3e603/a7006b43-059d-4a1e-9f9c-d50ecf5e7a07/Unit_4.pdf?table=block&id=0e921126-0501-4d47-b858-752b632fce2c&spaceId=a3bdaf06-9fde-4f9d-9d4b-f367fea3e603&expirationTimestamp=1761969600000&signature=C--B2xvYIk35sLTMnQ2YRSVF4NSsDVHxwiJEmXEsKWA&downloadName=Unit+4.pdf' } ],
    quizzes:[]
  },
  'chemistry-CH5':{
    title:"Chemical energetics",
    subject:"Chemistry",
    curriculum:'A-level',
    description:"Learn about energy changes in chemical reactions, including exothermic and endothermic processes.",
    videos:[],
    resources:[ { id: 'r1', title: 'Chemical Energetics Notes(@Mockingbird)', url: 'https://file.notion.so/f/f/a3bdaf06-9fde-4f9d-9d4b-f367fea3e603/e86ac5ff-8555-46e3-82c2-72034986d288/Unit_5.pdf?table=block&id=a65f6f7a-c658-47a1-9657-353c4c3da2ab&spaceId=a3bdaf06-9fde-4f9d-9d4b-f367fea3e603&expirationTimestamp=1761969600000&signature=u3NXem3wizjQZKbCrJkibDUGQMB-Ug7Aha7Is7Miv-w&downloadName=Unit+5.pdf' } ],
    quizzes:[]
  },
  'chemistry-CH6':{
    title:"Electrochemistry",
    subject:"Chemistry",
    curriculum:'A-level',
    description:"Study the principles of electrochemistry, including redox reactions, electrochemical cells, and applications in industry.",
    videos:[],
    resources:[ { id: 'r1', title: 'Atomic Structure Notes(@Mockingbird)', url: 'https://file.notion.so/f/f/a3bdaf06-9fde-4f9d-9d4b-f367fea3e603/e0d0fa15-8992-45d4-b770-55413f421dfb/Unit_6.pdf?table=block&id=a610d318-e58a-43b5-a73c-56943af0b194&spaceId=a3bdaf06-9fde-4f9d-9d4b-f367fea3e603&expirationTimestamp=1761969600000&signature=cO_Atly5eZhOaUbBx0662NJIoTHvTHkMYDz1fQDILGQ&downloadName=Unit+6.pdf' } ],
    quizzes:[]
  },
  'chemistry-CH8':{
    title:"Reaction kinetics",
    subject:"Chemistry",
    curriculum:'A-level',
    description:"Understand reaction rates, collision theory, and the factors affecting reaction rates.",
    videos:[],
    resources:[ { id: 'r1', title: 'Atomic Structure Notes(@Mockingbird)', url: 'https://file.notion.so/f/f/a3bdaf06-9fde-4f9d-9d4b-f367fea3e603/7004c5e0-fb6f-4945-88c4-bb0f9cc68be4/Unit_8.pdf?table=block&id=036448e3-1514-4463-9e7c-29e43e37bf42&spaceId=a3bdaf06-9fde-4f9d-9d4b-f367fea3e603&expirationTimestamp=1761969600000&signature=nyg9cmYjvYId2tK2Szt2sAXET6x_eZlhNcfq3gjr204&downloadName=Unit+8.pdf' } ],
    quizzes:[]
  },
  'chemistry-CH9':{
    title:"The Periodic Table: chemical periodicity",
    subject:"Chemistry",
    curriculum:'A-level',
    description:"Explore the trends and patterns in the periodic table, including atomic radius, ionization energy, and electronegativity.",
    videos:[],
    resources:[ { id: 'r1', title: 'Atomic Structure Notes(@Mockingbird)', url: 'https://file.notion.so/f/f/a3bdaf06-9fde-4f9d-9d4b-f367fea3e603/876015dd-6486-490f-8c99-e400003d3b3f/Unit_9.pdf?table=block&id=b56e42a4-6ffa-4a79-8f4e-cf1975432978&spaceId=a3bdaf06-9fde-4f9d-9d4b-f367fea3e603&expirationTimestamp=1761969600000&signature=ZOoxcplaXEUuJVcnRuNhjSGl4kCP3SmbwfRwt33aBPY&downloadName=Unit+9.pdf' } ],
    quizzes:[]
  },
  
  
  
  'chemistry-T1': {
    title: 'Formulae, Equations and Amount of Substance (U1)',
    subject: 'Chemistry',
    curriculum: 'A-Level',
    description: 'Understand chemical formulae, writing and balancing equations, and the mole concept for quantitative chemistry.',
    videos: [],
    resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U1 topic 1 Self-Study booklet(@Aeth_en).pdf' , description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' } ],
    quizzes: []
  },
  'chemistry-T2': {
    title: 'Atomic Structure and the Periodic Table (U1)',
    subject: 'Chemistry',
    curriculum: 'A-Level',
    description: 'Explore atomic models, electronic structure, isotopes, and trends across the periodic table.',
    videos: [],
    resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U1 topic 2 Self-Study booklet(@Aeth_en).pdf' , description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' },
    { id: 'r2', title: 'Atomic Structure Notes(HAF)', url: '/documents/Atomic Structure and the Periodic Table (HAF).pdf' },
    ],
    
    
    quizzes: []
  },
  'chemistry-T3': {
    title: 'Bonding and Structure (U1)',
    subject: 'Chemistry',
    curriculum: 'A-Level',
    description: 'Learn ionic, covalent and metallic bonding, molecular shapes, and how bonding relates to properties.',
    videos: [],
    resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U1 topic 3 Self-Study booklet(@Aeth_en).pdf' , description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.'} ],
    quizzes: []
  },
  'chemistry-T4': {
    title: 'Introductory Organic Chemistry and Alkanes (U1)',
    subject: 'Chemistry',
    curriculum: 'A-Level',
    description: 'Introduction to organic nomenclature, structure and properties of alkanes and simple reaction types.',
    videos: [],
    resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U1 topic 4 Self-Study booklet(@Aeth_en).pdf' } ],
    quizzes: []
  },
  'chemistry-T5': {
    title: 'Alkenes (U1)',
    subject: 'Chemistry',
    curriculum: 'A-Level',
    description: 'Study structure, reactions and mechanisms of alkenes including addition reactions and polymerisation.',
    videos: [],
    resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U1 topic 5 Self-Study booklet(@Aeth_en).pdf' } ],
    quizzes: []
  },

  // Chemistry topics T6..T10 (U2)
  'chemistry-T6': { title: 'Energetics, Group Chemistry, Halogenoalkanes and Alcohols (U2)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Covers energy changes in reactions, group trends, and the chemistry of halogenoalkanes and alcohols.', videos: [], resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U2 topic 6 Self-Study booklet(@Aeth_en).pdf' , description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' } ], quizzes: [] },
  'chemistry-T7': { title: 'Intermolecular Forces (U2)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Examine van der Waals, dipole-dipole and hydrogen bonding and their effect on physical properties.', videos: [], resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U2 topic 7 Self-Study booklet(@Aeth_en).pdf' , description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' } ], quizzes: [] },
  'chemistry-T8': { title: 'Redox Chemistry and Groups 1, 2 and 7 (U2)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Learn oxidation states, redox reactions and the chemistry of key periodic groups.', videos: [], resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U2 topic 8 Self-Study booklet(@Aeth_en).pdf' , description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' } ], quizzes: [] },
  'chemistry-T9': { title: 'Introduction to Kinetics and Equilibria (U2)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Understand reaction rates, collision theory and the principles of chemical equilibrium.', videos: [], resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U2 topic 9 Self-Study booklet(@Aeth_en).pdf' , description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' } ], quizzes: [] },
  'chemistry-T10': { title: 'Organic Chemistry: Halogenoalkanes, Alcohols and Spectra (U2)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Explore reaction mechanisms, spectroscopic identification and the behaviour of halogenoalkanes and alcohols.', videos: [], resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U2 topic 10 Self-Study booklet(@Aeth_en).pdf' , description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' } ], quizzes: [] },

  // Chemistry topics T11..T15 (U4)
  'chemistry-T11': { title: 'Rates, Equilibria and Further Organic Chemistry (U4)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Advanced kinetics and equilibria topics plus extended organic chemistry concepts for A-level study.', videos: [], resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U4 topic 11 Self-Study booklet(@Aeth_en).pdf' , description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' } ], quizzes: [] },
  'chemistry-T12': { title: 'Entropy and Energetics (U4)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Thermodynamics topics including enthalpy, entropy and spontaneity of reactions.', videos: [], resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U4 topic 12 Self-Study booklet(@Aeth_en).pdf' , description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' } ], quizzes: [] },
  'chemistry-T13': { title: 'Chemical Equilibria (U4)', subject: 'Chemistry', curriculum: 'A-Level', description: 'In-depth study of equilibrium constants, Le Chatelier’s principle and calculations involving equilibria.', videos: [], resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U4 topic 13 Self-Study booklet(@Aeth_en).pdf' , description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' } ], quizzes: [] },
  'chemistry-T14': { title: 'Acid-base Equilibria (U4)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Acid-base theories, pH calculations, buffers and titration curves for weak/strong acids and bases.', videos: [], resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U4 topic 14 Self-Study booklet(@Aeth_en).pdf' , description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' } ], quizzes: [] },
  'chemistry-T15': { title: 'Organic Chemistry: Carbonyls, Carboxylic Acids and Chirality (U4)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Study carbonyl compounds, carboxylic acids, derivatives and stereochemistry.', videos: [], resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U4 topic 15 Self-Study booklet(@Aeth_en).pdf' , description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' } ], quizzes: [] },

  // Chemistry topics T16..T20 (U5)
  'chemistry-T16': { title: 'Transition Metals and Organic Nitrogen Chemistry (U5)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Explore the chemistry of transition metals and nitrogen-containing organic molecules.', videos: [], resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U5 topic 16 Self-Study booklet(@Aeth_en).pdf' , description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.' } ], quizzes: [] },
  'chemistry-T17': { title: 'Transition Metals and their Chemistry (U5)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Key properties, complex formation and reactions of transition metals.', videos: [], resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U5 topic 17 Self-Study booklet(@Aeth_en).pdf' ,  description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.'} ], quizzes: [] },
  'chemistry-T18': { title: 'Organic Chemistry – Arenes (U5)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Aromatic chemistry including electrophilic substitution and properties of arenes.', videos: [], resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U5 topic 18 Self-Study booklet(@Aeth_en).pdf' ,  description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.'} ], quizzes: [] },
  'chemistry-T19': { title: 'Organic Nitrogen Compounds: Amines, Amides, Amino Acids and Proteins (U5)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Structure, properties and reactions of amines, amides and biologically relevant nitrogen compounds.', videos: [], resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U5 topic 19 Self-Study booklet(@Aeth_en).pdf' , description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.'} ], quizzes: [] },
  'chemistry-T20': { title: 'Organic Synthesis (U5)', subject: 'Chemistry', curriculum: 'A-Level', description: 'Strategies and mechanisms for multi-step organic synthesis and functional group interconversions.', videos: [], resources: [ { id: 'r1', title: 'Self-Study booklet(@Aeth_en)', url: '/documents/IAL Chemistry U5 topic 20 Self-Study booklet(@Aeth_en).pdf' , description: 'Visit "https://drive.google.com/drive/folders/1EyhEUz6ZcmHwnyETDSSuwlSU010HTBj7" for original document.'} ], quizzes: [] },



  'biology-CH1': {
    title: 'Cell Structure',
    subject: 'Biology',
    curriculum: 'A-Level',
    description: 'Explore the detailed structure and function of eukaryotic and prokaryotic cells, including organelles and microscopy techniques.',
    videos: [],
    resources: [
      { id: 'r1', title: 'Cell structure Notes(@PISANG)', url: 'https://drive.google.com/file/d/1LJHwU2WvNtj-__T8awP2Iju4lacei5Ms/preview', description: '' }
    ],
    quizzes: []
  },
  'biology-CH2': {
    title: 'Biological Molecules',
    subject: 'Biology',
    curriculum: 'A-Level',
    description: 'Dive into the chemistry of biological molecules such as carbohydrates, proteins, lipids, and nucleic acids, and their roles in cellular functions.',
    videos: [],
    resources: [
      { id: 'r1', title: 'Biological Molecules Notes(@PISANG)', url: 'https://drive.google.com/file/d/1n_WajVfs6NWUSk07Pd1GXxBRFqxfRMKa/preview', description: '' }
    ],
    quizzes: []
  },
  'biology-CH3': {
    title: 'Enzymes',
    subject: 'Biology',
    curriculum: 'A-Level',
    description: 'Understand enzyme structure, function, kinetics, and factors affecting enzyme activity in biological systems.',
    videos: [],
    resources: [
      { id: 'r1', title: 'Enzymes Notes(@PISANG)', url: 'https://drive.google.com/file/d/1f-8rckyEYRQAUkxlitwPyF4NGUOtXe6P/preview', description: '' }
    ],
    quizzes: []
  },
  'biology-CH4': {
    title: 'Cell Membranes and Transport',
    subject: 'Biology',
    curriculum: 'A-Level',
    description: 'Examine the structure of cell membranes and the mechanisms of substance transport across membranes.',
    videos: [],
    resources: [
      { id: 'r1', title: 'Cell Membranes and Transport Notes(@PISANG)', url: 'https://drive.google.com/file/d/143n4n7gTZnCJmmDzl1VrxBd-WlSdW9GF/preview', description: '' }
    ],
    quizzes: []
  },
  'biology-CH5': {
    title: 'The Mitotic Cell Cycle',
    subject: 'Biology',
    curriculum: 'A-Level',
    description: 'Learn about the stages of the cell cycle, including interphase and mitosis, and the regulation of cell division.',
    videos: [],
    resources: [
      { id: 'r1', title: 'The Mitotic Cell Cycle Notes(@PISANG)', url: 'https://drive.google.com/file/d/1UYvzrVOlup3e05PVSdyErc6DM3wKy2u9/preview', description: '' }
    ],
    quizzes: []
  },


  
};
const TopicPage: React.FC = () => {
  // route is /curriculum/:type/:board/:subject/:title
  const { title: titleParam } = useParams<{ title?: string }>();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'videos' | 'resources' | 'quiz'>('resources');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  // Persistent checkmark state for videos/resources
  const [doneVideos, setDoneVideos] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('doneVideos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem('doneVideos', JSON.stringify(doneVideos));
  }, [doneVideos]);

  const [doneResources, setDoneResources] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('doneResources');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem('doneResources', JSON.stringify(doneResources));
  }, [doneResources]);

  // Resolve topic by param. Links use slugified titles (kebab-case). Support direct id keys too.
  const slug = titleParam ? decodeURIComponent(titleParam) : '';
  let topicKey: string | undefined;
  if (slug && (topicData as any)[slug]) {
    topicKey = slug; // someone linked by internal id
  }
  if (!topicKey && slug) {
    topicKey = Object.keys(topicData).find((k) => {
      const t = (topicData as any)[k];
      return slugify(t.title) === slug;
    });
  }
  const topic = topicKey ? (topicData as any)[topicKey] : null;
  const quizzes = topic?.quizzes || [];
  const progress = topicKey ? user?.progress?.[topicKey] || 0 : 0;

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      
    };
    return colors[subject] || 'from-gray-500 to-gray-600';
  };

  if (!topic) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Topic Not Found</h1>
        <p className="text-base text-gray-600 dark:text-gray-30 mb-6">We couldn't find that topic. Try another from the curriculum.</p>
        <Link to="/curriculum" className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Curriculum
        </Link>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center mb-4">
          <Link to={`/curriculum/${topic.curriculum.toLowerCase()}`} className="text-blue-600 hover:text-blue-700 font-medium mr-4 flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to {topic.curriculum}
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className={`bg-gradient-to-r ${getSubjectColor(topic.subject)} p-8 text-white`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium bg-white dark:bg-gray-800 bg-opacity-20 px-3 py-1 rounded-full">
                {topic.curriculum} • {topic.subject}
              </span>
              {progress > 0 && (
                <span className="text-sm font-medium bg-white dark:bg-gray-800 bg-opacity-20 px-3 py-1 rounded-full">{progress}% Complete</span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">{topic.title}</h1>
            <p className="text-sm sm:text-base opacity-90 mb-4 sm:mb-6">{topic.description}</p>
            {progress > 0 && (
              <div className="w-full bg-white dark:bg-gray-800 bg-opacity-20 rounded-full h-2">
                <div className="bg-white dark:bg-gray-800 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-600 p-1 rounded-lg max-w-md mx-auto text-xs sm:text-sm">
          {[
            { id: 'videos', label: 'Videos', icon: Play, count: topic.videos.length },
            { id: 'resources', label: 'Resources', icon: FileText, count: topic.resources.length },
            { id: 'quiz', label: 'Quiz', icon: Trophy, count: quizzes.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center px-2 py-2 sm:px-4 sm:py-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
              <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-white px-2 py-1 rounded-full">{tab.count}</span>
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        {activeTab === 'videos' && (
          <div className="space-y-6">
            {topic.videos.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">No video lessons for this topic yet.</div>
            ) : (
              topic.videos.map((v: any) => {
                const isDone = doneVideos.includes(v.id);
                return (
                  <VideoPlayer
                    key={v.id}
                    title={v.title}
                    description={v.description}
                    englishUrl={v.englishUrl}
                    arabicUrl={v.arabicUrl}
                    done={isDone}
                    onToggleDone={() => setDoneVideos((prev) => prev.includes(v.id) ? prev.filter((id) => id !== v.id) : [...prev, v.id])}
                  />
                );
              })
            )}
          </div>
        )}

        {activeTab === 'resources' && (
          <Resources resources={topic.resources} doneResources={doneResources} setDoneResources={setDoneResources} />
        )}

        {activeTab === 'quiz' && (
          <div className="space-y-6">
            {quizzes.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">No quizzes for this topic yet.</div>
            ) : (
              quizzes.map((q: any) => (
                <div key={q.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">{q.title}</h3>
                  <Quiz questions={q.questions} title={q.title} quizId={q.id} />
                </div>
              ))
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default TopicPage;
