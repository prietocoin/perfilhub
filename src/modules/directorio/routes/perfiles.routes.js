import { Router } from 'express';
import {
  listarDirectorio,
  listarNombresActivos,
  guardarConfiguracion,
  toggleEstado,
  apagarTodos,
  memorizarPlantilla,
  restaurarPlantilla,
  borrarSocio
} from '../controllers/perfilesController.js';

const router = Router();

// Lecturas
router.get('/', listarDirectorio);
router.get('/activos', listarNombresActivos);

// Escrituras y operaciones en lote
router.post('/guardar', guardarConfiguracion);
router.post('/apagar-todos', apagarTodos);
router.post('/plantilla/memorizar', memorizarPlantilla);
router.post('/plantilla/restaurar', restaurarPlantilla);

// Operaciones por socio específico
router.patch('/:nombre/estado', toggleEstado);
router.delete('/:nombre', borrarSocio);

export default router;
