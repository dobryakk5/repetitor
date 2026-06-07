export function masteryStatusLabel(value: string) {
  if (value === 'introduced') return 'тема введена';
  if (value === 'in_progress') return 'в работе';
  if (value === 'needs_practice') return 'нужна практика';
  if (value === 'almost_mastered') return 'почти освоено';
  if (value === 'mastered') return 'освоено';
  if (value === 'confident') return 'уверенно';
  return value;
}
