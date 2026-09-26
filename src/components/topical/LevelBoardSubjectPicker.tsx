import React from 'react';
import Dropdown from './Dropdown';

interface LevelBoardSubjectPickerProps {
  levels: string[];
  selectedLevel: string;
  onLevelChange: (level: string) => void;

  boardsForLevel: (level: string) => string[];
  selectedBoard: string;
  onBoardChange: (board: string) => void;

  subjectsForLevelBoard: (level: string, board: string) => string[];
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
}

const LevelBoardSubjectPicker: React.FC<LevelBoardSubjectPickerProps> = ({
  levels,
  selectedLevel,
  onLevelChange,
  boardsForLevel,
  selectedBoard,
  onBoardChange,
  subjectsForLevelBoard,
  selectedSubject,
  onSubjectChange,
}) => {
  const hasLevel = !!selectedLevel;
  const hasBoard = !!selectedBoard;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Dropdown
          label="Level"
          fullWidth
          buttonLabel={selectedLevel ? selectedLevel.toUpperCase() : 'Select Level'}
          options={levels.map(l => ({ value: l, label: l.toUpperCase() }))}
          selectedValue={selectedLevel}
          onSelect={onLevelChange}
        />
      </div>

      <div>
        <Dropdown
          label="Board"
          fullWidth
          buttonLabel={selectedBoard ? selectedBoard.charAt(0).toUpperCase() + selectedBoard.slice(1) : 'Select Board'}
          options={boardsForLevel(selectedLevel).map(b => ({ value: b, label: b.charAt(0).toUpperCase() + b.slice(1) }))}
          selectedValue={selectedBoard}
          onSelect={onBoardChange}
          disabled={!hasLevel}
        />
      </div>

      <div>
        <Dropdown
          label="Subject"
          fullWidth
          buttonLabel={selectedSubject || 'Select Subject'}
          options={subjectsForLevelBoard(selectedLevel, selectedBoard).map(s => ({ value: s, label: s }))}
          selectedValue={selectedSubject}
          onSelect={onSubjectChange}
          disabled={!hasLevel || !hasBoard}
        />
      </div>
    </div>
  );
};

export default LevelBoardSubjectPicker;
