import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { getAvailableLevels, getAvailableBoardsForLevel, getAvailableSubjectsForLevelAndBoard, BoardKey } from '../utils/curriculumData';
import { FavoriteSubject, saveFavoriteSubjects } from '../utils/favoriteSubjects';
import { getSubjectIcon } from '../utils/subjectIcons';
import { getSubjectQualificationCode } from '../data/examTimings';
import { Drawer, Button, CardFooter } from '@/components/ui';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteSubjects: FavoriteSubject[];
  onSubjectsChange: (subjects: FavoriteSubject[]) => void;
}

type ModalStep = 'level' | 'board' | 'subject';

const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  isOpen,
  onClose,
  favoriteSubjects,
  onSubjectsChange,
}) => {
  const [step, setStep] = useState<ModalStep>('level');
  const [modalLevel, setModalLevel] = useState<string | null>(null);
  const [modalBoard, setModalBoard] = useState<BoardKey | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const availableLevels = getAvailableLevels();
  const availableBoards = modalLevel ? getAvailableBoardsForLevel(modalLevel) : [];
  const availableSubjects = modalLevel && modalBoard ? getAvailableSubjectsForLevelAndBoard(modalLevel, modalBoard) : [];

  const handleClose = () => {
    setStep('level');
    setModalLevel(null);
    setModalBoard(null);
    setSelectedSubject(null);
    onClose();
  };

  const handleLevelSelect = (level: string) => {
    setModalLevel(level);
    setModalBoard(null);
    setSelectedSubject(null);
    setStep('board');
  };

  const handleBoardSelect = (board: BoardKey) => {
    setModalBoard(board);
    setSelectedSubject(null);
    setStep('subject');
  };

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
  };

  const handleConfirmSubject = () => {
    if (!modalLevel || !modalBoard || !selectedSubject) return;

    const newFavorite: FavoriteSubject = { subject: selectedSubject, level: modalLevel, board: modalBoard };
    const alreadyExists = favoriteSubjects.some(
      (fav) => fav.subject === selectedSubject && fav.level === modalLevel && fav.board === modalBoard
    );
    
    if (!alreadyExists) {
      const newSubjects = [...favoriteSubjects, newFavorite];
      saveFavoriteSubjects(newSubjects);
      onSubjectsChange(newSubjects);
      handleClose();
    } else {
      handleClose();
    }
  };

  const handleBackToLevel = () => {
    setStep('level');
    setModalLevel(null);
    setModalBoard(null);
    setSelectedSubject(null);
  };

  const handleBackToBoard = () => {
    setStep('board');
    setModalBoard(null);
    setSelectedSubject(null);
  };

  const getStepTitle = () => {
    switch (step) {
      case 'level': return 'Select Your Level';
      case 'board': return 'Select Your Board';
      case 'subject': return 'Select Your Subject';
      case 'success': return 'Subject Added!';
      default: return 'Add Subject';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'level': return 'Choose your education level';
      case 'board': return 'Great! Now select your board';
      case 'subject': return 'Perfect! Choose a subject to study';
      case 'success': return 'Ready to start learning?';
      default: return '';
    }
  };

  const renderLevelStep = () => (
    <div className="space-y-3">
      {availableLevels.map((level) => (
        <Button
          key={level}
          variant="outline"
          fullWidth
          className="justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={() => handleLevelSelect(level)}
        >
          {level}
        </Button>
      ))}
    </div>
  );

  const renderBoardStep = () => (
    <>
      <div className="space-y-3 mb-6">
        {availableBoards.map((board) => (
          <Button
            key={board.id}
            variant="outline"
            fullWidth
            className="justify-start hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => handleBoardSelect(board.id)}
          >
            {board.name}
          </Button>
        ))}
      </div>
      <Button variant="ghost" fullWidth onClick={handleBackToLevel} className="justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800">
        <ArrowLeft className="w-5 h-5" />
        Back
      </Button>
    </>
  );

  const renderSubjectStep = () => (
    <>
      <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
        {availableSubjects.map((subject) => {
          const subjectCode = modalLevel && modalBoard
            ? getSubjectQualificationCode(modalLevel, modalBoard, subject)
            : null;
          const isAdded = favoriteSubjects.some(
            (fav) => fav.subject === subject && fav.level === modalLevel && fav.board === modalBoard
          );
          const isSelected = selectedSubject === subject;
          const selectedClasses = isSelected
            ? 'bg-slate-100 dark:bg-slate-800 border-blue-300/60 dark:border-blue-400 text-slate-900 dark:text-white shadow-sm'
            : '';
          const addedClasses = isAdded && !isSelected ? 'opacity-70 dark:opacity-70' : '';

          return (
            <Button
              key={subject}
              variant="outline"
              fullWidth
              className={`justify-start gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 ${selectedClasses} ${addedClasses}`}
              onClick={() => handleSubjectSelect(subject)}
              disabled={isAdded && !isSelected}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`text-lg ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                  {getSubjectIcon(subject)}
                </div>
                <span>
                  {subject}
                  {subjectCode && ` (${subjectCode})`}
                </span>
              </div>
              {isSelected && <CheckCircle className="w-5 h-5 flex-shrink-0 text-blue-700 dark:text-blue-300" />}
              {isAdded && !isSelected && <CheckCircle className="w-5 h-5 flex-shrink-0 opacity-50 text-slate-400 dark:text-slate-500" />}
            </Button>
          );
        })}
      </div>
      <div className="flex flex-col gap-3">
        <Button variant="secondary" fullWidth onClick={handleBackToBoard} className="justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="w-5 h-5" />
          Back
        </Button>
        <Button variant="primary" fullWidth onClick={handleConfirmSubject} disabled={!selectedSubject} className="justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700">
          Add Subject
        </Button>
      </div>
    </>
  );


  return (
    <Drawer
      open={isOpen}
      onClose={handleClose}
      side="right"
      size="lg"
      title={step !== 'success' ? getStepTitle() : undefined}
      description={step !== 'success' ? getStepDescription() : undefined}
      closeButton={step !== 'success'}
      footer={step !== 'success' ? undefined : null}
    >
      <AnimatePresence mode="wait">
        {step === 'level' && (
          <motion.div key="level-step" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            {renderLevelStep()}
          </motion.div>
        )}
        {step === 'board' && (
          <motion.div key="board-step" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            {renderBoardStep()}
          </motion.div>
        )}
        {step === 'subject' && (
          <motion.div key="subject-step" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            {renderSubjectStep()}
          </motion.div>
        )}
      </AnimatePresence>
    </Drawer>
  );
};

export default AddSubjectModal;