import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { SubjectConfig } from '../../utils/topicalConfig';
import { makeKey } from '../../utils/topicalHelpers';
import { pillActive, pillInactive } from './ui';
import TopicalCheckbox from './Checkbox';

interface TopicPickerPanelProps {
  cfg: SubjectConfig;
  checked: Set<string>;
  expanded: Set<string>;
  expandedUnits: Set<string>;
  isTopicChecked: (cfg: SubjectConfig, unitName: string, topicName: string) => boolean;
  isTopicPartiallyChecked: (cfg: SubjectConfig, unitName: string, topicName: string) => boolean;
  toggleTopic: (cfg: SubjectConfig, unitName: string, topicName: string) => void;
  toggleSubtopic: (cfg: SubjectConfig, unitName: string, topicName: string, subtopicName: string) => void;
  toggleExpanded: (cfg: SubjectConfig, unitName: string, topicName: string) => void;
  toggleUnitExpanded: (cfg: SubjectConfig, unitName: string) => void;
  selectedTopicsCount: number;
  hasAnySelectedTopics: boolean;
  collapsed: boolean;
  onToggleAllTopics?: () => void;
  isAllTopicsSelected?: boolean;
}

const TopicPickerPanel: React.FC<TopicPickerPanelProps> = ({
  cfg,
  checked,
  expanded,
  expandedUnits,
  isTopicChecked,
  isTopicPartiallyChecked,
  toggleTopic,
  toggleSubtopic,
  toggleExpanded,
  toggleUnitExpanded,
  selectedTopicsCount,
  hasAnySelectedTopics,
  collapsed,
  onToggleAllTopics,
  isAllTopicsSelected,
}) => {
  const countLabel = hasAnySelectedTopics
    ? `${selectedTopicsCount} topic${selectedTopicsCount === 1 ? '' : 's'} selected`
    : 'No topics selected';

  if (collapsed) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold tracking-wide uppercase text-gray-500 dark:text-gray-400">
            Topics
          </span>
          {onToggleAllTopics && (
            <button
              type="button"
              onClick={onToggleAllTopics}
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 transition-colors border border-slate-200 dark:border-slate-700"
            >
              {isAllTopicsSelected ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
        <span className={hasAnySelectedTopics ? pillActive : pillInactive}>{countLabel}</span>
      </div>
      {cfg.units.map((unit, uidx) => {
        const unitKey = `${cfg.level}||${cfg.board}||${cfg.subject}||${unit.unit}`;
        const isUnitExpanded = expandedUnits.has(unitKey);
        return (
          <div key={uidx} className="mt-4 pl-0">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-lg">
              <div
                className="flex items-center justify-between cursor-pointer mb-2 group"
                onClick={() => toggleUnitExpanded(cfg, unit.unit)}
              >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide uppercase">
                  <span className="text-indigo-600 dark:text-indigo-300 group-hover:text-indigo-500 dark:group-hover:text-indigo-200 transition-colors">{unit.unit}</span>
                </h3>
                <span className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300 group-hover:text-indigo-500 dark:group-hover:text-indigo-200 transition-colors">
                  <span>{isUnitExpanded ? 'Collapse' : 'Expand'}</span>
                  <motion.div animate={{ rotate: isUnitExpanded ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}>
                    <ChevronDown className="w-5 h-5" />
                  </motion.div>
                </span>
              </div>
              <AnimatePresence initial={false}>
                {isUnitExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                    className="overflow-hidden"
                  >
                    <ul className="space-y-2 pt-2 pb-1">
                      {unit.topics.map((topic, tidx) => {
                        const topicKey = makeKey(cfg.level, cfg.board, cfg.subject, unit.unit, topic.topic);
                        const hasSub = !!(topic.subtopics && topic.subtopics.length > 0);
                        const expandedHere = expanded.has(topicKey);
                        const checkedHere = isTopicChecked(cfg, unit.unit, topic.topic);
                        const partiallyCheckedHere = isTopicPartiallyChecked(cfg, unit.unit, topic.topic);
                        return (
                          <li key={tidx} className="rounded-lg bg-slate-50/50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <label className="inline-flex items-center space-x-3 cursor-pointer group w-full">
                                <TopicalCheckbox
                                  shape="circle"
                                  checked={checkedHere}
                                  indeterminate={partiallyCheckedHere && !checkedHere}
                                  onChange={() => toggleTopic(cfg, unit.unit, topic.topic)}
                                />
                                <span
                                  className={`ml-2 text-base font-semibold transition-colors break-words whitespace-normal ${
                                    checkedHere
                                      ? 'text-slate-900 dark:text-gray-200'
                                      : 'text-slate-600 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white'
                                  }`}
                                >
                                  {topic.topic}
                                </span>
                              </label>
                              {hasSub && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpanded(cfg, unit.unit, topic.topic)}
                                  className="text-sm text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white ml-3 transition-colors p-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                                  title={expandedHere ? 'Collapse subtopics' : 'Expand subtopics'}
                                >
                                  <motion.div animate={{ rotate: expandedHere ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}>
                                    <ChevronDown className="w-5 h-5" />
                                  </motion.div>
                                </button>
                              )}
                            </div>
                            
                            <AnimatePresence initial={false}>
                              {hasSub && expandedHere && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 26 }}
                                  className="overflow-hidden"
                                >
                                  <ul className="pl-10 mt-3 space-y-3 pb-2 border-l border-slate-200 dark:border-slate-700/50 ml-2.5">
                                    {topic.subtopics!.map((sub, sidx) => {
                                      const subKey = makeKey(cfg.level, cfg.board, cfg.subject, unit.unit, sub.subtopic);
                                      const subChecked = checked.has(subKey);
                                      return (
                                        <li key={sidx}>
                                          <label className="inline-flex items-center space-x-3 cursor-pointer group">
                                            <TopicalCheckbox
                                              shape="circle"
                                              size="sm"
                                              checked={subChecked}
                                              onChange={() => toggleSubtopic(cfg, unit.unit, topic.topic, sub.subtopic)}
                                            />
                                            <span
                                              className={`text-sm transition-colors ${
                                                subChecked ? 'text-slate-700 dark:text-gray-400' : 'text-slate-500 dark:text-gray-400 group-hover:text-slate-700 dark:group-hover:text-gray-200'
                                              }`}
                                            >
                                              {sub.subtopic}
                                            </span>
                                          </label>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </li>
                        );
                      })}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TopicPickerPanel;
