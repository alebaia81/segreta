<?php
/**
 * API Backend per Segreta Style - Hostinger MySQL
 * Gestisce il CRUD degli articoli e il caricamento delle immagini WebP.
 */

// Abilita CORS per lo sviluppo locale
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Rispondi immediatamente alle richieste preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- CONFIGURAZIONE DATABASE MYSQL ---
define('DB_HOST', 'localhost');
define('DB_NAME', 'greta_abbigliamento'); // Sostituire con il nome reale del DB Hostinger
define('DB_USER', 'root');               // Sostituire con l'utente reale del DB Hostinger
define('DB_PASS', '');                   // Sostituire con la password reale del DB Hostinger

// Connessione al Database tramite PDO
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "error" => "Connessione al database fallita: " . $e->getMessage()
    ]);
    exit();
}

// Recupera l'azione richiesta
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'list':
        // GET: Elenco di tutti gli articoli
        try {
            $stmt = $pdo->query("SELECT * FROM articoli ORDER BY id DESC");
            $articoli = $stmt->fetchAll();
            echo json_encode([
                "success" => true,
                "data" => $articoli
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
        break;

    case 'add':
        // POST: Aggiunta di un nuovo articolo
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(["success" => false, "error" => "Metodo non consentito."]);
            break;
        }

        try {
            // Se i dati vengono inviati come JSON
            $input = json_decode(file_get_contents("php://input"), true);
            
            // Se i dati vengono inviati come form-data (ad esempio per l'upload di file diretto)
            $titolo = isset($_POST['titolo']) ? $_POST['titolo'] : (isset($input['titolo']) ? $input['titolo'] : '');
            $descrizione = isset($_POST['descrizione']) ? $_POST['descrizione'] : (isset($input['descrizione']) ? $input['descrizione'] : '');
            $prezzo = isset($_POST['prezzo']) ? floatval($_POST['prezzo']) : (isset($input['prezzo']) ? floatval($input['prezzo']) : 0.0);
            $categoria = isset($_POST['categoria']) ? $_POST['categoria'] : (isset($input['categoria']) ? $input['categoria'] : '');
            $taglie = isset($_POST['taglie']) ? $_POST['taglie'] : (isset($input['taglie']) ? $input['taglie'] : '');
            $immagine_url = isset($_POST['immagine_url']) ? $_POST['immagine_url'] : (isset($input['immagine_url']) ? $input['immagine_url'] : '');

            if (empty($titolo) || empty($prezzo) || empty($categoria)) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Campi obbligatori mancanti."]);
                break;
            }

            // Esegui inserimento
            $stmt = $pdo->prepare("INSERT INTO articoli (titolo, descrizione, prezzo, immagine_url, categoria, taglie, attivo) VALUES (?, ?, ?, ?, ?, ?, 1)");
            $stmt->execute([$titolo, $descrizione, $prezzo, $immagine_url, $categoria, $taglie]);
            
            $nuovoId = $pdo->lastInsertId();

            echo json_encode([
                "success" => true,
                "data" => [
                    "id" => $nuovoId,
                    "titolo" => $titolo,
                    "descrizione" => $descrizione,
                    "prezzo" => $prezzo,
                    "immagine_url" => $immagine_url,
                    "categoria" => $categoria,
                    "taglie" => $taglie,
                    "attivo" => true
                ]
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
        break;

    case 'toggle':
        // POST: Attiva/Disattiva visibilità articolo
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(["success" => false, "error" => "Metodo non consentito."]);
            break;
        }

        try {
            $input = json_decode(file_get_contents("php://input"), true);
            $id = isset($input['id']) ? intval($input['id']) : 0;

            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "ID articolo non valido."]);
                break;
            }

            // Recupera lo stato attuale per fare il toggle
            $stmt = $pdo->prepare("SELECT attivo FROM articoli WHERE id = ?");
            $stmt->execute([$id]);
            $attuale = $stmt->fetch();

            if (!$attuale) {
                http_response_code(404);
                echo json_encode(["success" => false, "error" => "Articolo non trovato."]);
                break;
            }

            $nuovoStato = $attuale['attivo'] ? 0 : 1;
            
            $update = $pdo->prepare("UPDATE articoli SET attivo = ? WHERE id = ?");
            $update->execute([$nuovoStato, $id]);

            echo json_encode([
                "success" => true,
                "id" => $id,
                "attivo" => $nuovoStato === 1
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
        break;

    case 'delete':
        // POST/DELETE: Elimina un articolo
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            http_response_code(405);
            echo json_encode(["success" => false, "error" => "Metodo non consentito."]);
            break;
        }

        try {
            $input = json_decode(file_get_contents("php://input"), true);
            $id = isset($input['id']) ? intval($input['id']) : 0;

            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "ID articolo non valido."]);
                break;
            }

            $stmt = $pdo->prepare("DELETE FROM articoli WHERE id = ?");
            $stmt->execute([$id]);

            echo json_encode([
                "success" => true,
                "message" => "Articolo eliminato con successo."
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
        break;

    case 'upload':
        // POST: Caricamento immagini WebP su storage NVMe
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(["success" => false, "error" => "Metodo non consentito."]);
            break;
        }

        if (!isset($_FILES['immagine'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Nessun file immagine caricato."]);
            break;
        }

        $file = $_FILES['immagine'];
        
        // Verifica errori di caricamento
        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Errore nel caricamento file: " . $file['error']]);
            break;
        }

        // Cartella di destinazione locale sul server Hostinger
        $uploadDir = './uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Estrai l'estensione e verifica il tipo
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'avif'];
        
        if (!in_array($extension, $allowed)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Estensione file non consentita. Solo immagini."]);
            break;
        }

        // Genera un nome unico per evitare sovrascritture
        $fileName = 'art_' . uniqid() . '.' . $extension;
        $destPath = $uploadDir . $fileName;

        if (move_uploaded_file($file['tmp_name'], $destPath)) {
            // Restituisce l'URL relativo per salvarlo nel database
            // Su Hostinger, la cartella uploads/ sarà nella root del sito, perciò '/uploads/nomefile.webp'
            $url = 'uploads/' . $fileName;
            echo json_encode([
                "success" => true,
                "url" => $url
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Impossibile spostare il file caricato nello storage."]);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Azione non riconosciuta o non specificata."]);
        break;
}
?>
