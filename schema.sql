-- Script di creazione tabelle per il database MySQL nativo di Hostinger
-- E-commerce: Greta Abbigliamento Monticelli (Segreta Style)

-- Selezione o creazione (indicativa) del database
-- CREATE DATABASE IF NOT EXISTS greta_abbigliamento;
-- USE greta_abbigliamento;

-- Tabella articoli
CREATE TABLE IF NOT EXISTS `articoli` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titolo` VARCHAR(255) NOT NULL,
  `descrizione` TEXT DEFAULT NULL,
  `prezzo` DECIMAL(10, 2) NOT NULL,
  `immagine_url` VARCHAR(255) DEFAULT NULL,
  `categoria` VARCHAR(100) DEFAULT NULL,
  `taglie` VARCHAR(255) DEFAULT NULL COMMENT 'Es: S,M,L,XL',
  `attivo` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabella ordini
CREATE TABLE IF NOT EXISTS `ordini` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome_cliente` VARCHAR(255) NOT NULL,
  `telefono` VARCHAR(50) NOT NULL,
  `indirizzo_spedizione` VARCHAR(255) NOT NULL,
  `metodo_pagamento` VARCHAR(100) NOT NULL,
  `metodo_consegna` VARCHAR(100) NOT NULL,
  `totale` DECIMAL(10, 2) NOT NULL,
  `dettaglio_articoli` TEXT NOT NULL COMMENT 'JSON o descrizione testuale degli articoli acquistati',
  `stato` VARCHAR(50) DEFAULT 'In attesa',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserimento di alcuni articoli di esempio per il primo avvio del catalogo
INSERT INTO `articoli` (`titolo`, `descrizione`, `prezzo`, `immagine_url`, `categoria`, `taglie`, `attivo`) VALUES
('Abito Lungo Floreale Spring', 'Abito lungo fresco e colorato, ideale per le serate estive. Fantasia floreale accesa.', 39.90, 'abito-floreale.jpg', 'Abiti', 'S,M,L', 1),
('Blusa Frizzante Pastel', 'Blusa in cotone leggero con maniche a sbuffo, colore pastello alla moda.', 24.90, 'blusa-pastello.jpg', 'Camicie e Bluse', 'M,L', 1),
('Jeans Skinny High Waste', 'Jeans denim elasticizzato a vita alta, vestibilità perfetta che valorizza la silhouette.', 34.90, 'jeans-skinny.jpg', 'Pantaloni', 'S,M,L,XL', 1),
('Giacca Kimono Chic', 'Giacca stile kimono con ricami floreali, perfetta per arricchire un look casual.', 45.00, 'giacca-kimono.jpg', 'Giacche', 'Unica', 1),
('T-Shirt Segreta Style', 'T-shirt in cotone biologico con stampa logo e dettagli ricamati in filo dorato.', 19.90, 'tshirt-logo.jpg', 'T-Shirt', 'S,M,L', 1);
