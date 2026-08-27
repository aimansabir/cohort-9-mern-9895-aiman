import { sanitizeHtml } from './noteText';
import { NOTE_TEMPLATES, templateById } from './noteTemplates';

describe('NOTE_TEMPLATES', () => {
  it('offers a blank one so a template is never forced', () => {
    expect(NOTE_TEMPLATES[0]?.id).toBe('blank');
    expect(NOTE_TEMPLATES[0]?.content).toBe('');
  });

  it('gives every template its own id', () => {
    const ids = NOTE_TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('names every template for the picker', () => {
    for (const template of NOTE_TEMPLATES) {
      expect(template.name.length).toBeGreaterThan(0);
      expect(template.description.length).toBeGreaterThan(0);
    }
  });

  // A template that lost half its headings to the cleaner would quietly put a
  // broken structure into the note
  it('writes every template in markup the cleaner keeps', () => {
    for (const template of NOTE_TEMPLATES) {
      expect(sanitizeHtml(template.content)).toBe(template.content);
    }
  });

  it('gives the structured ones some headings to fill in', () => {
    for (const template of NOTE_TEMPLATES.filter((item) => item.id !== 'blank')) {
      expect(template.content).toContain('<h2>');
    }
  });
});

describe('templateById', () => {
  it('finds a template by its id', () => {
    expect(templateById('lecture')?.name).toBe('Lecture notes');
  });

  it('gives nothing back for an id it does not know', () => {
    expect(templateById('nope')).toBeUndefined();
  });
});
