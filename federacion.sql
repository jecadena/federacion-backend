-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 31-01-2025 a las 00:39:46
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `federacion`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `federacion`
--

CREATE TABLE `federacion` (
  `id` int(11) NOT NULL,
  `n_federacion` varchar(100) NOT NULL,
  `n_country` varchar(100) NOT NULL,
  `c_person` varchar(100) NOT NULL,
  `p_number` varchar(20) DEFAULT NULL,
  `email_address` varchar(150) NOT NULL,
  `mobile_number` varchar(20) NOT NULL,
  `n_address` varchar(255) NOT NULL,
  `n_hotel1` varchar(255) NOT NULL,
  `n_hotel2` varchar(255) NOT NULL,
  `n_hotel3` varchar(255) NOT NULL,
  `code_country` varchar(10) NOT NULL,
  `clave` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `federacion`
--

INSERT INTO `federacion` (`id`, `n_federacion`, `n_country`, `c_person`, `p_number`, `email_address`, `mobile_number`, `n_address`, `n_hotel1`, `n_hotel2`, `n_hotel3`, `code_country`, `clave`) VALUES
(13, 'Federación Peruana', 'Peru', 'juan pérez', '954875632', 'jperez@mail.com', '0984289798', 'Av. Javier Prado 122', 'HOTEL IBIS LARCO ***', '', '', '+51', '$2b$10$Yv4zGrZPLXMG8WTcq8tMyOI9zuD7SrXpEf..Gh4LjvhxeguVYofNa'),
(14, 'Federación Rusa', 'Russia', 'Usuario Ruso', '543234423', 'user@user.com', '0984289798', 'Shabolovka St, 42 корпус 5 Moskva, Rusia, 115419', 'JW Marriott Hotel Lima', '', '', '+7', '$2b$12$6OzytNlShLxq1qskwYywBOQwDDGrFfk9IhY8rNYGflA8zmdKDXmjC'),
(16, 'Federación Argentina', '+54', 'Pedro Granja', 'AR12345', 'pgranja@mail.com', '9878765645', 'Moreno 1270 1º Piso, Dpto. 109  Buenos Aires, Argentina', 'JW Marriott Hotel Lima', 'Hotel Belmond Miraflores Park', 'The Westin Lima Hotel & Convention Center', '+54', '$2b$10$6cCUvEiBf95AI.uJMksEj.judIGFP7Eq5laS1F9YTQDE4Z0L8V2MK'),
(17, 'British Federation', '+44', 'Mark Cavendish', 'UK12345', 'british@mail.com', '64523442', 'Bisham Abbey National Sports Centre,', 'JW Marriott Hotel Lima', 'Hotel Belmond Miraflores Park', 'Swissôtel Lima', '+44', '$2b$10$6cCUvEiBf95AI.uJMksEj.judIGFP7Eq5laS1F9YTQDE4Z0L8V2MK'),
(18, 'Federación Iraní', '+98', 'Abdaláh', 'IR12345', 'iran@mail.com', '534534543', 'Irán ', 'JW Marriott Hotel Lima', 'Hotel Belmond Miraflores Park', 'Swissôtel Lima', '+98', '$2b$10$yWP.Gczfr6TpZNDboV2OUOMoC8igNZfkiQZBm8KBas2JvkRtQoEDW');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `habitaciones`
--

CREATE TABLE `habitaciones` (
  `id` int(11) NOT NULL,
  `family_name` varchar(100) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `passport_number` varchar(50) DEFAULT NULL,
  `day_of_arrival` datetime NOT NULL,
  `day_of_departure` datetime NOT NULL,
  `federacion_id` int(11) DEFAULT NULL,
  `hotel_id` int(11) DEFAULT NULL,
  `tipo_habitacion_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `hoteles`
--

CREATE TABLE `hoteles` (
  `id` int(11) NOT NULL,
  `nombre_hotel` varchar(100) NOT NULL,
  `codigo_hotel` varchar(20) NOT NULL,
  `federacion_id` int(11) DEFAULT NULL,
  `f_registro` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `hoteles`
--

INSERT INTO `hoteles` (`id`, `nombre_hotel`, `codigo_hotel`, `federacion_id`, `f_registro`) VALUES
(1, 'HOTEL IBIS LARCO ***', 'H0001', 13, '2025-01-24 15:34:11'),
(42, 'JW Marriott Hotel Lima', 'H0002', 14, '2025-01-27 17:39:16'),
(50, 'Swissôtel Lima', 'H4', 17, '2025-01-30 21:34:07'),
(51, 'JW Marriott Hotel Lima', 'H5', 16, '2025-01-30 21:35:54');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_habitacion`
--

CREATE TABLE `tipo_habitacion` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `codigo` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `de_email` varchar(50) NOT NULL,
  `de_password` varchar(150) NOT NULL,
  `de_nom_solicitante` varchar(80) NOT NULL,
  `de_pat_solicitante` varchar(20) NOT NULL,
  `de_fecha` datetime NOT NULL,
  `co_cia` varchar(2) NOT NULL,
  `co_tip_maestro` varchar(5) NOT NULL,
  `co_maestro` varchar(5) NOT NULL,
  `co_solicitante` varchar(5) NOT NULL,
  `no_role` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `de_email`, `de_password`, `de_nom_solicitante`, `de_pat_solicitante`, `de_fecha`, `co_cia`, `co_tip_maestro`, `co_maestro`, `co_solicitante`, `no_role`) VALUES
(1, 'jeffreycadena@gmail.com', '12345', 'Jeffrey Cadena', '1201177', '2024-07-14 19:14:14', '01', '01', '12011', '0001', 'ADMIN'),
(2, 'admin@actours.com.pe', '12345', 'AcTours', 'Apps', '2025-01-28 20:20:13', '01', '01', '01', '01', 'ADMIN');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `federacion`
--
ALTER TABLE `federacion`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `habitaciones`
--
ALTER TABLE `habitaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `federacion_id` (`federacion_id`),
  ADD KEY `hotel_id` (`hotel_id`),
  ADD KEY `tipo_habitacion_id` (`tipo_habitacion_id`);

--
-- Indices de la tabla `hoteles`
--
ALTER TABLE `hoteles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `federacion_id` (`federacion_id`);

--
-- Indices de la tabla `tipo_habitacion`
--
ALTER TABLE `tipo_habitacion`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `federacion`
--
ALTER TABLE `federacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de la tabla `habitaciones`
--
ALTER TABLE `habitaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `hoteles`
--
ALTER TABLE `hoteles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT de la tabla `tipo_habitacion`
--
ALTER TABLE `tipo_habitacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `habitaciones`
--
ALTER TABLE `habitaciones`
  ADD CONSTRAINT `habitaciones_ibfk_1` FOREIGN KEY (`federacion_id`) REFERENCES `federacion` (`id`),
  ADD CONSTRAINT `habitaciones_ibfk_2` FOREIGN KEY (`hotel_id`) REFERENCES `hoteles` (`id`),
  ADD CONSTRAINT `habitaciones_ibfk_3` FOREIGN KEY (`tipo_habitacion_id`) REFERENCES `tipo_habitacion` (`id`);

--
-- Filtros para la tabla `hoteles`
--
ALTER TABLE `hoteles`
  ADD CONSTRAINT `hoteles_ibfk_1` FOREIGN KEY (`federacion_id`) REFERENCES `federacion` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
