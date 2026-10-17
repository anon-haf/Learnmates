import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Topic } from '../utils/curriculumData';

interface TopicGroupListProps {
  topics: Topic[];
  onTopicClick: (topic: Topic) => void;
  renderTopicCard: (topic: Topic, index: number) => React.ReactNode;
  focusTopicId?: string;
}

type Section =
  | { type: 'group'; name: string; topics: Topic[]; firstIndex: number; lastIndex: number }
  | { type: 'topic'; topic: Topic; index: number }
  | { type: 'chunk'; topics: Topic[]; index: number };
/**
 * Groups topics by their `group` property and renders them with expand/collapse
 * All sections (groups and ungrouped) are ordered by the position of their last element
 */
const TopicGroupList: React.FC<TopicGroupListProps> = ({ 
  topics, 
  onTopicClick, 
  renderTopicCard,
  focusTopicId,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Revision', 'Practical']));
  const restoredTopicId = useRef<string | null>(null);

  // Build ordered sections with chunks of ungrouped topics and positioned groups
  const sections: Section[] = useMemo(() => {
    const grouped: Record<string, Topic[]> = {};
    const groupFirstIndex: Record<string, number> = {};

    // prepare grouped buckets
    topics.forEach((topic, index) => {
      if (topic.group) {
        if (!grouped[topic.group]) {
          grouped[topic.group] = [];
          groupFirstIndex[topic.group] = index;
        }
        grouped[topic.group].push(topic);
      }
    });

    const sectionsArr: Section[] = [];
    const placedGroups: Record<string, boolean> = {};
    let currentChunk: Topic[] = [];

    topics.forEach((topic, index) => {
      if (topic.group) {
        // flush any accumulated ungrouped chunk first
        if (currentChunk.length > 0) {
          sectionsArr.push({ type: 'chunk', topics: currentChunk.slice(), index: index - currentChunk.length });
          currentChunk = [];
        }
        // insert group only at first encounter
        if (!placedGroups[topic.group]) {
          sectionsArr.push({
            type: 'group',
            name: topic.group,
            topics: grouped[topic.group],
            firstIndex: groupFirstIndex[topic.group],
            lastIndex: topics.reduce((last, t, i) => t.group === topic.group ? i : last, -1)
          });
          placedGroups[topic.group] = true;
        }
      } else {
        currentChunk.push(topic);
      }
    });

    // flush remaining chunk
    if (currentChunk.length > 0) {
      sectionsArr.push({ type: 'chunk', topics: currentChunk, index: topics.length - currentChunk.length });
    }

    return sectionsArr;
  }, [topics]);

  useEffect(() => {
    if (!focusTopicId || restoredTopicId.current === focusTopicId) return;

    const targetTopic = topics.find((topic) => topic.id === focusTopicId);
    if (!targetTopic) return;

    const targetGroup = targetTopic.group;
    if (targetGroup) {
      setExpandedGroups((groups) => {
        if (groups.has(targetGroup)) return groups;
        const nextGroups = new Set(groups);
        nextGroups.add(targetGroup);
        return nextGroups;
      });
    }

    const timeout = window.setTimeout(() => {
      restoredTopicId.current = focusTopicId;
      document.getElementById(`topic-${focusTopicId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, targetGroup ? 350 : 0);

    return () => window.clearTimeout(timeout);
  }, [focusTopicId, topics]);

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const containerVariants = {
    hidden: { opacity: 0, transition: { duration: 0 } },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, transition: { duration: 0 } },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Render all sections ordered by their first appearance */}
      {sections.map((section, sectionIndex) => {
        if (section.type === 'topic') {
          const topic = section.topic;
          return (
            <motion.div
              key={topic.id}
              id={`topic-${topic.id}`}
              variants={itemVariants}
              onClick={() => onTopicClick(topic)}
            >
              {renderTopicCard(topic, section.index)}
            </motion.div>
          );
        }

        if (section.type === 'chunk') {
          return (
            <div key={`chunk-${section.index}`} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.topics.map((topic, idx) => {
                return (
                  <motion.div
                    key={topic.id}
                    id={`topic-${topic.id}`}
                    variants={itemVariants}
                    onClick={() => onTopicClick(topic)}
                  >
                    {renderTopicCard(topic, section.index + idx)}
                  </motion.div>
                );
              })}
            </div>
          );
        }

        // group section - header and background combined into one connected container
        return (
          <div key={section.name} className="mb-4">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 overflow-hidden border-l-4 border-indigo-600 dark:border-indigo-400">
              {/* Group Header (connected) */}
              <motion.button
                variants={itemVariants}
                onClick={() => toggleGroup(section.name)}
                className="w-full flex items-center justify-between p-3 bg-transparent hover:shadow-md transition-shadow duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{section.name}</h2>
                  <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-600 rounded-full">
                    {section.topics.length}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: expandedGroups.has(section.name) ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-gray-600 dark:text-gray-400"
                >
                  <ChevronDown className="w-6 h-6" />
                </motion.div>
              </motion.button>

              {/* thin separator between header and content */}
              <div className="w-full h-0.5 bg-gray-400 dark:bg-gray-700" />

              {/* Grouped Topics Grid (connected below header) */}
              <AnimatePresence mode="wait">
                {expandedGroups.has(section.name) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {section.topics.map((topic, index) => {
                          return (
                            <motion.div
                              key={topic.id}
                              id={`topic-${topic.id}`}
                              variants={itemVariants}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => onTopicClick(topic)}
                            >
                              {renderTopicCard(topic, index)}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </motion.section>
  );
};

export default TopicGroupList;
