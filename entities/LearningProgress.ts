// Learning Progress entity
// NOTE: Needs base44 API
export interface LearningProgress {
  id: string;
  userId: string;
  chapterId: string;
  progress: number;
  completedAt?: Date;
}
