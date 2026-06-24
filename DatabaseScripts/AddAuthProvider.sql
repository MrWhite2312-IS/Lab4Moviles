-- Migración: agrega la columna auth_provider a la tabla users existente.
-- Distingue cuentas creadas con Google ('google') de las de registro normal ('local').

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'local';

-- Marca retroactivamente como 'google' las cuentas que no tienen contraseña
-- (creadas por el login de Google, que guarda password_hash vacío).
UPDATE users
SET auth_provider = 'google'
WHERE password_hash = '';
