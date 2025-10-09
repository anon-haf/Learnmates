import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Flag, RotateCcw, Trophy, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

type PartType = 'mcq' | 'written';

interface Part {
  id: string;
  question: string;
  options?: string[]; // for mcq
  correctAnswer?: number | string; // number for mcq, string for written
  explanation?: string;
  image?: string;
  type?: PartType;
}

interface Question {
  id: string;
  // legacy single-part fields (optional)
  question?: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  image?: string;
  // new multi-part
  parts?: Part[];
  title?: string;
}

interface QuizProps {
  questions: Question[];
  title: string;
  quizId?: string;
}

const Quiz: React.FC<QuizProps> = ({ questions, title, quizId }) => {
  const [showImageModalSrc, setShowImageModalSrc] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // normalize questions into parts array for each question
  const partsList = useMemo(() => {
    return questions.map((q) => {
      if (q.parts && q.parts.length > 0) return q.parts.map(p => ({ ...p }));
      // convert legacy single-part into parts
      return [
        {
          id: `${q.id}-p0`,
          question: q.question || q.title || 'Question',
          options: q.options,
          correctAnswer: (q.correctAnswer ?? undefined) as number | string | undefined,
          explanation: q.explanation,
          image: q.image,
          type: q.options ? 'mcq' as PartType : 'written' as PartType
        }
      ];
    });
  }, [questions]);

  // state per question part
  const [selectedAnswers, setSelectedAnswers] = useState<number[][]>(() => partsList.map(parts => parts.map(() => -1)));
  const [writtenAnswers, setWrittenAnswers] = useState<string[][]>(() => partsList.map(parts => parts.map(() => '')));
  const [showExplanations, setShowExplanations] = useState<boolean[][]>(() => partsList.map(parts => parts.map(() => false)));

  // Persist written answers to localStorage when a quizId is provided
  React.useEffect(() => {
    if (!quizId) return;
    try {
      const saved = localStorage.getItem(`quiz_written_${quizId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // basic validation: ensure structure matches partsList
        if (Array.isArray(parsed) && parsed.length === partsList.length) {
          setWrittenAnswers(parsed as string[][]);
        }
      }
    } catch (e) {
      // ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  React.useEffect(() => {
    if (!quizId) return;
    try {
      localStorage.setItem(`quiz_written_${quizId}`, JSON.stringify(writtenAnswers));
    } catch (e) {
      // ignore write errors
    }
  }, [writtenAnswers, quizId, partsList]);

  if (questions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-8 text-center"
      >
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Quiz Available</h3>
        <p className="text-gray-600 mb-6">No quiz questions have been added for this topic yet. Help us grow by contributing content!</p>
        <Link to="/contribute" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg">
          Contribute Questions
        </Link>
      </motion.div>
    );
  }

  const handleSelect = (partIndex: number, answerIndex: number) => {
    const copy = selectedAnswers.map(a => a.slice());
    copy[currentQuestion][partIndex] = answerIndex;
    setSelectedAnswers(copy);
  };

  const handleWrittenChange = (partIndex: number, value: string) => {
    const copy = writtenAnswers.map(a => a.slice());
    copy[currentQuestion][partIndex] = value;
    setWrittenAnswers(copy);
  };

  const handleReveal = (partIndex: number) => {
    const copy = showExplanations.map(a => a.slice());
    copy[currentQuestion][partIndex] = true;
    setShowExplanations(copy);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setSelectedAnswers(partsList.map(parts => parts.map(() => -1)));
    setWrittenAnswers(partsList.map(parts => parts.map(() => '')));
    setShowExplanations(partsList.map(parts => parts.map(() => false)));
    setIsComplete(false);
  };

  const calculateScore = () => {
    let correct = 0;
    let total = 0;
    partsList.forEach((parts, qi) => {
      parts.forEach((p, pi) => {
        if ((p.type ?? 'mcq') === 'mcq' && typeof p.correctAnswer === 'number') {
          total += 1;
          if (selectedAnswers[qi][pi] === p.correctAnswer) correct += 1;
        }
      });
    });
    return { correct, total };
  };

  const parts = partsList[currentQuestion];

  if (isComplete) {
    const { correct, total } = calculateScore();
    const percentage = total === 0 ? 0 : Math.round((correct / total) * 100);
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Quiz Complete!</h2>
        <div className="text-6xl font-bold text-transparent bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text mb-4">{percentage}%</div>
        <p className="text-xl text-gray-600 mb-8">You scored {correct} out of {total} MCQ parts correctly</p>
        <button onClick={handleReset} className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg">
          <RotateCcw className="w-4 h-4 mr-2" />
          Retry Quiz
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <Link to="/contact" className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Report Quiz">
            <Flag className="w-4 h-4" />
          </Link>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-300" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
        </div>
        <p className="text-sm text-gray-600 mt-2">Question {currentQuestion + 1} of {questions.length}</p>
      </div>

      <div className="p-6">
        {/* Question title if present */}
        {questions[currentQuestion].title && <h3 className="text-xl font-semibold text-gray-900 mb-4">{questions[currentQuestion].title}</h3>}

        <div className="space-y-6 max-h-[56vh] overflow-y-auto pr-2">
          {parts.map((part, pi) => {
            const selected = selectedAnswers[currentQuestion][pi];
            const written = writtenAnswers[currentQuestion][pi];
            const revealed = showExplanations[currentQuestion][pi];
            const isMcq = (part.type ?? 'mcq') === 'mcq';
            return (
              <div key={part.id} className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Part {pi + 1}</p>
                    <p className="font-medium text-gray-900 mb-2">{part.question}</p>
                    {part.image && (
                      <img src={part.image} alt="part visual" className="max-h-48 object-contain rounded mb-2 cursor-zoom-in" onClick={() => setShowImageModalSrc(part.image!)} />
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{isMcq ? 'Multiple choice' : 'Written response'}</div>
                </div>

                {isMcq ? (
                  <div className="space-y-3">
                    {part.options?.map((opt, oi) => (
                      <motion.button key={oi} onClick={() => handleSelect(pi, oi)} disabled={revealed} className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${selected === oi ? (revealed ? (oi === part.correctAnswer ? 'border-green-500 bg-green-50 text-green-800' : 'border-red-500 bg-red-50 text-red-800') : 'border-blue-500 bg-blue-50 text-blue-800') : (revealed && oi === part.correctAnswer ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50')}`}> 
                        <div className="flex items-center justify-between">
                          <span>{opt}</span>
                          {revealed && (
                            <div>
                              {oi === part.correctAnswer ? <CheckCircle className="w-5 h-5 text-green-600" /> : selected === oi ? <XCircle className="w-5 h-5 text-red-600" /> : null}
                            </div>
                          )}
                        </div>
                      </motion.button>
                    ))}

                    <div className="flex items-center justify-between mt-3">
                      {!revealed ? (
                        <button onClick={() => handleReveal(pi)} className="px-4 py-2 bg-orange-500 text-white rounded-lg">Check Answer</button>
                      ) : (
                        <div className={`p-3 rounded-lg ${selected === part.correctAnswer ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                          <div className="font-medium mb-1">{selected === part.correctAnswer ? 'Correct' : 'Answer'}</div>
                          {part.explanation && <div className="text-sm">{part.explanation}</div>}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">MCQ</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea value={written} onChange={(e) => handleWrittenChange(pi, e.target.value)} rows={4} className="w-full p-3 border rounded-md" placeholder="Write your answer here..." />
                    <div className="flex items-center justify-between">
                      {!revealed ? (
                        <button onClick={() => handleReveal(pi)} className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg"><Eye className="w-4 h-4 mr-2" />Show Correct Answer</button>
                      ) : (
                        <div className="p-3 rounded-lg bg-gray-50 border">
                          <div className="font-medium text-sm text-gray-800">Correct Answer</div>
                          <div className="text-sm text-gray-700">{String(part.correctAnswer)}</div>
                          {part.explanation && <div className="mt-2 text-sm text-gray-600">{part.explanation}</div>}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">Written</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Image modal */}
        {showImageModalSrc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70" onClick={() => setShowImageModalSrc(null)}>
            <div className="relative max-w-4xl w-full p-4" onClick={e => e.stopPropagation()}>
              <img src={showImageModalSrc} className="w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
              <button className="absolute top-2 right-2 text-white text-3xl" onClick={() => setShowImageModalSrc(null)}>×</button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button onClick={handlePrevious} disabled={currentQuestion === 0} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>

          <div className="space-x-3">
            <button onClick={() => { setShowExplanations(prev => { const copy = prev.map(a => a.slice()); copy[currentQuestion] = parts.map(() => true); return copy; }); }} className="px-4 py-2 bg-gray-100 rounded-lg">Reveal All</button>
            <button onClick={handleNext} className="px-6 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600">{currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Quiz;