import pool from '../../../config/database.js';

export async function obtenerDirectorio() {
  const sql = `SELECT * FROM perfiles_glaukov ORDER BY nombre ASC;`;
  const { rows } = await pool.query(sql);
  return rows;
}

export async function obtenerListaSocios() {
  const sql = `
    SELECT DISTINCT TRIM(nombre) AS nombre 
    FROM perfiles_glaukov 
    WHERE nombre IS NOT NULL 
      AND TRIM(nombre) != '' 
      AND (mostrar->>'tasas')::boolean = TRUE
    ORDER BY nombre ASC;
  `;
  const { rows } = await pool.query(sql);
  return rows.map((r) => r.nombre);
}

export async function guardarSocioConfig(payload) {
  const {
    nombre,
    id_grupo,
    rol,
    moneda_base,
    saldo_inicial,
    mostrar,
    monedas,
    herencia
  } = payload;

  const nombreClean = String(nombre || '').trim().toUpperCase();
  const herenciaBool = Boolean(herencia);

  const mostrarObj = typeof mostrar === 'object' && mostrar !== null
    ? mostrar
    : { tasas: true, dashboard: true };

  const mostrarJson = JSON.stringify(mostrarObj);
  const monedasJson = typeof monedas === 'object' && monedas !== null
    ? JSON.stringify(monedas)
    : (monedas || '{}');

  const query = `
    UPDATE perfiles_glaukov
    SET 
      id_grupo = $1,
      rol = $2,
      moneda_base = $3,
      saldo_inicial = $4,
      mostrar = $5::jsonb,
      monedas = $6::jsonb,
      herencia = $7::boolean
    WHERE UPPER(TRIM(nombre)) = $8
    RETURNING *;
  `;

  const values = [
    id_grupo || '',
    rol || 'SOCIO',
    (moneda_base || 'USDT').toUpperCase(),
    parseFloat(saldo_inicial) || 0,
    mostrarJson,
    monedasJson,
    herenciaBool,
    nombreClean
  ];

  const { rows } = await pool.query(query, values);

  if (rows.length === 0) {
    const insertQuery = `
      INSERT INTO perfiles_glaukov (
        id_grupo, nombre, rol, moneda_base, saldo_inicial, mostrar, monedas, herencia
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::boolean)
      RETURNING *;
    `;
    const insertValues = [
      id_grupo || `${nombreClean}_JID`,
      nombreClean,
      rol || 'SOCIO',
      (moneda_base || 'USDT').toUpperCase(),
      parseFloat(saldo_inicial) || 0,
      mostrarJson,
      monedasJson,
      herenciaBool
    ];
    const insertRes = await pool.query(insertQuery, insertValues);
    return insertRes.rows[0];
  }

  return rows[0];
}

export async function cambiarEstadoSocio(nombre, activo) {
  const isGeneral = nombre.trim().toUpperCase() === 'GENERAL';
  const estadoTasas = isGeneral ? true : Boolean(activo);

  const query = `
    UPDATE perfiles_glaukov 
    SET mostrar = jsonb_set(
      COALESCE(mostrar, '{"tasas": true, "dashboard": true}'::jsonb), 
      '{tasas}', 
      to_jsonb($1::boolean)
    ) 
    WHERE UPPER(TRIM(nombre)) = UPPER(TRIM($2)) 
    RETURNING nombre, mostrar;
  `;

  const { rows } = await pool.query(query, [estadoTasas, nombre.trim()]);

  if (rows.length === 0) {
    throw new Error('Socio no encontrado.');
  }

  return rows[0];
}

export async function desactivarTodosSocios() {
  await pool.query(`
    UPDATE perfiles_glaukov 
    SET mostrar = jsonb_set(COALESCE(mostrar, '{}'::jsonb), '{tasas}', 'false'::jsonb) 
    WHERE UPPER(TRIM(nombre)) != 'GENERAL';
  `);

  await pool.query(`
    UPDATE perfiles_glaukov 
    SET mostrar = jsonb_set(COALESCE(mostrar, '{}'::jsonb), '{tasas}', 'true'::jsonb) 
    WHERE UPPER(TRIM(nombre)) = 'GENERAL';
  `);

  return { success: true, message: 'Todas las tasas de socios desactivadas correctamente.' };
}

export async function guardarSociosVigentes() {
  try {
    await pool.query(`ALTER TABLE perfiles_glaukov ADD COLUMN IF NOT EXISTS recordar_mostrar JSONB;`);
    await pool.query(`UPDATE perfiles_glaukov SET recordar_mostrar = mostrar;`);
    return { success: true, message: 'Plantilla de socios vigentes memorizada.' };
  } catch (error) {
    return { success: false, message: 'No se pudo memorizar la plantilla.' };
  }
}

export async function restaurarSociosVigentes() {
  try {
    await pool.query(`UPDATE perfiles_glaukov SET mostrar = COALESCE(recordar_mostrar, '{"tasas": false, "dashboard": false}'::jsonb);`);
    await pool.query(`
      UPDATE perfiles_glaukov 
      SET mostrar = jsonb_set(COALESCE(mostrar, '{}'::jsonb), '{tasas}', 'true'::jsonb) 
      WHERE UPPER(TRIM(nombre)) = 'GENERAL';
    `);
    return { success: true, message: 'Socios vigentes restaurados correctamente.' };
  } catch (error) {
    return { success: false, message: 'No se pudo restaurar la plantilla.' };
  }
}

export async function eliminarSocio(nombre) {
  if (!nombre) throw new Error('Nombre de socio requerido.');
  if (nombre.trim().toUpperCase() === 'GENERAL') {
    throw new Error('No se puede eliminar la entidad matriz GENERAL.');
  }

  const { rows } = await pool.query(
    `DELETE FROM perfiles_glaukov WHERE UPPER(TRIM(nombre)) = UPPER(TRIM($1)) RETURNING *;`,
    [nombre.trim()]
  );

  if (rows.length === 0) throw new Error('Socio no encontrado.');
  return rows[0];
}
