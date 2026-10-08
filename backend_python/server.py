"""
Servidor Backend Python (Flask) REST API para o GravApp
Porta: 3000
Guarda ficheiros em uploads/ e metadados em data.json
Equivalência total com o servidor Node.js Express.
"""

import os
import json
import time
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Inicialização do aplicativo Flask
app = Flask(__name__)

# Permitir requisições de qualquer origem (CORS)
CORS(app)

# Limite máximo de payload de upload para 50MB por razões de segurança
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

# Diretórios de trabalho
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
DATA_FILE = os.path.join(BASE_DIR, 'data.json')

# Criar a pasta de uploads se não existir
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Criar o ficheiro data.json se não existir
if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f)

# Extensões de ficheiros permitidas para validação de segurança
ALLOWED_AUDIO_EXTENSIONS = {'m4a', 'mp3', 'wav', 'aac', 'ogg', 'caf', '3gp', 'flac'}
ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'gif'}


def extensao_permitida(filename, extensoes_validas):
    """Valida se o ficheiro possui uma extensão de ficheiro válida."""
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in extensoes_validas


def ler_dados():
    """Lê a lista de metadados do ficheiro data.json."""
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            conteudo = f.read()
            return json.loads(conteudo) if conteudo.strip() else []
    except Exception as e:
        print(f"Erro ao ler data.json: {e}")
        return []


