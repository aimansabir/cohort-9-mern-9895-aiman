export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  title: string;
  content: string;
}

// Every template is written with the same tags the toolbar produces, so the
// cleaner leaves them alone. A test holds them to that.
export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start from nothing',
    title: '',
    content: '',
  },
  {
    id: 'lecture',
    name: 'Lecture notes',
    description: 'Topic, key points, questions, summary',
    title: 'Lecture: ',
    content:
      '<h2>Topic</h2><p></p>' +
      '<h2>Key points</h2><ul><li></li></ul>' +
      '<h2>Questions</h2><ul><li></li></ul>' +
      '<h2>Summary</h2><p></p>',
  },
  {
    id: 'todo',
    name: 'To do list',
    description: 'Today, this week, later',
    title: 'To do',
    content:
      '<h2>Today</h2><ul><li></li></ul>' +
      '<h2>This week</h2><ul><li></li></ul>' +
      '<h2>Later</h2><ul><li></li></ul>',
  },
  {
    id: 'meeting',
    name: 'Meeting notes',
    description: 'Who came, decisions, actions',
    title: 'Meeting: ',
    content:
      '<h2>Who was there</h2><ul><li></li></ul>' +
      '<h2>Discussed</h2><ul><li></li></ul>' +
      '<h2>Decided</h2><ul><li></li></ul>' +
      '<h2>Next steps</h2><ul><li></li></ul>',
  },
  {
    id: 'study',
    name: 'Study notes',
    description: 'Definitions, examples, revision',
    title: 'Study: ',
    content:
      '<h2>Definitions</h2><ul><li></li></ul>' +
      '<h2>Examples</h2><ul><li></li></ul>' +
      '<h2>Things to revise</h2><ul><li></li></ul>',
  },
  {
    id: 'brainstorm',
    name: 'Brainstorm',
    description: 'Ideas, worth trying, ruled out',
    title: 'Ideas: ',
    content:
      '<h2>Ideas</h2><ul><li></li></ul>' +
      '<h2>Worth trying</h2><ul><li></li></ul>' +
      '<h2>Ruled out</h2><ul><li></li></ul>',
  },
];

export function templateById(id: string): NoteTemplate | undefined {
  return NOTE_TEMPLATES.find((template) => template.id === id);
}
