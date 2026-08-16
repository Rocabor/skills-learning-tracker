import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { Session, Skill } from '../types';
import { rememberFocusedElement } from '../hooks/useFocusTrap';
import type { ShareCardData } from '../utils/shareUtils';

interface ModalContextType {
  selectedSkillId: string | null;
  setSelectedSkillId: (id: string | null) => void;
  isLogModalOpen: boolean;
  setIsLogModalOpen: (open: boolean) => void;
  logModalDefaultSkillId: string | null;
  openLogModalWithSkill: (skillId?: string) => void;
  editingSession: Session | null;
  openEditSessionModal: (session: Session) => void;
  isSkillModalOpen: boolean;
  setIsSkillModalOpen: (open: boolean) => void;
  editingSkill: Skill | null;
  openEditSkillModal: (skill: Skill) => void;
  openAddSkillModal: () => void;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  shareCardData: ShareCardData | null;
  openShareModal: (data: ShareCardData) => void;
  closeModals: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logModalDefaultSkillId, setLogModalDefaultSkillId] = useState<string | null>(null);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCardData, setShareCardData] = useState<ShareCardData | null>(null);

  const openLogModalWithSkill = useCallback((skillId?: string) => {
    rememberFocusedElement();
    setLogModalDefaultSkillId(skillId || null);
    setIsLogModalOpen(true);
  }, []);

  const openEditSessionModal = useCallback((session: Session) => {
    rememberFocusedElement();
    setEditingSession(session);
    setIsLogModalOpen(true);
  }, []);

  const openEditSkillModal = useCallback((skill: Skill) => {
    rememberFocusedElement();
    setEditingSkill(skill);
    setIsSkillModalOpen(true);
  }, []);

  const openAddSkillModal = useCallback(() => {
    rememberFocusedElement();
    setEditingSkill(null);
    setIsSkillModalOpen(true);
  }, []);

  const openShareModal = useCallback((data: ShareCardData) => {
    rememberFocusedElement();
    setShareCardData(data);
    setIsShareModalOpen(true);
  }, []);

  const closeModals = useCallback(() => {
    setIsLogModalOpen(false);
    setIsSkillModalOpen(false);
    setEditingSkill(null);
    setEditingSession(null);
    setIsShareModalOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      selectedSkillId,
      setSelectedSkillId,
      isLogModalOpen,
      setIsLogModalOpen,
      logModalDefaultSkillId,
      openLogModalWithSkill,
      editingSession,
      openEditSessionModal,
      isSkillModalOpen,
      setIsSkillModalOpen,
      editingSkill,
      openEditSkillModal,
      openAddSkillModal,
      isShareModalOpen,
      setIsShareModalOpen,
      shareCardData,
      openShareModal,
      closeModals,
    }),
    [
      selectedSkillId,
      setSelectedSkillId,
      isLogModalOpen,
      setIsLogModalOpen,
      logModalDefaultSkillId,
      openLogModalWithSkill,
      editingSession,
      openEditSessionModal,
      isSkillModalOpen,
      setIsSkillModalOpen,
      editingSkill,
      openEditSkillModal,
      openAddSkillModal,
      isShareModalOpen,
      setIsShareModalOpen,
      shareCardData,
      openShareModal,
      closeModals,
    ],
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
