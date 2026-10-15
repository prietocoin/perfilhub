import * as perfilesService from '../services/perfilesService.js';

export async function listarDirectorio(req, res) {
  try {
    const directorio = await perfilesService.obtenerDirectorio();
    res.json(directorio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function listarNombresActivos(req, res) {
  try {
    const socios = await perfilesService.obtenerListaSocios();
    res.json(socios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function guardarConfiguracion(req, res) {
  try {
    const socio = await perfilesService.guardarSocioConfig(req.body);
    res.json({ success: true, data: socio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function toggleEstado(req, res) {
  try {
    const { nombre } = req.params;
    const { activo } = req.body;
    const resultado = await perfilesService.cambiarEstadoSocio(nombre, activo);
    res.json({ success: true, data: resultado });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function apagarTodos(req, res) {
  try {
    const resultado = await perfilesService.desactivarTodosSocios();
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function memorizarPlantilla(req, res) {
  const resultado = await perfilesService.guardarSociosVigentes();
  res.json(resultado);
}

export async function restaurarPlantilla(req, res) {
  const resultado = await perfilesService.restaurarSociosVigentes();
  res.json(resultado);
}

export async function borrarSocio(req, res) {
  try {
    const { nombre } = req.params;
    const borrado = await perfilesService.eliminarSocio(nombre);
    res.json({ success: true, data: borrado });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
