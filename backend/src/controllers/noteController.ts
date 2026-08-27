import type { RequestHandler } from 'express';

import { requireAuthenticatedUser } from '../middleware/authenticate';
import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  patchNote,
  updateNote,
} from '../services/noteService';
import {
  createNoteSchema,
  parseNoteId,
  patchNoteSchema,
  updateNoteSchema,
} from '../validation/noteSchemas';
import { parseBody } from '../validation/parseBody';

export const postNote: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { id: userId } = requireAuthenticatedUser(req);
    const input = parseBody(createNoteSchema, req.body);
    const note = await createNote(req.log, userId, input);
    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

export const getNotes: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { id: userId } = requireAuthenticatedUser(req);
    const notes = await listNotes(req.log, userId);
    res.status(200).json({
      success: true,
      message: 'Notes retrieved successfully',
      data: { notes },
    });
  } catch (error) {
    next(error);
  }
};

export const getOneNote: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { id: userId } = requireAuthenticatedUser(req);
    const noteId = parseNoteId(req.params['id']);
    const note = await getNote(req.log, userId, noteId);
    res.status(200).json({
      success: true,
      message: 'Note retrieved successfully',
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

export const putNote: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { id: userId } = requireAuthenticatedUser(req);
    const noteId = parseNoteId(req.params['id']);
    const input = parseBody(updateNoteSchema, req.body);
    const note = await updateNote(req.log, userId, noteId, input);
    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

export const patchOneNote: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { id: userId } = requireAuthenticatedUser(req);
    const noteId = parseNoteId(req.params['id']);
    const input = parseBody(patchNoteSchema, req.body);
    const note = await patchNote(req.log, userId, noteId, input);
    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOneNote: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { id: userId } = requireAuthenticatedUser(req);
    const noteId = parseNoteId(req.params['id']);
    await deleteNote(req.log, userId, noteId);
    res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
