/**
 * Servidor Backend Express REST API para o GravApp
 * Porta: 3000
 * Armazena ficheiros em uploads/ e metadados em data.json
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para permitir requisições de outras origens (CORS) e processar JSON
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir ficheiros da pasta 'uploads' de forma estática via URL /uploads/nomeficheiro
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Ficheiro JSON de metadados
const DATA_FILE = path.join(__dirname, 'data.json');
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Configuração do Multer para guardar os uploads com nomes únicos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const sufixo = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.m4a';
    cb(null, file.fieldname + '-' + sufixo + ext);
  },
});

const upload = multer({ storage });

// Função auxiliar para ler os dados do ficheiro data.json
function lerDados() {
  try {
    const conteudo = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(conteudo || '[]');
  } catch (error) {
    console.error('Erro ao ler data.json:', error);
    return [];
  }
}

// Função auxiliar para salvar os dados no ficheiro data.json
function salvarDados(dados) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(dados, null, 2));
  } catch (error) {
    console.error('Erro ao salvar em data.json:', error);
  }
}

/**
 * ----------------------------------------------------
 * ENDPOINTS REST API
 * ----------------------------------------------------
 */

/**
 * GET /api/audios
 * Função: Listar todos os áudios registados na API
 */
app.get('/api/audios', (req, res) => {
  const audios = lerDados();
  res.json(audios);
});

/**
 * GET /api/audios/:id
 * Função: Obter os detalhes de um áudio pelo seu ID
 */
app.get('/api/audios/:id', (req, res) => {
  const audios = lerDados();
  const audio = audios.find((item) => String(item.id) === String(req.params.id));

  if (!audio) {
    return res.status(404).json({ erro: 'Áudio não encontrado' });
  }

  res.json(audio);
});

/**
 * POST /api/audios
 * Função: Fazer upload de um novo ficheiro de áudio e salvar metadados
 * Recebe o ficheiro no campo 'audio' (ou 'file') e dados no req.body
 */
app.post('/api/audios', upload.single('audio'), (req, res) => {
  try {
    const audios = lerDados();
    const { nome, duracao, data, hora, id } = req.body;

    const novoId = id || Date.now().toString();
    const uriFicheiro = req.file ? `/uploads/${req.file.filename}` : req.body.uri || '';

    const novoAudio = {
      id: novoId,
      nome: nome || `Áudio ${novoId}`,
      duracao: Number(duracao) || 0,
      data: data || new Date().toLocaleDateString('pt-PT'),
      hora: hora || new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      uri: uriFicheiro,
      imagem: null,
      criadoEm: new Date().toISOString(),
    };

    audios.unshift(novoAudio);
    salvarDados(audios);

    res.status(201).json(novoAudio);
  } catch (error) {
    console.error('Erro no upload de áudio:', error);
    res.status(500).json({ erro: 'Erro interno ao salvar áudio' });
  }
});

/**
 * POST /api/audios/:id/imagem
 * Função: Fazer upload de uma imagem de capa para um áudio específico
 * Recebe o ficheiro de imagem no campo 'imagem' (ou 'file')
 */
app.post('/api/audios/:id/imagem', upload.single('imagem'), (req, res) => {
  try {
    const audios = lerDados();
    const index = audios.findIndex((item) => String(item.id) === String(req.params.id));

    if (index === -1) {
      return res.status(404).json({ erro: 'Áudio não encontrado' });
    }

    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhum ficheiro de imagem enviado' });
    }

    const uriImagem = `/uploads/${req.file.filename}`;
    audios[index].imagem = uriImagem;
    salvarDados(audios);

    res.json(audios[index]);
  } catch (error) {
    console.error('Erro no upload de imagem:', error);
    res.status(500).json({ erro: 'Erro interno ao salvar imagem' });
  }
});

/**
 * DELETE /api/audios/:id
 * Função: Eliminar um áudio pelo ID e remover os ficheiros do disco
 */
app.delete('/api/audios/:id', (req, res) => {
  try {
    let audios = lerDados();
    const audio = audios.find((item) => String(item.id) === String(req.params.id));

    if (!audio) {
      return res.status(404).json({ erro: 'Áudio não encontrado' });
    }

    // Remover ficheiro de áudio se existir no disco
    if (audio.uri && audio.uri.startsWith('/uploads/')) {
      const caminhoAudio = path.join(__dirname, audio.uri);
      if (fs.existsSync(caminhoAudio)) {
        fs.unlinkSync(caminhoAudio);
      }
    }

    // Remover imagem de capa se existir no disco
    if (audio.imagem && audio.imagem.startsWith('/uploads/')) {
      const caminhoImagem = path.join(__dirname, audio.imagem);
      if (fs.existsSync(caminhoImagem)) {
        fs.unlinkSync(caminhoImagem);
      }
    }

    audios = audios.filter((item) => String(item.id) !== String(req.params.id));
    salvarDados(audios);

    res.json({ mensagem: 'Áudio eliminado com sucesso', id: req.params.id });
  } catch (error) {
    console.error('Erro ao eliminar áudio:', error);
    res.status(500).json({ erro: 'Erro interno ao eliminar áudio' });
  }
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor API REST do GravApp a rodar na porta ${PORT}`);
  console.log(`http://localhost:${PORT}/api/audios`);
});