def salvar_dados(dados):
    """Guarda a lista de metadados no ficheiro data.json."""
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(dados, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Erro ao salvar data.json: {e}")


# ============================================================
# ROTA ESTÁTICA SEGURO PARA SERVIR OS UPLOADS
# ============================================================
@app.route('/uploads/<path:filename>', methods=['GET'])
def servir_upload(filename):
    """Serve ficheiros da pasta uploads/ de forma segura sem permitir path traversal."""
    return send_from_directory(UPLOAD_FOLDER, filename)


# ============================================================
# ENDPOINTS DA REST API
# ============================================================

@app.route('/api/audios', methods=['GET'])
def listar_audios():
    """
    GET /api/audios
    Função: Listar todos os áudios registados na API.
    """
    dados = ler_dados()
    return jsonify(dados), 200


@app.route('/api/audios/<id_audio>', methods=['GET'])
def obter_audio(id_audio):
    """
    GET /api/audios/<id>
    Função: Obter os detalhes de um áudio específico pelo ID.
    """
    dados = ler_dados()
    audio = next((item for item in dados if str(item.get('id')) == str(id_audio)), None)

    if not audio:
        return jsonify({'erro': 'Áudio não encontrado'}), 404

    return jsonify(audio), 200


@app.route('/api/audios', methods=['POST'])
def criar_audio():
    """
    POST /api/audios
    Função: Fazer upload de um novo ficheiro de áudio e registar os metadados.
    """
    try:
        dados = ler_dados()

        # Obter os campos enviados no multipart/form-data
        nome = request.form.get('nome', '')
        duracao = request.form.get('duracao', 0)
        data_str = request.form.get('data', '')
        hora_str = request.form.get('hora', '')
        id_personalizado = request.form.get('id', '')

        novo_id = str(id_personalizado) if id_personalizado else str(int(time.time() * 1000))

        # Obter o ficheiro de áudio do pedido
        ficheiro_audio = request.files.get('audio') or request.files.get('file')
        uri_relativa = ''

        if ficheiro_audio and ficheiro_audio.filename != '':
            if not extensao_permitida(ficheiro_audio.filename, ALLOWED_AUDIO_EXTENSIONS):
                return jsonify({'erro': 'Formato de ficheiro de áudio não permitido'}), 400

            nome_original = secure_filename(ficheiro_audio.filename)
            ext = os.path.splitext(nome_original)[1] or '.m4a'
            nome_unico = f"audio-{novo_id}-{int(time.time())}{ext}"
            caminho_completo = os.path.join(UPLOAD_FOLDER, nome_unico)

            ficheiro_audio.save(caminho_completo)
            uri_relativa = f"/uploads/{nome_unico}"

        agora = datetime.now()
        data_formatada = data_str if data_str else agora.strftime('%d/%m/%Y')
        hora_formatada = hora_str if hora_str else agora.strftime('%H:%M')

        novo_audio = {
            'id': novo_id,
            'nome': nome if nome else f"Áudio {hora_formatada}",
            'duracao': float(duracao) if duracao else 0,
            'data': data_formatada,
            'hora': hora_formatada,
            'uri': uri_relativa,
            'imagem': None,
            'criadoEm': agora.isoformat()
        }

        # Adicionar o novo áudio no início da lista
        dados.insert(0, novo_audio)
        salvar_dados(dados)

        return jsonify(novo_audio), 201

    except Exception as e:
        print(f"Erro no upload do áudio: {e}")
        return jsonify({'erro': 'Erro interno ao salvar áudio', 'detalhe': str(e)}), 500


@app.route('/api/audios/<id_audio>/imagem', methods=['POST'])
def upload_imagem(id_audio):
    """
    POST /api/audios/<id>/imagem
    Função: Fazer upload de uma imagem de capa para um áudio específico.
    """
    try:
        dados = ler_dados()
        audio = next((item for item in dados if str(item.get('id')) == str(id_audio)), None)

        if not audio:
            return jsonify({'erro': 'Áudio não encontrado'}), 404

        ficheiro_imagem = request.files.get('imagem') or request.files.get('file')

        if not ficheiro_imagem or ficheiro_imagem.filename == '':
            return jsonify({'erro': 'Nenhum ficheiro de imagem enviado'}), 400

        if not extensao_permitida(ficheiro_imagem.filename, ALLOWED_IMAGE_EXTENSIONS):
            return jsonify({'erro': 'Formato de imagem não permitido'}), 400

        nome_original = secure_filename(ficheiro_imagem.filename)
        ext = os.path.splitext(nome_original)[1] or '.jpg'
        nome_unico = f"imagem-{id_audio}-{int(time.time())}{ext}"
        caminho_completo = os.path.join(UPLOAD_FOLDER, nome_unico)

        ficheiro_imagem.save(caminho_completo)
        audio['imagem'] = f"/uploads/{nome_unico}"

        salvar_dados(dados)
        return jsonify(audio), 200

    except Exception as e:
        print(f"Erro no upload da imagem: {e}")
        return jsonify({'erro': 'Erro interno ao salvar imagem', 'detalhe': str(e)}), 500


@app.route('/api/audios/<id_audio>', methods=['DELETE'])
def eliminar_audio(id_audio):
    """
    DELETE /api/audios/<id>
    Função: Eliminar um áudio pelo ID e remover os respetivos ficheiros do disco.
    """
    try:
        dados = ler_dados()
        audio = next((item for item in dados if str(item.get('id')) == str(id_audio)), None)

        if not audio:
            return jsonify({'erro': 'Áudio não encontrado'}), 404

        # Remover ficheiro de áudio do disco
        uri_audio = audio.get('uri', '')
        if uri_audio and uri_audio.startswith('/uploads/'):
            nome_ficheiro = uri_audio.replace('/uploads/', '')
            caminho_ficheiro = os.path.join(UPLOAD_FOLDER, nome_ficheiro)
            if os.path.exists(caminho_ficheiro):
                os.remove(caminho_ficheiro)

        # Remover imagem de capa do disco
        uri_imagem = audio.get('imagem', '')
        if uri_imagem and uri_imagem.startswith('/uploads/'):
            nome_imagem = uri_imagem.replace('/uploads/', '')
            caminho_imagem = os.path.join(UPLOAD_FOLDER, nome_imagem)
            if os.path.exists(caminho_imagem):
                os.remove(caminho_imagem)

        # Atualizar a lista sem o áudio eliminado
        novos_dados = [item for item in dados if str(item.get('id')) != str(id_audio)]
        salvar_dados(novos_dados)

        return jsonify({'mensagem': 'Áudio eliminado com sucesso', 'id': id_audio}), 200

    except Exception as e:
        print(f"Erro ao eliminar áudio: {e}")
        return jsonify({'erro': 'Erro interno ao eliminar áudio', 'detalhe': str(e)}), 500


@app.errorhandler(413)
def payload_too_large(e):
    """Tratador de erro para uploads que excedem o limite de 50MB."""
    return jsonify({'erro': 'Ficheiro demasiado grande. Limite máximo: 50MB'}), 413


if __name__ == '__main__':
    print("🚀 Servidor Backend Python (Flask) do GravApp a rodar na porta 3000...")
    print("http://localhost:3000/api/audios")
    app.run(host='0.0.0.0', port=3000, debug=True)
