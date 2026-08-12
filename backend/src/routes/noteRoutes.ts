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

// Every notes endpoint requires authentication. Applying the middleware at the
// router level keeps individual route registrations clean and makes it
// impossible to forget the guard on a new endpoint.
router.use(authenticate);

router.post('/', postNote);
router.get('/', getNotes);
router.get('/:id', getOneNote);
router.put('/:id', putNote);
router.delete('/:id', deleteOneNote);

export default router;
