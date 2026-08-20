import { Router } from 'express';

import {
  deleteOneNote,
  getNotes,
  getOneNote,
  postNote,
  putNote,
} from '../controllers/noteController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Applied at the router level so every notes endpoint is authenticated and a
// new route can't accidentally be left unguarded.
router.use(authenticate);

router.post('/', postNote);
router.get('/', getNotes);
router.get('/:id', getOneNote);
router.put('/:id', putNote);
router.delete('/:id', deleteOneNote);

export default router;
